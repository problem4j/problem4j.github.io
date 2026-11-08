---
sidebar_position: 8
sidebar_custom_props:
  icon: 🟣
---

# Kotlin Support

Kotlin extensions and DSL functions shipped with Problem4J Spring.

:::info

Since `3.1.0`.

:::

Kotlin top-level functions and extensions making Problem4J classes more idiomatic ship with the modules themselves -
the shared ones in `problem4j-spring-web` (a transitive dependency of both `problem4j-spring-webflux` and
`problem4j-spring-webmvc`), the framework-specific ones in the module they belong to. No additional dependency is
required. Kotlin standard library is declared as `compileOnly`, so it does not leak into Java projects - Kotlin
projects already have it on their classpath.

| Package                                    | Contents                                                                        |
|--------------------------------------------|---------------------------------------------------------------------------------|
| `io.github.problem4j.spring.web`           | `buildProblem { }` DSL, `Problem` and `ProblemContext` operators and extensions |
| `io.github.problem4j.spring.web.parameter` | `Violation` destructuring                                                       |
| `io.github.problem4j.spring.web.resolver`  | `problemResolver<E> { }` factories                                              |
| `io.github.problem4j.spring.webmvc`        | `adviceWebMvcInspector { }` factories, `problemContext` accessors               |
| `io.github.problem4j.spring.webflux`       | `adviceWebFluxInspector { }` factories, `problemContext` accessors              |

## Functional `ProblemResolver`

The `problemResolver<E>` function creates a `ProblemResolver` for given exception type from a lambda, without
subclassing `AbstractProblemResolver`. The lambda is a `ProblemBuilderSpec` block, the same DSL as in
[`buildProblem { }`](#building-problem-with-dsl), and the builder is pre-populated with the HTTP status passed to the
resolver - override it with `status(...)` when needed. The exception is passed already cast to `E`.

Declare it as a `@Bean` to have it loaded into the Problem4J ecosystem, same as any other resolver (see
[Implementing `ProblemResolver`](./02-exception-handling.md#implementing-problemresolver)).

```kotlin
import io.github.problem4j.spring.web.resolver.ProblemResolver
import io.github.problem4j.spring.web.resolver.problemResolver
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class ProblemConfiguration {

  @Bean
  fun exampleExceptionResolver(): ProblemResolver =
      problemResolver<ExampleException> { ex ->
        type("https://example.org/errors/invalid-request")
        title("Invalid Request")
        status(400)
        detail("bad input for user ${ex.userId}")
      }
}
```

## Functional Advice Inspectors

`AdviceWebMvcInspector` and `AdviceWebFluxInspector` observe every `Problem` before it is written to the response (see
[Logging](./03-logging.md)). The `adviceWebMvcInspector` and `adviceWebFluxInspector` functions create one from a
lambda, each in three overloads, so a lambda declares only the arguments it uses.

- `(Problem, Exception) -> Unit`,
- `(ProblemContext, Problem, Exception, WebRequest) -> Unit` - `ServerWebExchange` for WebFlux,
- `(ProblemContext, Problem, Exception, HttpHeaders, HttpStatusCode, WebRequest) -> Unit` - WebMVC only.

```kotlin
import io.github.problem4j.spring.webmvc.AdviceWebMvcInspector
import io.github.problem4j.spring.webmvc.adviceWebMvcInspector
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class LoggingInspectorConfiguration {

  private val log = LoggerFactory.getLogger(javaClass)

  @Bean
  fun loggingInspector(): AdviceWebMvcInspector = adviceWebMvcInspector { problem, ex ->
    log.info(
        "Handled [status={} title={}]: exception={}",
        problem.status,
        problem.title,
        ex.javaClass.simpleName,
    )
  }
}
```

## Accessing `ProblemContext`

`problemContext` extension properties read the `ProblemContext` assigned by the context filter (see
[Tracing](./07-additional-features.md#tracing)), returning `null` if none is assigned. In WebMVC they're available on
`HttpServletRequest` and `WebRequest`, in WebFlux on `ServerWebExchange` and Reactor `ContextView`.

```kotlin
import io.github.problem4j.spring.webflux.problemContext
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ServerWebExchange

@RestController
class OrderController {

  @GetMapping("/orders")
  suspend fun listOrders(exchange: ServerWebExchange): List<Order> {
    log.info("Listing orders [traceId={}]", exchange.problemContext?.get("traceId"))
    // ...
  }
}
```

In controllers, `ProblemContext` can also be declared directly as a method parameter, see
[Accessing `ProblemContext` in Controllers](./07-additional-features.md#accessing-problemcontext-in-controllers).

## Building `Problem` with DSL

The `buildProblem` function builds an immutable `Problem` from a configuration block. Inside the block, all
`ProblemBuilder` setters are available as statements, so they don't need to be chained and `build()` is invoked
automatically once the block completes.

```kotlin
import io.github.problem4j.spring.web.buildProblem
import org.springframework.http.HttpStatus

val problem = buildProblem {
  type("https://example.org/errors/invalid-request")
  title("Invalid Request")
  status(HttpStatus.BAD_REQUEST)
  detail("bad input for user 123")
  instance("https://example.org/instances/trace-789")
  extensions("userId" to "123", "fieldName" to "email")
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

Extensions with `null` values remove previously added extension with the same name, same as in `ProblemBuilder`.

Available block methods: `type`, `title` (resolved from HTTP status if not set), `status` (`Int` or `HttpStatusCode`),
`detail`, `instance`, `extension` and `extensions` (from `Map`, `Pair`-s or `Problem.Extension`-s). The block is
annotated with `@DslMarker`, so methods of an outer `buildProblem { }` can't be called implicitly from a nested one.

## Copying a `Problem`

`Problem` is immutable, so modifying one means building a new instance from `toBuilder()`. The `copy` extension wraps
that in the same DSL - the block starts from the fields of the receiver and the original is left unchanged.

```kotlin
import io.github.problem4j.spring.web.buildProblem
import io.github.problem4j.spring.web.copy

val original = buildProblem {
  status(400)
  detail("the provided email is invalid")
}
val copy = original.copy {
  title("Invalid Input")
  extension("field", "email")
}
```

## Reading Extensions

`Problem` supports indexed access to its extensions, returning `null` when the extension is absent. The `extension<T>`
function additionally casts the value to the expected type, returning `null` when the value is of another type. The
`in` operator checks for presence.

```kotlin
import io.github.problem4j.spring.web.contains
import io.github.problem4j.spring.web.extension
import io.github.problem4j.spring.web.get

val field = problem["field"]
// field == "email", typed as Any?

val attempts = problem.extension<Int>("attempts")
// attempts == 3, typed as Int?

val hasField = "field" in problem
// hasField == true
```

## Destructuring

`Problem.Extension` destructures into its name and value, and `Violation` (see
[Validation Errors](./04-validation-errors.md)) into its field and error message.

```kotlin
import io.github.problem4j.spring.web.component1
import io.github.problem4j.spring.web.component2

for ((name, value) in problem.extensions) {
  println("$name = $value")
}
```

```kotlin
import io.github.problem4j.spring.web.parameter.component1
import io.github.problem4j.spring.web.parameter.component2

val (field, error) = violation
```

## `ProblemBuilder` Extensions

For code that uses `Problem.builder()` directly, following extensions are available.

```kotlin
import io.github.problem4j.core.Problem
import io.github.problem4j.spring.web.extensions
import io.github.problem4j.spring.web.status
import org.springframework.http.HttpStatus

val problem =
    Problem.builder()
        .status(HttpStatus.BAD_REQUEST)
        .extensions("field" to "email", "reason" to "blank")
        .build()
```

- `ProblemBuilder.status(HttpStatusCode)` - sets status from Spring's `HttpStatusCode`,
- `ProblemBuilder.extensions(vararg Pair<String, *>)` - adds multiple extensions from `key to value` pairs.

## `ProblemContext` Extensions

`ProblemContext` can be populated from `key to value` pairs, written through indexed assignment and queried with the
`in` operator.

```kotlin
import io.github.problem4j.core.ProblemContext
import io.github.problem4j.spring.web.contains
import io.github.problem4j.spring.web.putAll
import io.github.problem4j.spring.web.set

val context = ProblemContext.create().putAll("userId" to "12345", "traceId" to "abcde")

context["tenant"] = "acme"
context["traceId"] = null // unsets the entry

val hasTenant = "tenant" in context
// hasTenant == true
```

- `ProblemContext.putAll(vararg Pair<String, String?>)` - associates multiple entries at once,
- `ProblemContext.set(String, String?)` - associates a single entry, or unsets it when the value is `null`,
- `ProblemContext.contains(String)` - checks whether an entry is present.
