---
sidebar_position: 3
---

# Migration from Zalando Problem

> Motivation for this article is the fact that [Zalando's `problem-spring-web`][zalando-problem-spring-web] did not
> upgrade to Spring Boot 4 and has moved to **maintenance mode**.

[Zalando's `problem`][zalando-problem] library was one of the first popular implementations of [RFC 7807][rfc7807], and
many existing Spring applications still throw `AbstractThrowableProblem` subclasses to signal errors. Problem4J follows
the same RFC, but with a different philosophy: instead of exceptions carrying the response shape themselves,
a `Problem` is a plain, immutable value object, decoupled from `Throwable`, and exceptions are converted to it via
`ProblemResolver`, `@ProblemMapping`, or `ProblemException`. This makes error handling easier to test, easier to reuse
across non-Spring modules, and avoids mixing control-flow (exceptions) with response payloads (data).

Rewriting every exception in a large codebase in one go usually isn't realistic, so this guide shows how to run both
libraries side by side: keep your existing `AbstractThrowableProblem` exceptions working exactly as before, while new
code is written against Problem4J. Once the old exceptions are migrated (or simply left to throw plain exceptions
mapped through `@ProblemMapping`/`ProblemResolver`), the `zalando:problem` dependency and the bridge below can be
removed entirely.

## Getting Started

```xml
<dependencies>
    <dependency>
        <groupId>io.github.problem4j</groupId>
        <artifactId>problem4j-spring-webmvc</artifactId>
        <version>3.0.0</version>
    </dependency>
    <dependency>
        <groupId>org.zalando</groupId>
        <artifactId>problem</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

```kt
dependencies {
    implementation("io.github.problem4j:problem4j-spring-webmvc:3.0.0")
    implementation("org.zalando:problem:1.0.0")
}
```

## Bridging Zalando Problem to Problem4J

Register a `ProblemResolver` for `AbstractThrowableProblem`, the common base class of every Zalando problem. Since
Problem4J's `@RestControllerAdvice`-s dispatch by exact exception class, catching the abstract base class means
**all** of your existing Zalando problem exceptions are handled in one place, with no per-exception code required.
The resolver simply copies each field over to Problem4J's `Problem.builder()`, so the response body stays identical
to what Zalando's library would have produced.

```java
package org.example;

import io.github.problem4j.core.Problem;
import io.github.problem4j.core.ProblemContext;
import io.github.problem4j.spring.web.resolver.ProblemResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.zalando.problem.AbstractThrowableProblem;

@Component
public class ThrowableProblemResolver implements ProblemResolver {

    @Override
    public Class<? extends Exception> getExceptionClass() {
        return AbstractThrowableProblem.class;
    }

    @Override
    public Problem resolve(ProblemContext context, Exception ex, HttpHeaders headers, HttpStatusCode status) {
        AbstractThrowableProblem e = (AbstractThrowableProblem) ex;
        return Problem.builder()
                .type(e.getType())
                .title(e.getTitle())
                .status(e.getStatus() != null ? e.getStatus().getStatusCode() : 0)
                .detail(e.getDetail())
                .instance(e.getInstance())
                .extensions(e.getParameters())
                .build();
    }
}
```

With this resolver in place, existing code that throws `AbstractThrowableProblem` subclasses keeps working unchanged,
while any new exception can be written against Problem4J directly using `ProblemException`, `@ProblemMapping`, or its
own `ProblemResolver`, as described in [Exception Handling](../problem4j-spring/exception-handling). Once every
`AbstractThrowableProblem` usage has been migrated, delete this resolver together with the `org.zalando:problem`
dependency.

[zalando-problem]: https://github.com/zalando/problem

[zalando-problem-spring-web]: https://github.com/zalando/problem-spring-web

[rfc7807]: https://datatracker.ietf.org/doc/html/rfc7807
