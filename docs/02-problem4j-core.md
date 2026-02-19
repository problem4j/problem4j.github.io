---
sidebar_position: 2
---

# Problem4J Core

Problem4J Core provides a framework-agnostic set of features to be used in implementing framework-specific features by
other modules. There are two primary ways of throwing exception with `Problem`.

1. Throw a `ProblemException`.
2. Throw exception annotated with `@ProblemMapping`.

Following chapters touch also other aspects, such as `ProblemContext` and how to approach altering `Problem` objects,
if they are immutable.

## Dependency

Add library as dependency to Maven or Gradle. See the actual versions on [Maven Central][maven-central]. **Java 8** or
higher is required to use this library.

1. Maven:
   ```xml
   <dependencies>
       <dependency>
           <groupId>io.github.problem4j</groupId>
           <artifactId>problem4j-core</artifactId>
           <version>1.4.1</version>
       </dependency>
   </dependencies>
   ```
2. Gradle (Groovy or Kotlin DSL):
   ```kt
   dependencies {
       implementation("io.github.problem4j:problem4j-core:1.4.1")
   }
    ```

## Throw a `ProblemException`

The most basic method is to throw a `ProblemException` or its subclass.

```java
import io.github.problem4j.core.Problem;
import io.github.problem4j.core.ProblemException;

// ...

Problem problem =
    Problem.builder()
        .type("https://example.com/errors/invalid-request")
        .title("Invalid Request")
        .status(400)
        .detail("not a valid json")
        .instance("https://example.com/instances/1234")
        .build();
throw new ProblemException(problem);
```

To retrieve the `Problem` object from that exception, simply catch it and call `ex.getProblem()` method on it.

```java
import io.github.problem4j.core.Problem;
import io.github.problem4j.core.ProblemException;

// ...

try {
  // ...
} catch (ProblemException e) {
  Problem problem = e.getProblem();
  // ...
}
```

## Throw exception annotated with `@ProblemMapping`

If an exception is annotated with `@ProblemMapping`, extracting the underlying `Problem` from it requires a bit of
setup first. Fields such as `type`, `title`, `detail` and `instance` allow to interpolate fields from exception object
for handling dynamic values.

```java
import io.github.problem4j.core.ProblemMapping;

// ...

@ProblemMapping(
        type = "https://example.org/problems/interpolated",
        title = "Test problem",
        status = 400,
        detail = "failed: {message}",
        extensions = {"subject"})
public class InterpolatedException extends RuntimeException {
    
    private final String subject;

    public InterpolatedException(String subject, String message) {
        super(message);
        this.subject = subject;
    }
}

// ...

throw new InterpolatedException("sub", "boom");
```

After catching such exception, to be able to convert it to `Problem` object, you must have an instance of
`ProblemMapper`. Problem4J Core provides a default implementation available from `ProblemMapper.create()` method, but
you may use `AbstractProblemMapper` as a base to customize it further.

Note that `ProblemMapper` returns a `ProblemBuilder` instance.

```java
import io.github.problem4j.core.Problem;
import io.github.problem4j.core.ProblemMapper;

// ...

ProblemMapper problemMapper = ProblemMapper.create();
try {
  // ...
} catch (InterpolatedException e) {
  Problem problem = problemMapper.toProblemBuilder(e).build();
  // such Problem object will have "subject" and e.getMessage() values interpolated into its fields
  // ...
}
```

## Including `ProblemContext` in `@ProblemMapping`-annotated exception

`ProblemMapper` allows passing `ProblemContext` instance as an additional argument to `toProblemBuilder` method. Such
context allows to pass additional data for `@ProblemMapping` fields interpolation.

This can be useful for injecting framework-specific details into a `Problem` object constructed from given exception.

```java
import io.github.problem4j.core.ProblemMapping;

// ...

@ProblemMapping(
        type = "https://example.org/problems/traced",
        title = "Traced Problem",
        status = 400,
        instance = "{context.traceId}")
public class TracingAwareException extends RuntimeException {
    
    public TracingAwareException(String subject, String message) {
        super(message);
        this.subject = subject;
    }
}

throw new TracingAwareException("sub", "boom");
```

```java
import io.github.problem4j.core.Problem;
import io.github.problem4j.core.ProblemContext;
import io.github.problem4j.core.ProblemMapper;

// ...

String traceId = someTracingFramework.getTraceId();
ProblemMapper problemMapper = ProblemMapper.create();
try {
  // ...
} catch (TracingAwareException e) {
  ProblemContext context = ProblemContext.create().put("traceId", traceId);
  Problem problem = problemMapper.toProblemBuilder(e, context).build();
  // such Problem object will have "traceId" value interpolated into "instance" field
  // ...
}
```

## Modifying `Problem` objects

`Problem` objects are immutable. In order to change any of its values, you are required to create a new `Problem`
object. For that purpose, consider using `toBuilder()` method.

For example, to add base URL for a resolvable HTTP URI in `type` field, you may want to do something like in the
following example.

```java
import io.github.problem4j.core.Problem;
import io.github.problem4j.core.ProblemException;

// ...

Problem problem =
    Problem.builder()
        .type("/errors/invalid-request")
        .title("Invalid Request")
        .status(400)
        .detail("not a valid json")
        .instance("/instances/1234")
        .build();
throw new ProblemException(problem);
```

And while resolving that `Problem` object, see how `toBuilder()` chain modifies `type` field. 

```java
import io.github.problem4j.core.Problem;
import io.github.problem4j.core.ProblemException;

// ...

String problemBaseUrl = someConfig.getProblemBaseUrl();
try {
  // ...
} catch (ProblemException e) {
  Problem problem = e.getProblem();
  problem = problem.toBuilder().type(problemBaseUrl + problem.getType()).build();
  // ...
}
```

[maven-central]: https://central.sonatype.com/artifact/io.github.problem4j/problem4j-core
