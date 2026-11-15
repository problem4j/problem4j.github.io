---
sidebar_position: 7
sidebar_custom_props:
  icon: 🧩
---

# Additional Features

Additional features of Problem4J Spring.

## Resolver Caching

Resolving an exception involves finding the correct `ProblemResolver` by walking through the exception’s inheritance
hierarchy - since resolvers can be defined generically for base exception types. This lookup process can involve
reflection and multiple comparisons, which may introduce overhead when performed frequently (e.g., in high-throughput
applications).

To improve performance, the resolver lookup results can be cached. Once an exception type has been resolved, the
corresponding resolver is stored in a cache, allowing subsequent resolutions of the same type to be served instantly
without re-evaluating the inheritance chain.

Available configuration properties:

- [`problem4j.resolver-caching.enabled`](./01-setting-up-and-configuration.md#problem4jresolver-cachingenabled)

The caching mechanism in `CachingProblemResolverStore` uses a `ConcurrentHashMap` to avoid external dependencies. This
is intentionally minimalistic and users can override it by supplying your own `ProblemResolverStore` implementation,
backed by a proper caching provider and declaring it as `@Component` (all `@Bean`-s provided by this library are
`@ConditionalOnMissingBean`).

**Example:**

```properties
problem4j.resolver-caching.enabled=true
```

Notes:

- As the number of exception types does not increase at runtime, the cache is unbounded by design and safe to enable.
- Leave disabled if startup / reflection cost is negligible or resolver set is highly dynamic.

## Tracing

Problem4J assigns a trace identifier to every request and stores it in `ProblemContext` under `traceId` key. It's
available as `{context.traceId}` placeholder in [overrides](./06-problem-post-processor.md) and `@ProblemMapping`, and
in `ProblemResolver` implementations, which helps to resolve the `instance` field, or to find an error reported by a
client in application logs. Where the trace identifier comes from is decided by
[`problem4j.tracing-source`](./01-setting-up-and-configuration.md#problem4jtracing-source) property.

- `auto` (default) - `micrometer` if `io.micrometer:micrometer-tracing` is on the classpath, `simple` otherwise.
- `simple` - trace identifier is taken from the HTTP header configured with
  [`problem4j.tracing-header-name`](./01-setting-up-and-configuration.md#problem4jtracing-header-name), or
  generated as a random UUID without dashes.
- `micrometer` - trace identifier is taken from the current Micrometer Tracing span (with OpenTelemetry or Brave
  bridge), so it's the same one that appears in logs. If the trace identifier comes from the span, span identifier of
  the server span is stored under `spanId` key as well, so both always belong to the same trace. Application startup
  fails if `io.micrometer:micrometer-tracing` is not on the classpath, unless a custom `ProblemContextFilter` /
  `ProblemContextWebFilter` bean is defined (see the note on renamed filters below).

With `micrometer` source, the trace identifier is resolved in the following order.

1. Trace identifier already stored in request attributes (`AttributeSupport.TRACE_ID_ATTRIBUTE`), e.g. by another
   filter.
2. Trace identifier of the current span.
3. Value of the `problem4j.tracing-header-name` header.
4. Newly generated trace identifier.

Header and generated values are used only if no span is available, e.g. if observation is disabled for the request, or
no tracing bridge is present (`Tracer.NOOP` spans have an empty trace identifier, so they're ignored). If a client sends
W3C `traceparent` header, the trace it carries is continued, so the incoming trace identifier is used.

If `problem4j.tracing-header-name` is set, the trace identifier is also written into the response header with
that name, regardless of the source.

```properties
problem4j.tracing-header-name=X-Trace-Id
problem4j.extension-overrides.traceId={context.traceId}
```

**Note** that `problem4j.tracing-header-name=traceparent` is not a way to use W3C trace context. With `simple` source,
Problem4J would take the whole header value (`00-<traceId>-<spanId>-01`) as the trace identifier and echo it back in the
response. Use `micrometer` source (or `auto` with Micrometer Tracing on the classpath) instead.

**Note** that in WebFlux (including Kotlin coroutines), `traceId` and `spanId` appear in the logging MDC only with
`spring.reactor.context-propagation=auto`, so that the trace context is propagated from Reactor context to thread
locals. Problem4J doesn't need it, as it takes the span from the server observation, but without it logs written while
handling a request won't carry the same trace identifier as `ProblemContext`. In WebMVC, MDC is populated by Micrometer
Tracing without any extra configuration.

`ProblemContextWebMvcFilter` / `ProblemContextWebFluxFilter` (`simple`) are the actual implementations. **Note** that
these can be extended and replaced, as all `@Bean`-s provided by this library are marked with
`@ConditionalOnMissingBean`.

:::info

Since `3.1.0`, `ProblemContextWebMvcFilter` and `ProblemContextWebFluxFilter` are deprecated in favor of
`ProblemContextFilter` (WebMVC) and `ProblemContextWebFilter` (WebFlux), which they now extend. Existing subclasses and
beans keep working. The `micrometer` source is implemented by `MicrometerProblemContextFilter` and
`MicrometerProblemContextWebFilter`.

Filters implement `Ordered`, with `PRECEDENCE` constant (`Ordered.HIGHEST_PRECEDENCE + 10`) changeable with
`setOrder(int)`. They run after Spring Boot's `ServerHttpObservationFilter` and before filters of the application with
default order, so errors thrown by those filters are rendered with the `traceId` as well.

:::

Available configuration properties:

- [`problem4j.tracing-source`](./01-setting-up-and-configuration.md#problem4jtracing-source)
- [`problem4j.tracing-header-name`](./01-setting-up-and-configuration.md#problem4jtracing-header-name)

### Custom Tracing Setup

The `micrometer` source supports only the server observation registered by Spring Boot. For other setups, either
override `findTraceContext` of `MicrometerProblemContextFilter` / `MicrometerProblemContextWebFilter` (the
`spanId` is then added automatically), or set `AttributeSupport.TRACE_ID_ATTRIBUTE` in your own filter running before
the Problem4J one (without `spanId`).

```java
@Bean
ProblemContextFilter problemContextFilter(ProblemProperties properties, Tracer tracer) {
  return new MicrometerProblemContextFilter(properties) {
    @Override
    protected Optional<TraceContext> findTraceContext(HttpServletRequest request) {
      return super.findTraceContext(request)
          .or(() -> Optional.ofNullable(tracer.currentSpan()).map(Span::context))
          .filter(trace -> !trace.traceId().isEmpty());
    }
  };
}
```

**Note** that `Tracer.currentSpan()` doesn't work in WebFlux filters, as the span lives in Reactor context, not in thread
locals.

### Customizing `ProblemContext`

:::info

Since `3.1.0`.

:::

`ProblemContextCustomizer` modifies the `ProblemContext` of a request, e.g. to add a custom request identifier, without
subclassing the context filter. Declare any number of them as beans - they are invoked in their order (`@Order` or
`Ordered`) as the last step of building a new context, so they may overwrite any entry, including `traceId`. Entries
added this way are available as `{context.<key>}` placeholders in [overrides](./06-problem-post-processor.md), and in
`ProblemResolver` implementations.

```java
@Component
public class RequestIdContextCustomizer implements ProblemContextCustomizer {

  @Override
  public void customize(
      ProblemContext context, HttpServletRequest request, HttpServletResponse response) {
    context.put("requestId", request.getHeader("X-Request-Id"));
  }
}
```

```properties
problem4j.extension-overrides.requestId={context.requestId}
```

In WebFlux, a customizer returns `Mono<Void>` and receives `ServerWebExchange`. `ProblemContextCustomizer.sync(...)`
creates one from a synchronous function.

```java
@Bean
ProblemContextCustomizer requestIdContextCustomizer() {
  return ProblemContextCustomizer.sync(
      (context, exchange) ->
          context.put("requestId", exchange.getRequest().getHeaders().getFirst("X-Request-Id")));
}
```

### Accessing `ProblemContext` in Controllers

Controller method parameters of `ProblemContext` type are resolved without any annotation, to the `ProblemContext`
assigned to the current request, the same one used for creating `Problem` responses. It's also available as
`@RequestAttribute(AttributeSupport.PROBLEM_CONTEXT_ATTRIBUTE)`, and the trace identifier alone as
`@RequestAttribute(AttributeSupport.TRACE_ID_ATTRIBUTE)`.

```java
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable String id, ProblemContext context) {
  log.info("Looking up order {} [traceId={}]", id, context.get("traceId"));
  // ...
}
```

Since `3.1.0`, the parameter can also be declared as `Optional<ProblemContext>`, and in WebFlux as
`Mono<ProblemContext>`. Wrappers resolve to an empty `Optional` / `Mono` if no `ProblemContext` is assigned.

```java
@GetMapping("/orders/{id}")
public Mono<Order> getOrder(@PathVariable String id, Mono<ProblemContext> context) {
  // ...
}
```

The parameter is `null` if no `ProblemContext` is assigned, which happens only if the context filter is disabled
(`problem4j.webmvc.problem-context-filter.enabled=false` or `problem4j.webflux.problem-context-filter.enabled=false`).
With the filter enabled (default), a non-nullable `ProblemContext` parameter is safe in Kotlin, also in `suspend`
functions.

## Observation Errors

:::info

Since `3.1.0`.

:::

Spring records exceptions in the HTTP server observation (used for `http.server.requests` metrics and server spans) only
if they're not handled by the web framework. As Problem4J handles exceptions in controller advices, without anything
else such requests would report `exception=none`, even with `5xx` responses.

To fix that, Problem4J records handled exceptions as errors of the current server observation, by setting them on its
`ServerRequestObservationContext` (as recommended by Spring for handled exceptions). The `exception` key of
`http.server.requests` metrics and server spans then contains the simple name of the exception class. Which exceptions
are recorded is decided by
[`problem4j.observation-errors`](./01-setting-up-and-configuration.md#problem4jobservation-errors) property.

- `server` (default) - exceptions resulting in a `5xx` response.
- `all` - all handled exceptions, regardless of the response status.
- `none` - no exceptions, as in versions prior to `3.1.0`.

```properties
problem4j.observation-errors=all
```

For example, `GET /orders` failing with an unexpected `IllegalStateException` produces a `500 Internal Server Error`
response, and `http.server.requests` metric with `exception=IllegalStateException` instead of `exception=none`.

Notes:

- An error already recorded in the observation context (e.g. by your own code) is never replaced.
- Error is set only on the observation context, so it shows up in key values (metric tags and span attributes), but
  observation handlers aren't notified with `onError`. With Micrometer Tracing, the span gets `exception` attribute, but
  its status isn't changed.
- Nothing happens if there is no server observation, e.g. without `ObservationRegistry` bean.

`ObservationErrorProblemInspector` (one in `io.github.problem4j.spring.webmvc` and one in
`io.github.problem4j.spring.webflux`) is the actual implementation, registered as a `ProblemInspector` bean (see
[Logging](./03-logging.md)). **Note** that these can be
replaced, as all `@Bean`-s provided by this library are marked with `@ConditionalOnMissingBean`, e.g. to record errors
based on a custom status predicate.

```java
@Bean
ObservationErrorProblemInspector observationErrorProblemInspector() {
  return new ObservationErrorProblemInspector(status -> status.isError() && status.value() != 404);
}
```

Available configuration properties:

- [`problem4j.observation-errors`](./01-setting-up-and-configuration.md#problem4jobservation-errors)



## `ProblemOperations`

:::info

Since `3.1.0`.

:::

`ProblemOperations` is a facade over the machinery used by Problem4J's own advices and handlers: resolving exceptions
into `Problem` objects and post-processing them (see [Problem Post-Processor](./06-problem-post-processor.md)). It's
available as a bean (`ProblemTemplate` is the default implementation), so custom `@RestControllerAdvice`-s, filters or
error handlers produce exactly the same responses as the built-in ones, without wiring `ProblemMapper`,
`ProblemResolverStore` and `ProblemPostProcessor` by hand.

| Method                                              | Description                                                                                  |
|-----------------------------------------------------|----------------------------------------------------------------------------------------------|
| `supports(ex)`                                      | Checks whether the exception is known to Problem4J.                                          |
| `resolve(context, ex, headers)`                     | Resolves an exception into a `Problem`, without post-processing. Status comes from the exception. |
| `resolve(context, ex, headers, status)`             | Same, but with the status chosen by the caller - it's passed to resolvers.                   |
| `postProcess(context, problem)`                     | Applies post-processing to a `Problem`.                                                      |
| `postProcess(context, detail)`                      | Applies post-processing to Spring's `ProblemDetail`, in place, keeping its type.             |
| `translate(context, ex, headers)`                   | `resolve` followed by `postProcess`.                                                         |

Exceptions are resolved in the following order: `ProblemException` (its `Problem` is used as is), `@ProblemMapping`
annotated exceptions, `ProblemResolver` registered in `ProblemResolverStore`, `@ResponseStatus` annotated exceptions,
and finally status of `ErrorResponse`, or `500 Internal Server Error` otherwise. Headers of `ErrorResponse` are copied
into `headers`, and resolvers may add their own, so `headers` should be a modifiable instance.

```java
@RestControllerAdvice
public class CustomAdvice {

  private final ProblemOperations problemOperations;

  public CustomAdvice(ProblemOperations problemOperations) {
    this.problemOperations = problemOperations;
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Problem> handle(IllegalArgumentException ex, ProblemContext context) {
    HttpHeaders headers = new HttpHeaders();
    Problem problem = problemOperations.translate(context, ex, headers);
    return ResponseEntity.status(problem.getStatus()).headers(headers).body(problem);
  }
}
```

**Note** that to build a `ProblemTemplate` by hand, e.g. in tests, use `ProblemTemplate.builder()`. Collaborators not set
explicitly use defaults, so new ones can be added in future versions without breaking existing code. As with other
`@Bean`-s provided by this library, `ProblemOperations` can be replaced by declaring your own.

:::info

Since `3.1.0`, constructors of `ExceptionWebMvcAdvice` / `ExceptionWebFluxAdvice`, `ProblemExceptionWebMvcAdvice` /
`ProblemExceptionWebFluxAdvice` and `ProblemResponseEntityExceptionHandler` taking `ProblemPostProcessor` (and
`ProblemMapper`, `ProblemResolverStore`) are deprecated in favor of the ones taking `ProblemOperations`, and the order of
advices is declared with `@Order` on the classes (`PRECEDENCE` constants), so subclasses registered by the application
inherit it unless they declare their own `@Order`.

:::

## Startup Failure Diagnostics

:::info

Since `3.1.0`.

:::

Startup failures caused by Problem4J configuration are reported by Spring Boot's `FailureAnalyzer`-s, as a description
with a suggested action, instead of a stack trace.

- `DuplicateProblemResolverException` - several `ProblemResolver` beans with equal order handle the same exception
  class. The report lists the conflicting beans. Set their precedence with `@Order`, remove one of them, or set
  [`problem4j.duplicate-resolver-policy`](./01-setting-up-and-configuration.md#problem4jduplicate-resolver-policy) to
  `first` or `last`.
- `UnavailableTracingSourceException` - `problem4j.tracing-source` is set to `micrometer`, but
  `io.micrometer:micrometer-tracing` is not on the classpath. Add it with a tracing bridge, or set the property to
  `auto` or `simple`.

Both exceptions extend `IllegalStateException` and keep their previous messages, so code catching them is not affected.

## Custom Type Names

:::info

Since `3.1.0`.

:::

`TypeNameMapper` names the expected type in validation-like responses, e.g. the `kind` extension of type mismatch errors
(see [Exception Resolution Reference](../07-appendix/01-exception-resolution-reference.md)). `SimpleTypeNameMapper`
accepts `TypeNameEntry` instances with custom mappings, compared in the given order before the default ones. Each entry
matches its type and subtypes.

```java
@Bean
TypeNameMapper typeNameMapper() {
  return new SimpleTypeNameMapper(
      new TypeNameEntry(UUID.class, "uuid"),
      new TypeNameEntry(LocalDate.class, "date"));
}
```

## Auto-Configuration Layout

:::info

Since `3.1.0`.

:::

`ProblemAutoConfiguration` is split into several auto-configurations, so beans are registered only where they are
needed.

- `ProblemAutoConfiguration` - generic beans (`ProblemMapper`, `ProblemFormat`, `ProblemPostProcessor`,
  `TypeNameMapper`, `ProblemBeanPostProcessor`). It doesn't require a web application.
- `ProblemWebAutoConfiguration` - web-related beans (`ProblemResolverStore`, `ProblemOperations`, built-in
  `ProblemResolver`s and parameter supports).
- `ProblemJacksonAutoConfiguration` and `ProblemGsonAutoConfiguration` - serialization of `Problem` (Jackson 3 JSON,
  Jackson 3 XML, Jackson 2, and Gson with [`problem4j-gson`](../05-problem4j-gson.md) on the classpath). They don't
  require a web application either, so `Problem` serialization is configured also in applications consuming Problem
  responses via HTTP client.

Auto-configurations are registered also in Spring Boot test slices (see [FAQ](./09-faq.md)).
