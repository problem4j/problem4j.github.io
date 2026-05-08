---
sidebar_position: 6
---

# Problem Post-Processor

Final modification of `Problem` responses before HTTP response.

Problem4J provides a **post-processing mechanism** that allows modifying certain fields of a `Problem` object after it
has been constructed. This feature makes it possible to generate environment-dependent or runtime-resolved URIs for
fields such as `"type"`, `"title"`, and `"instance"`, without embedding such logic into exception classes or resolvers.

Currently, the following fields can be overridden:

- `type` - the logical category of the problem
- `title` - a short, human-readable summary of the problem
- `instance` - an identifier of a specific occurrence, often a URI or trace reference

These overrides are applied by a **global post-processor** using templates defined in configuration properties.
Templates for overriding problem fields may include placeholders that are dynamically replaced at runtime.

Available placeholders:

- for overriding `"type"` field:
    - `{problem.type}` - the original `"type"` value of the problem
    - `{context.<key>}` - any value from the current request context (e.g. `{context.traceId}`)
- for overriding `"title"` field:
    - `{problem.title}` - the original `"title"` value of the problem
    - `{context.<key>}` - any value from the current request context
- for overriding `"instance"` field:
    - `{problem.instance}` - the original `"instance"` value of the problem
    - `{context.<key>}` - any value from the current request context (e.g. `{context.traceId}`)

The `{context.<key>}` placeholder resolves values stored in `ProblemContext` for the current request. The built-in
[Simple Tracing](./additional-features#simple-tracing) feature stores the trace identifier under the `traceId` key,
making it available as `{context.traceId}`. You can also populate the context with custom keys by providing your own
`ProblemContextFilter`.

General post-processing rules:

- Overrides are applied **only if all placeholders in the template can be resolved**:
    - `{problem.type}` - applied if the original `type` is **non-null**, **non-empty**, not `"about:blank"`.
    - `{problem.title}` - applied if the original `title` is **non-null** and **non-empty**.
    - `{problem.instance}` - applied if the original `instance` is **non-null** and **non-empty**.
    - `{context.<key>}` - applied if the context provides a **non-null**, **non-empty** value for that key.
- If any referenced placeholder cannot be resolved, **the override is skipped** (occurrences of unknown placeholders
  also abort the override for that field).
- The resulting values are **non-empty strings** and treated as valid URIs (for `type` and `instance`).
- If no override is set, fields remain as in the original `Problem`.
- **Static templates** (no placeholders) are always applied, regardless of the original value.

These rules ensure that field transformation is safe and predictable while allowing flexible runtime substitution.

Available configuration properties:

- [`problem4j.type-override`](./setting-up-and-configuration#problem4jtype-override)
- [`problem4j.title-override`](./setting-up-and-configuration#problem4jtitle-override)
- [`problem4j.instance-override`](./setting-up-and-configuration#problem4jinstance-override)

**Example:**

```properties
problem4j.type-override=https://errors.example.com/{problem.type}
problem4j.instance-override=/errors/{context.traceId}
```

If a response produces a `Problem` with:

- `"type" : "problems/validation"` (original value)
- `context.traceId=WQ1tbs12rtSD`

the resulting response will contain:

- `"type" : "https://errors.example.com/problems/validation"`
- `"instance": "/errors/WQ1tbs12rtSD"`

This allows uniform and resolvable links for problem reports across environments.
