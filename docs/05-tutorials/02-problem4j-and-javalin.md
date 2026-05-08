---
sidebar_position: 2
---

# Problem4J & Javalin

The example integration of Problem4J with Javalin.

Even though Problem4J is primarily focused on Spring Boot, it can be easily integrated with any Java application, as
long as you can catch exceptions and convert them to `Problem` instances. This page demonstrates how to do this with
[Javalin][javalin], a lightweight web framework for Java and Kotlin.

## Getting Started

```xml
<dependencies>
    <dependency>
        <groupId>io.github.problem4j</groupId>
        <artifactId>problem4j-core</artifactId>
        <version>2.0.0</version>
    </dependency>
    <dependency>
        <groupId>io.github.problem4j</groupId>
        <artifactId>problem4j-jackson3</artifactId>
        <version>2.0.0</version>
    </dependency>
</dependencies>
```

```kt
dependencies {
    implementation("io.github.problem4j:problem4j-core:2.0.0")
    implementation("io.github.problem4j:problem4j-jackson3:2.0.0")
}
```

Note that this example also assumes, for JSON serialization, that you use Jackson (`JsonMapper`) in either v2 or v3 and
the compatible [Problem4J Jackson](../problem4j-jackson) module.

```java
JsonMapper jsonMapper = JsonMapper.builder().findAndAddModules().build();
ProblemMapper problemMapper = new DefaultProblemMapper();

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
