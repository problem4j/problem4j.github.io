---
sidebar_position: 7
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

- [`problem4j.resolver-caching.enabled`](./setting-up-and-configuration#problem4jresolver-cachingenabled)

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

## Simple Tracing

For providing a unique identifier, for helping to resolve `instance` field, library includes a provider of `traceId`.
That `traceId` is generated, or retrieved from HTTP header and is available in `context.traceId` (during interpolation)
or as `@RequestAttribute(AttributeSupport.TRACE_ID_ATTRIBUTE)`. See `ProblemContextWebFluxFilter` or
`ProblemContextWebMvcFilter` for actual implementations. **Note** that these can be extended and replaced, as all
`@Bean`-s provided by this library are marked with `@ConditionalOnMissingBean`.

Available configuration properties:

- [`problem4j.tracing-header-name`](./setting-up-and-configuration#problem4jtracing-header-name)
