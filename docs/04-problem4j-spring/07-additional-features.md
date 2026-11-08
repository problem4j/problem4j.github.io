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
[`problem4j.tracing.source`](./01-setting-up-and-configuration.md#problem4jtracingsource) property.

- `auto` (default) - `micrometer` if `io.micrometer:micrometer-tracing` is on the classpath, `simple` otherwise.
- `simple` - trace identifier is taken from the HTTP header configured with
  [`problem4j.tracing-header-name`](./01-setting-up-and-configuration.md#problem4jtracing-header-name), or generated as
  a random UUID without dashes.
- `micrometer` - trace identifier is taken from the current Micrometer Tracing span (with OpenTelemetry or Brave
  bridge), so it's the same one that appears in logs. If the trace identifier comes from the span, span identifier of
  the server span is stored under `spanId` key as well, so both always belong to the same trace. Application startup
  fails if `io.micrometer:micrometer-tracing` is not on the classpath, unless a custom `ProblemContextWebMvcFilter` /
  `ProblemContextWebFluxFilter` bean is defined.

With `micrometer` source, the trace identifier is resolved in the following order.

1. Trace identifier already stored in request attributes (`AttributeSupport.TRACE_ID_ATTRIBUTE`), e.g. by another
   filter.
2. Trace identifier of the current span.
3. Value of the `problem4j.tracing-header-name` header.
4. Newly generated trace identifier.

Header and generated values are used only if no span is available, e.g. if observation is disabled for the request, or
no tracing bridge is present (`Tracer.NOOP` spans have an empty trace identifier, so they're ignored). If a client sends
W3C `traceparent` header, the trace it carries is continued, so the incoming trace identifier is used.

If `problem4j.tracing-header-name` is set, the trace identifier is also written into the response header with that name,
regardless of the source.

```properties
problem4j.tracing-header-name=X-Trace-Id
problem4j.instance-override=https://example.org/traces/{context.traceId}
```

**Note** that `problem4j.tracing-header-name=traceparent` is not a way to use W3C trace context. With `simple` source,
Problem4J would take the whole header value (`00-<traceId>-<spanId>-01`) as the trace identifier and echo it back in the
response. Use `micrometer` source (or `auto` with Micrometer Tracing on the classpath) instead.

**Note** that in WebFlux (including Kotlin coroutines), `traceId` and `spanId` appear in the logging MDC only with
`spring.reactor.context-propagation=auto`, so that the trace context is propagated from Reactor context to thread
locals. Problem4J doesn't need it, as it takes the span from the server observation, but without it logs written while
handling a request won't carry the same trace identifier as `ProblemContext`. In WebMVC, MDC is populated by Micrometer
Tracing without any extra configuration.

`ProblemContextWebMvcFilter` / `ProblemContextWebFluxFilter` (`simple`) and `MicrometerProblemContextWebMvcFilter` /
`MicrometerProblemContextWebFluxFilter` (`micrometer`) are the actual implementations. **Note** that these can be
extended and replaced, as all `@Bean`-s provided by this library are marked with `@ConditionalOnMissingBean`.

Available configuration properties:

- [`problem4j.tracing.source`](./01-setting-up-and-configuration.md#problem4jtracingsource)
- [`problem4j.tracing-header-name`](./01-setting-up-and-configuration.md#problem4jtracing-header-name)

### Custom Tracing Setup

The `micrometer` source supports only the server observation registered by Spring Boot. For other setups, either
override `findTraceContext` of `MicrometerProblemContextWebMvcFilter` / `MicrometerProblemContextWebFluxFilter` (the
`spanId` is then added automatically), or set `AttributeSupport.TRACE_ID_ATTRIBUTE` in your own filter running before
the Problem4J one (without `spanId`).

```java
@Bean
ProblemContextWebMvcFilter problemContextWebMvcFilter(ProblemProperties properties, Tracer tracer) {
  return new MicrometerProblemContextWebMvcFilter(properties) {
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

The parameter is `null` if no `ProblemContext` is assigned, which happens only if the context filter is disabled
(`problem4j.webmvc.problem-context-filter.enabled=false` or `problem4j.webflux.problem-context-filter.enabled=false`).
With the filter enabled (default), a non-nullable `ProblemContext` parameter is safe in Kotlin, also in `suspend`
functions.

