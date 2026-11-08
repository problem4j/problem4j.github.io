---
sidebar_position: 9
sidebar_custom_props:
  icon: ❓
---

# FAQ

Questions and answers about using and debugging Problem4J Spring.

## Setup

<div className="faq-card">

### How do I disable Problem4J?

Set [`problem4j.enabled=false`](./01-setting-up-and-configuration.md#problem4jenabled) to disable all
auto-configurations provided by this module, e.g. for a single profile or in tests.

```properties
problem4j.enabled=false
```

</div>

<div className="faq-card">

### Does `spring.mvc.problemdetails.enabled` conflict with Problem4J?

No. Problem4J registers its own `ResponseEntityExceptionHandler` before Spring Boot's web auto-configuration, and Spring
Boot's `ProblemDetailsExceptionHandler` is created only if no such handler exists. Therefore, with Problem4J on the
classpath, `spring.mvc.problemdetails.enabled` (or `spring.webflux.problemdetails.enabled`) has no effect and can be
left as is.

If you disable Problem4J's handler with `problem4j.webmvc.exception-handler.enabled=false` (or
`problem4j.webflux.exception-handler.enabled=false`) while Spring Boot's property is enabled, Spring's exceptions are
handled by Spring Boot again, with its own `detail` and `instance` values.

</div>

<div className="faq-card">

### Why does the application fail to start with `IllegalStateException` about duplicate resolvers?

Two or more `ProblemResolver` beans handle the same exception class with equal precedence. Either mark the preferred
resolver with `@Order` (lower value wins), or set
[`problem4j.duplicate-resolver-policy=first`](./01-setting-up-and-configuration.md#problem4jduplicate-resolver-policy)
to use the first one registered.

See [Implementing `ProblemResolver`](./02-exception-handling.md#implementing-problemresolver) chapter for more info.

</div>

## Customizing Responses

<div className="faq-card">

### How do I override the built-in response for a Spring exception?

Declare your own `ProblemResolver` for that exception class and annotate it with `@Order`. Built-in resolvers use the
default precedence (`Ordered.LOWEST_PRECEDENCE`), so the custom one takes over without replacing the built-in bean.

```java
@Order(0)
@Component
public class CustomNoResourceFoundResolver implements ProblemResolver {

  @Override
  public Class<? extends Exception> getExceptionClass() {
    return NoResourceFoundException.class;
  }

  @Override
  public Problem resolve(
      ProblemContext context, Exception ex, HttpHeaders headers, HttpStatusCode status) {
    return Problem.builder().status(404).detail("Resource does not exist").build();
  }
}
```

See [Exception Resolution Reference](../07-appendix/01-exception-resolution-reference.md) for responses of all
built-in resolvers.

</div>

<div className="faq-card">

### Why doesn't the response include the exception message?

That's intentional. Exception messages often contain internal details (SQL, class names, file paths), so Problem4J
never copies them into the response on its own. Unknown exceptions resolve into a plain `500 Internal Server Error`,
and the reason of `ResponseStatusException` is not exposed either.

To return the message deliberately, reference it with `{message}` placeholder in `@ProblemMapping`, or throw
`ProblemException` (or Spring's `ErrorResponseException`) with `detail` set explicitly.

```java
@ProblemMapping(title = "Invalid Request", status = 400, detail = "{message}")
public class InvalidRequestException extends RuntimeException {
  // ...
}
```

See [Unknown Exceptions](../07-appendix/01-exception-resolution-reference.md#unknown-exceptions) for more info.

</div>

<div className="faq-card">

### How do I include `traceId` in responses?

Problem4J assigns a `traceId` to every request (from the current Micrometer Tracing span, from the header set in
[`problem4j.tracing-header-name`](./01-setting-up-and-configuration.md#problem4jtracing-header-name), or generated), but
doesn't add it to the response body by itself. Reference it with `{context.traceId}` placeholder, e.g. in `instance`
override.

```properties
problem4j.tracing-header-name=X-Trace-Id
problem4j.instance-override=https://example.org/traces/{context.traceId}
```

See [Tracing](./07-additional-features.md#tracing) and
[Problem Post-Processor](./06-problem-post-processor.md) chapters for more info.

</div>

<div className="faq-card">

### How do I use the OpenTelemetry `traceId` instead of a generated one?

Add Micrometer Tracing to the application, e.g. with `spring-boot-micrometer-tracing-opentelemetry` and
`micrometer-tracing-bridge-otel`. With
[`problem4j.tracing.source`](./01-setting-up-and-configuration.md#problem4jtracingsource) left at its default `auto`
value, Problem4J detects it and takes `traceId` (and `spanId`) of `ProblemContext` from the current span, so
`{context.traceId}` placeholders resolve to the same `traceId` that appears in logs. An incoming W3C `traceparent`
header continues the trace it carries, also if it's not sampled (`-00` flags).

```properties
problem4j.tracing.source=micrometer
```

Setting `micrometer` explicitly makes application startup fail if Micrometer Tracing is missing on the classpath,
instead of silently falling back to `simple` (unless a custom `ProblemContext` filter bean is defined). See
[Tracing](./07-additional-features.md#tracing) chapter for the order in which trace identifiers are resolved.

**Note** that `problem4j.tracing-header-name=traceparent` is not a way to achieve this. Problem4J would take the whole
W3C header value (`00-<traceId>-<spanId>-01`) as `traceId`, and echo it back in the response header.

</div>

<div className="faq-card">

### Why is my custom `@RestControllerAdvice` never called?

Advices provided by Problem4J use ordering from `Ordered.LOWEST_PRECEDENCE - 10` to `Ordered.LOWEST_PRECEDENCE`. For
your advice to take precedence, give it a smaller order value, at least `Ordered.LOWEST_PRECEDENCE - 11`.

```java
@Order(Ordered.LOWEST_PRECEDENCE - 20)
@RestControllerAdvice
public class ExampleExceptionAdvice {
  // ...
}
```

See [Custom `@RestControllerAdvice`](./02-exception-handling.md#custom-restcontrolleradvice) chapter for more info.

</div>

## Troubleshooting

<div className="faq-card">

### Why doesn't an unregistered HTTP path return a proper response body?

In Spring Boot versions before `3.2.0`, Spring WebMVC required setting following property for
`NoHandlerFoundException` to ever be thrown.

```properties
spring.mvc.throw-exception-if-no-handler-found=true
```

See `org.springframework.boot.autoconfigure.web.servlet.WebMvcProperties` class to debug it yourself.

By default, Spring Boot includes mappings to static resources. If you want to disable them and make Spring return 404
on `src/main/resources/static/*` (and others), set following property.

```properties
spring.web.resources.add-mappings=false
```

See `org.springframework.boot.autoconfigure.web.SpringWebProperties` class to debug it yourself.

</div>

<div className="faq-card">

### Why are `jakarta.validation` error messages localized?

Property `spring.web.locale-resolver` default has `accept_header`, to prioritize `Accept-Language` header. Consider
updating it as it follows.

```properties
spring.web.locale=en_US
spring.web.locale-resolver=fixed
```

See `org.springframework.boot.autoconfigure.web.SpringWebProperties` class to debug it yourself.

</div>

<div className="faq-card">

### How do I log exceptions resolved into `500 Internal Server Error`?

Exception's message, class and stack trace are never part of the response, so log them with an advice inspector. It's
called for every handled exception, with access to both the original exception and the resulting `Problem`.

```java
@Component
public class ServerErrorLoggingInspector implements AdviceWebMvcInspector {

  private static final Logger log = LoggerFactory.getLogger(ServerErrorLoggingInspector.class);

  @Override
  public void inspect(
      ProblemContext context,
      Problem problem,
      Exception ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    if (status.is5xxServerError()) {
      log.error("Unhandled exception [traceId={}]", context.get("traceId"), ex);
    }
  }
}
```

See [Logging](./03-logging.md) chapter for more info, including WebFlux counterpart `AdviceWebFluxInspector`.

</div>

## Testing

<div className="faq-card">

### How do I test `Problem` responses?

Check status, `application/problem+json` content type and `Problem` fields with JSON path, like any other JSON response.
Examples below assume `GET /orders/42` responding with `404` and `"detail" : "Order not found"`.

With `MockMvc` (WebMVC, no running server):

```java
@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void givenMissingOrder_shouldReturnProblem() throws Exception {
    mockMvc
        .perform(get("/orders/42"))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.detail").value("Order not found"));
  }
}
```

With `RestTestClient` (WebMVC, running server):

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class OrderControllerTest {

  @Autowired private RestTestClient restTestClient;

  @Test
  void givenMissingOrder_shouldReturnProblem() {
    restTestClient
        .get()
        .uri("/orders/42")
        .exchange()
        .expectStatus()
        .isNotFound()
        .expectHeader()
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .expectBody()
        .jsonPath("$.status")
        .isEqualTo(404)
        .jsonPath("$.detail")
        .isEqualTo("Order not found");
  }
}
```

With `WebTestClient` (WebFlux):

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class OrderControllerTest {

  @Autowired private WebTestClient webTestClient;

  @Test
  void givenMissingOrder_shouldReturnProblem() {
    webTestClient
        .get()
        .uri("/orders/42")
        .exchange()
        .expectStatus()
        .isNotFound()
        .expectHeader()
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .expectBody()
        .jsonPath("$.status")
        .isEqualTo(404)
        .jsonPath("$.detail")
        .isEqualTo("Order not found");
  }
}
```

In Spring Boot `4.x`, these annotations live in separate modules - `@AutoConfigureMockMvc` in `spring-boot-webmvc-test`,
`@AutoConfigureRestTestClient` in `spring-boot-resttestclient` and `@AutoConfigureWebTestClient` in
`spring-boot-webtestclient`.

</div>

<div className="faq-card">

### Does Problem4J work with `@WebMvcTest` and `@WebFluxTest`?

Yes, since `3.1.0`. Problem4J auto-configurations are registered for Spring Boot test slices, so `@WebMvcTest` and
`@WebFluxTest` apply the whole integration (resolvers, advices, `ProblemContext` filter, error handling) and return
`application/problem+json` error responses. `@JsonTest`, `@RestClientTest` and `@WebClientTest` get `Problem`
serialization (Jackson, Gson) and generic beans such as `ProblemMapper`, e.g. for reading `Problem` responses in API
clients.

Slices don't pick up regular `@Component` beans and `@Configuration` classes through component scanning. Custom
`ProblemResolver`, `ProblemPostProcessor` or other Problem4J beans have to be imported explicitly, otherwise built-in
defaults are used and the response may differ from the one of the running application. Exceptions annotated with
`@ProblemMapping` and `ProblemException` need no extra setup.

```java
@WebMvcTest(OrderController.class)
@Import(OrderNotFoundProblemResolver.class)
class OrderControllerTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void givenMissingOrder_shouldReturnProblem() throws Exception {
    mockMvc
        .perform(get("/orders/42"))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.detail").value("Order not found"));
  }
}
```

To check a slice without Problem4J, e.g. to compare with Spring's default error responses, set
[`problem4j.enabled=false`](./01-setting-up-and-configuration.md#problem4jenabled) in the slice annotation.

```java
@WebMvcTest(properties = "problem4j.enabled=false")
```

</div>
