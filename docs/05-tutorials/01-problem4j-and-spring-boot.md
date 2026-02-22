---
sidebar_position: 1
---

# Problem4J & Spring Boot

The premier integration of Problem4J with Spring Boot.

## Getting Started

```xml
<dependencies>
    <dependency>
        <groupId>io.github.problem4j</groupId>
        <artifactId>problem4j-spring-webmvc</artifactId>
        <version>2.2.0</version>
    </dependency>
</dependencies>
```

```kt
dependencies {
    implementation("io.github.problem4j:problem4j-spring-webmvc:2.2.0")
}
```

Integration with Spring Boot is very straightforward. By adding the library as a dependency to your project, you get
auto-configuration for Spring WebFlux and Spring WebMVC. This means that no additional configuration is required to
start using Problem4J in your application. You can throw `ProblemException` or any exception annotated with
`@ProblemMapping` from your controllers and they will be properly handled by the library.

Various Spring Boot internal exceptions are also mapped to `Problem` instances, so you can be sure that any exception
thrown from your application will be handled and returned in a consistent format.

```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        throw new ProblemException(Problem.of("Hello Error", 400, "something went wrong with /hello endpoint"));
    }
}
```

The most prominent build-in exceptions that are mapped to `Problem` instances include:

- various validation errors,
- missing request parameters,
- type mismatches,
- unsupported media types,
- binding between request parameters and method arguments,
- and many more.

Format for all these exceptions aims to encapsulate all internal details of the framework used by the application.

---

To peek, log or debug exceptions handled by the library, you can implement `AdviceWebMvcInspector` interface. This
interface provide a single method that is called whenever an exception is handled by the library. You can use this
method to log the exception or perform any other custom logic.

For WebFlux, use `AdviceWebFluxInspector` interface instead, which declares `ServerWebExchange` argument instead of
`WebRequest`.

```java
@Component
public class LoggingInspector implements AdviceWebMvcInspector {

  private static final Logger log = LoggerFactory.getLogger(LoggingInspector.class);

  @Override
  public void inspect(
      ProblemContext context,
      Problem problem,
      Exception ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) { // AdviceWebFluxInspector declares ServerWebExchange argument
    log.info(
        "Handled [status={} title={}]: exception={}",
        status.value(),
        problem.getTitle(),
        ex.getClass().getSimpleName());
  }
}
```

---

And with this, you have a basic setup of Problem4J with Spring Boot. You can now start throwing `ProblemException` from
your controllers and they will be properly handled and returned in a consistent format.
