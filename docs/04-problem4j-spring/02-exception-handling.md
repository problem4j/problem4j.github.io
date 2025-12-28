---
sidebar_position: 2
---

# Exception Handling

There are three main ways of returning `application/problem+json` responses from application exceptions. You can either
extend `ProblemException`, annotate your exception with `@ProblemMapping` or implement `ProblemResolver` and declare it
as a component.

This chapter also describes a few build-in Spring features are also integrated with returning `Problem` objects, however
the top three are the most recommended

Following subchapters dive deeper into these solutions.

## Extending `ProblemException`

If you use `ProblemException`, or your exceptions extend `ProblemException`, the library will automatically use the
`Problem` instance provided by the exception when building the response. This is useful when you want full programmatic
control over the `Problem` object.

```java
throw new ProblemException(
    Problem.builder()
        .type("https://example.org/errors/invalid-request")
        .title("Invalid Request")
        .status(400)
        .detail("not a valid json")
        .instance("https://example.org/instances/1234")
        .build());
```

Will result in following response body:

```json
{
  "type" : "https://example.org/errors/invalid-request",
  "title" : "Invalid Request",
  "status" : 400,
  "detail" : "not a valid json",
  "instance" : "https://example.org/instances/1234"
}
```

For convenience, consider subclassing `ProblemException` and encapsulating building `Problem` object within.

## Annotating `@ProblemMapping`

For exceptions that cannot extend `ProblemException`, you can annotate them with `@ProblemMapping`. This allows you to
declaratively map exception fields to a `Problem`.

To extract values from target exception, it's possible to use placeholders for interpolation.

- `{message}` - the exact `getMessage()` result from your exception,
- `{context.traceId}` - the `context.getTraceId()` result for tracking error response with the actual request. The
- `context` is something that is build in `@RestControllerAdvice`s and it contains processing metadata. Currently only
- `traceId` is supported,
- `{fieldName}` - any field name declared in exceptions and its superclasses (scanned from current class to its most
  outer one).

```java
@ProblemMapping(
    type = "https://example.org/errors/invalid-request",
    title = "Invalid Request",
    status = 400,
    detail = "{message}: {fieldName}",
    instance = "https://example.org/instances/{context.traceId}",
    extensions = {"userId", "fieldName"})
public class ExampleException extends RuntimeException {

  private final String userId;
  private final String fieldName;

  public ExampleException(String userId, String fieldName) {
    super("bad input for user " + userId);
    this.userId = userId;
    this.fieldName = fieldName;
  }
}
```

Will result in following response body:

```json
{
  "type" : "https://example.org/errors/invalid-request",
  "title" : "Invalid Request",
  "status" : 400,
  "detail" : "bad input for user 123: email",
  "instance" : "https://example.org/instances/trace-789",
  "userId" : "123",
  "fieldName" : "email"
}
```

**Note** that `@ProblemMapping` is inherited in subclasses so it's possible to rely on it for building exception classes
hierarchy.

## Implementing `ProblemResolver`

For exceptions, you can't modify, the primary way to integrate with Problem4J to create custom `ProblemResolver`
and declare it as `@Component`.

`ProblemResolver` is an interface used by Problem4J's build-in `@RestControllerAdvice`-s that return `Problem` objects
in response entity. After declaring it as a component for dependency injection, it will be loaded into
`ProblemResolverStore`.

```java
@Component
public class ExampleExceptionResolver implements ProblemResolver {

  @Override
  public Class<? extends Exception> getExceptionClass() {
    return ExampleException.class;
  }

  @Override
  public ProblemBuilder resolveBuilder(
      ProblemContext context, Exception ex, HttpHeaders headers, HttpStatusCode status) {
    ExampleException e = (ExampleException) ex;
    return Problem.builder()
        .type("https://example.org/errors/invalid-request")
        .title("Invalid Request")
        .status(400)
        .detail("bad input for user " + e.getUserId())
        .instance("https://example.org/instances/" + context.getTraceId())
        .extension("userId", e.getUserId())
        .extension("fieldName", e.getFieldName());
  }
}
```

Will result in following response body:

```json
{
  "type" : "https://example.org/errors/invalid-request",
  "title" : "Invalid Request",
  "status" : 400,
  "detail" : "bad input for user 123",
  "instance" : "https://example.org/instances/trace-789",
  "userId" : "123",
  "fieldName" : "email"
}
```

You can also override existing `ProblemResolver` implementations to extend models provided by this module. Build-in
resolvers come with `@ConditionalOnMissingBean`, so they can be shadowed by custom ones in target applications.

`ProblemResolver` implementations return a `ProblemBuilder` for flexibility in constructing the final `Problem` object.
It's a convenience method for further extending `Problem` object by processing downstream.

## Custom `@RestControllerAdvice`

While creating your own `@RestControllerAdvice`, make sure to position it with right `@Order`. In order for your custom
implementation to work seamlessly, make sure to position it on at least **`Ordered.LOWEST_PRECEDENCE - 11`** (the lower
the value, the higher the priority). All `@RestControllerAdvice` provided by `problem4j-spring` library use ordering
from `Ordered.LOWEST_PRECEDENCE` to `Ordered.LOWEST_PRECEDENCE - 10`.

If you want your advice to override the ones provided by this library, use a smaller order value (e.g.
`Ordered.LOWEST_PRECEDENCE - 11` or `Ordered.HIGHEST_PRECEDENCE` if you really mean it).

| <center>covered exceptions</center>             | <center>`@Order(...)`</center>   |
|-------------------------------------------------|----------------------------------|
| Spring's internal exceptions                    | `Ordered.LOWEST_PRECEDENCE - 10` |
| `ProblemException`                              | `Ordered.LOWEST_PRECEDENCE - 10` |
| `Exception` (fallback for all other exceptions) | `Ordered.LOWEST_PRECEDENCE`      |

While implementing custom `@ControllerAdvice`, don't forget of calling `ProblemPostProcessor` manually, before returning
`Problem` object.

```java
@Order(Ordered.LOWEST_PRECEDENCE - 20)
@Component
@RestControllerAdvice
public class ExampleExceptionAdvice {

  private final ProblemPostProcessor problemPostProcessor;

  // constructor

  @ExceptionHandler(ExampleException.class)
  public ResponseEntity<Problem> handleExampleException(ExampleException ex, WebRequest request) {
    ProblemContext context = (ProblemContext) request.getAttribute(PROBLEM_CONTEXT, SCOPE_REQUEST);
    if (context == null) {
      context = ProblemContext.empty();
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PROBLEM_JSON);

    Problem problem =
        Problem.builder()
            .type("https://example.org/errors/invalid-request")
            .title("Invalid Request")
            .status(400)
            .detail(ex.getMessage())
            .instance("https://example.org/instances/" + context.getTraceId())
            .extension("userId", e.getUserId())
            .extension("fieldName", e.getFieldName())
            .build();
    problem = problemPostProcessor.process(context, problem);

    HttpStatus status = ProblemSupport.resolveStatus(problem.getStatus());

    return new ResponseEntity<>(problem, headers, status);
  }
}
```

Will result in following response body:

```json
{
  "type" : "https://example.org/errors/invalid-request",
  "title" : "Invalid Request",
  "status" : 400,
  "detail" : "bad input for user 123",
  "instance" : "https://example.org/instances/trace-789",
  "userId" : "123",
  "fieldName" : "email"
}
```

## Spring's build-in `@ResponseStatus` annotation

If your exception is annotated with Spring's built-in `@ResponseStatus`, the library will use the specified HTTP status
and reason (if provided) when building the `Problem` response. The `title` field will be set to the standard reason
phrase for the status code, and the `detail` field will be set to the `reason` specified in the annotation. No
interpolation of fields is supported for this annotation (if you need that, consider using `@ProblemMapping` instead).

```java
@ResponseStatus(code = HttpStatus.NOT_FOUND, reason = "reason: resource not found")
public class ResourceNotFoundException extends RuntimeException {
  public ResourceNotFoundException(String resourceId) {
    super("Resource with ID " + resourceId + " not found");
  }
}
```

Will result in following response body:

```json
{
  "status" : 404,
  "title" : "Not Found",
  "detail" : "reason: resource not found"
}
```

## Using `problem4j-core`

If you can't use `problem4j-spring` (or don't want to), but the idea of `Problem` objects is appealing to you, you may
want to consider relying purely on [`problem4j-core`][problem4j-core] and [`problem4j-jackson`][problem4j-jackson]
libraries. You can build any mechanism for resolving exceptions into `Problem` objects yourself, depending on your own
frameworks, requirements or any other policies. See other documentation pages for more details about using other
Problem4J modules without Problem4J Spring integration.

[problem4j-core]: https://github.com/problem4j/problem4j-core

[problem4j-jackson]: https://github.com/problem4j/problem4j-jackson
