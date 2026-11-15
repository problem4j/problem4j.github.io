---
sidebar_position: 3
sidebar_custom_props:
  icon: 📝
---

# Logging

Logging `Problem` responses for each HTTP request failure.

You can observe how exceptions are translated into `Problem` responses by implementing and registering (depending on
your framework) either `AdviceWebFluxInspector` or `AdviceWebMvcInspector`.

The primary goal of these inspectors is to let developers customize logging in their preferred style, but you can also
use them for other purposes such as metrics collection, auditing, or debugging.

:::info

Since `3.1.0`, `AdviceWebMvcInspector` and `AdviceWebFluxInspector` are deprecated in favor of `ProblemInspector`,
which they now extend. The method signature is the same, so migrating means only changing the implemented interface.
All `ProblemInspector` beans are invoked, including the ones implementing deprecated interfaces, so both can be mixed
while migrating.

:::

In Kotlin, an inspector can be declared from a lambda instead of a class - see
[Kotlin Support](./08-kotlin-support.md#functional-problem-inspectors) chapter.

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

You can define any number of inspectors, all of them are executed sequentially during exception handling.

Since `3.1.0`, the same example is written with `ProblemInspector`.

```java
@Component
public class LoggingInspector implements ProblemInspector {

  private static final Logger log = LoggerFactory.getLogger(LoggingInspector.class);

  @Override
  public void inspect(
      ProblemContext context,
      Problem problem,
      Exception ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) { // WebFlux version declares ServerWebExchange argument
    log.info(
        "Handled [status={} title={}]: exception={}",
        status.value(),
        problem.getTitle(),
        ex.getClass().getSimpleName());
  }
}
```
