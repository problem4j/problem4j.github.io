---
sidebar_position: 2
---

# Using it from scratch

An example of setting up with an actual HTTP server.

The primary integration provided by this library orbits around Spring Boot. However, the Problem4J libraries are fully
featured to work in any environment.

## Integration example for Javalin

This chapter is a quick introduction to using Problem4J in a non-Spring Java application, using [Javalin][javalin]
library for HTTP server functionality.

Note that this example also assumes, for JSON serialization, that you use Jackson (`JsonMapper`) in either v2 or v3 and
the compatible [Problem4J Jackson](../problem4j-jackson) module.

```java
JsonMapper jsonMapper = new JsonMapper.Builder().findAndAddModules().build();
ProblemMapper problemMapper = ProblemMapper.create();

Javalin app = Javalin.create();

app.get("/hello", ctx -> {
    throw new ProblemException(
        Problem.of("Hello Error", 400, "something went wrong with /hello endpoint"));
});

app.exception(ProblemException.class, (ex, ctx) -> {
    Problem problem = ex.getProblem();

    String json = jsonMapper.writeValueAsString(problem);
    ctx.status(problem.getStatus()).result(json).contentType(Problem.CONTENT_TYPE);
});

app.exception(Exception.class, (ex, ctx) -> {
    Problem problem = Problem.of(500);

    if (problemMapper.isMappingCandidate(ex)) {
        problem = problemMapper.toProblemBuilder(ex).build();
    }

    String json = jsonMapper.writeValueAsString(problem);
    ctx.status(problem.getStatus()).result(json).contentType(Problem.CONTENT_TYPE);
});

app.start(7676);
```

The above example demonstrates support for both throwing `ProblemException` instances and `@ProblemMapping`-annotated
exceptions. The former is a simple wrapper around `Problem` objects, while the latter relies on the `ProblemMapper` to
convert exceptions into `Problem` instances.

[javalin]: https://javalin.io/
