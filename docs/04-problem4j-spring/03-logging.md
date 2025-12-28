---
sidebar_position: 3
---

# Logging

Logging `Problem` responses for each HTTP request failure.

You can observe how exceptions are translated into `Problem` responses by implementing and registering (depending on
your framework) either `AdviceWebFluxInspector` or `AdviceWebMvcInspector`.

The primary goal of these inspectors is to let developers customize logging in their preferred style, but you can also
use them for other purposes such as metrics collection, auditing, or debugging.

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
