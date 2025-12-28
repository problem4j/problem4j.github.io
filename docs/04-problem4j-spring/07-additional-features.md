---
sidebar_position: 7
---

# Additional Features

Additional, incubating and/or experimental features of Problem4J Spring.

## Resolver Caching

| Feature Status | Info                                                                      |
|----------------|---------------------------------------------------------------------------|
| **INCUBATING** | internal implementation might change, but public API should stay the same |

Resolving an exception involves finding the correct `ProblemResolver` by walking through the exception’s inheritance
hierarchy - since resolvers can be defined generically for base exception types. This lookup process can involve
reflection and multiple comparisons, which may introduce overhead when performed frequently (e.g., in high-throughput
applications).

To improve performance, the resolver lookup results can be cached. Once an exception type has been resolved, the
corresponding resolver is stored in a cache, allowing subsequent resolutions of the same type to be served instantly
without re-evaluating the inheritance chain. Caching uses **LRU (least recently used)** eviction once the limit is
exceeded, according to configuration.

Available configuration properties:

- [`problem4j.resolver-caching.enabled`](./setting-up-and-configuration#problem4jresolver-cachingenabled)
- [`problem4j.resolver-caching.max-cache-size`](./setting-up-and-configuration#problem4jresolver-cachingmax-cache-size)

The caching mechanism in `CachingProblemResolverStore` uses a `LinkedHashMap` wrapped with `synchronized` if eviction is
enabled (`max-cache-size > 0`) or `ConcurrentHashMap` (`max-cache-size <= 0`) to avoid external dependencies. This is
intentionally minimalistic and users can override it by supplying your own `ProblemResolverStore`implementation (or
extending `AbstractProblemResolverStore`), backed by a proper caching provider and declaring it as `@Component` (all
`@Bean`-s provided by this library are `@ConditionalOnMissingBean`).

**Example:**

```properties
problem4j.resolver-caching.enabled=true
problem4j.resolver-caching.max-cache-size=256
```

Notes:

- As number of exceptions types do not increase at runtime, keeping default `max-cache-size = -1` (unbounded) is usually
  fine.
- If you rarely introduce new resolver types, a small cache (64-256) is usually enough.
- Leave disabled if startup / reflection cost is negligible or resolver set is highly dynamic.

## Simple Tracing

For providing a unique identifier, for helping to resolve `instance` field, library includes a provider of `traceId`.
That `traceId` is generated, or retrieved from HTTP header and is available in `context.traceId` (during interpolation)
or as `@RequestAttribute(AttributeSupport.TRACE_ID_ATTRIBUTE)`. See `ProblemContextWebFluxFilter` or
`ProblemContextWebMvcFilter` for actual implementations. **Note** that these can be extended and replaced, as all
`@Bean`-s provided by this library are marked with `@ConditionalOnMissingBean`.

Available configuration properties:

- [`problem4j.tracing-header-name`](./setting-up-and-configuration#problem4jtracing-header-name)
