---
sidebar_position: 2
sidebar_custom_props:
  icon: 🧩
---

# Gradual Adoption & Custom Advices

Using only a part of Problem4J Spring, with your own `@RestControllerAdvice`.

:::info

Since `3.1.0`, as it relies on [`ProblemOperations`](../04-problem4j-spring/07-additional-features.md#problemoperations).

:::

Problem4J Spring works out of the box, but you don't have to take all of it. You may want to start with a few
exceptions, keep your own error format for others, or only reuse the post-processing convention (`type`, `instance`,
trace identifier etc.) in advices you already have. `ProblemOperations` is a facade over the machinery used by
Problem4J's own advices, so a custom `@RestControllerAdvice` can do all of this without wiring `ProblemMapper`,
`ProblemResolverStore` and `ProblemPostProcessor` by hand.

| I want to...                                                      | Use                                         |
|-------------------------------------------------------------------|---------------------------------------------|
| [Post-process a `Problem` I created](#1-post-process-a-problem)   | `postProcess(context, problem)`             |
| [Post-process a `ProblemDetail`](#2-post-process-a-problemdetail) | `postProcess(context, detail)`              |
| [Handle a few exceptions with Problem4J](#3-start-with-a-few-exceptions) | `translate(context, ex, headers)`    |
| [Return a completely different object](#4-return-a-different-object)     | nothing, Problem4J stays out of it   |

## 1. Post-process a `Problem`

If you build the `Problem` yourself and only want the configured post-processing applied (see
[Problem Post-Processor](../04-problem4j-spring/06-problem-post-processor.md)), call `postProcess`.

```java
@RestControllerAdvice
public class OrderAdvice {

  private final ProblemOperations problemOperations;

  public OrderAdvice(ProblemOperations problemOperations) {
    this.problemOperations = problemOperations;
  }

  @ExceptionHandler(OrderNotFoundException.class)
  public ResponseEntity<Problem> handle(OrderNotFoundException ex, ProblemContext context) {
    Problem problem =
        Problem.builder().title("Order Not Found").status(404).detail("No order " + ex.getId()).build();

    problem = problemOperations.postProcess(context, problem);

    return ResponseEntity.status(problem.getStatus())
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .body(problem);
  }
}
```

Building the response is on you: the content type, the HTTP status and the body.

The `context` argument is nullable, so `postProcess` works also if no `ProblemContext` is available. Declaring the
parameter in the handler method is the simplest way to get one, see
[Accessing `ProblemContext` in Controllers](../04-problem4j-spring/07-additional-features.md#accessing-problemcontext-in-controllers).
In `@ExceptionHandler` methods it can be declared as `ProblemContext`, `Optional<ProblemContext>` and, in WebFlux,
`Mono<ProblemContext>`. Without the context filter, it's `null` (or empty).

## 2. Post-process a `ProblemDetail`

If you already return Spring's `ProblemDetail`, the same post-processing convention can be applied to it. The
`ProblemDetail` is modified **in place**, its type (including subclasses) is retained, and the same instance is
returned.

```java
@ExceptionHandler(OrderNotFoundException.class)
public ProblemDetail handle(OrderNotFoundException ex, ProblemContext context) {
  ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "No order " + ex.getId());

  return problemOperations.postProcess(context, detail);
}
```

Spring renders the result as `application/problem+json` on its own. There are a few things to know:

- **Status is not written back.** It was already used for the response, so a post-processor changing `status` of
  the `Problem` has no effect on a `ProblemDetail`.
- **`about:blank` type is written back as `null`.** These are equivalent according to RFC 9457, and Spring omits the
  member in the response as well.
- **Properties become extensions** during post-processing and are written back as properties.

## 3. Start with a few exceptions

To use Problem4J for chosen exceptions only, disable the built-in advices and handle the exceptions you want in your
own advice. Leaving them enabled works too, but then your advice has to take precedence over them, see
[the order of advices](#4-return-a-different-object). `ProblemOperations` stays available even if the advices are
disabled.

```properties
# WebMVC
problem4j.webmvc.exception-handler.enabled=false
problem4j.webmvc.problem-exception-advice.enabled=false
problem4j.webmvc.exception-advice.enabled=false

# WebFlux
problem4j.webflux.exception-handler.enabled=false
problem4j.webflux.problem-exception-advice.enabled=false
problem4j.webflux.exception-advice.enabled=false
```

| Property                                      | Disables                                                                  |
|-----------------------------------------------|---------------------------------------------------------------------------|
| `problem4j.<web>.exception-handler.enabled`        | Handling of exceptions of Spring itself (`ResponseEntityExceptionHandler`). |
| `problem4j.<web>.problem-exception-advice.enabled` | Handling of `ProblemException`.                                      |
| `problem4j.<web>.exception-advice.enabled`         | Catch-all handling of any other exception, as `500`.                 |

Do not use `problem4j.enabled=false` for this, because it disables the whole auto-configuration, including the
`ProblemOperations` bean.

Then call `translate` for exceptions that Problem4J should handle: `ProblemException`, `@ProblemMapping` annotated
exceptions, exceptions with a registered `ProblemResolver` (also your own), `@ResponseStatus` annotated exceptions and
Spring's `ErrorResponse`.

```java
@RestControllerAdvice
public class ProblemAdvice {

  private final ProblemOperations problemOperations;

  public ProblemAdvice(ProblemOperations problemOperations) {
    this.problemOperations = problemOperations;
  }

  @ExceptionHandler({OrderNotFoundException.class, PaymentFailedException.class})
  public ResponseEntity<Problem> handle(Exception ex, ProblemContext context) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PROBLEM_JSON);

    Problem problem = problemOperations.translate(context, ex, headers);

    return new ResponseEntity<>(problem, headers, HttpStatus.valueOf(problem.getStatus()));
  }
}
```

`headers` must be modifiable, because headers of `ErrorResponse` and those added by resolvers are copied into it.
`translate` is `resolve` followed by `postProcess`, so to change something in between, call them separately.

`translate` handles **any** exception, and one unknown to Problem4J becomes a plain `500 Internal Server Error`. Use
`supports(ex)` if you need to tell which exceptions Problem4J knows about.

:::warning

An advice written like this does **not** invoke inspectors (`AdviceWebMvcInspector` / `AdviceWebFluxInspector`), as
they are a part of the built-in advices, not of `ProblemOperations`. If you rely on them, e.g. for logging, do it in
your advice. The same goes for falling back to `500` if resolving or post-processing throws.

:::

## 4. Return a different object

For an exception that should produce an entirely different response, don't call `ProblemOperations` at all. Your
`@ExceptionHandler` is plain Spring.

```java
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LegacyApiAdvice {

  @ExceptionHandler(LegacyException.class)
  public ResponseEntity<LegacyError> handle(LegacyException ex) {
    return ResponseEntity.status(409).body(new LegacyError(ex.getCode(), ex.getMessage()));
  }
}
```

:::warning

Mind the order of advices. Built-in advices have `@Order(Ordered.LOWEST_PRECEDENCE - 10)`, which wins over an advice
without `@Order`. Exceptions handled by `ProblemResponseEntityExceptionHandler`, like
`MethodArgumentNotValidException`, would still be rendered as `Problem`. To take over such an exception, declare
`@Order` with a lower value on your advice (as above), restrict it to chosen controllers with
`@RestControllerAdvice(assignableTypes = ...)` and `@Order`, or disable the built-in advice with the property from
the previous section.

:::

The same goes for a single controller: an `@ExceptionHandler` method declared in the controller itself always takes
precedence over any advice.
