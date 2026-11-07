---
sidebar_position: 1
---

# Jackson Integration

In order to serialize or deserialize `Problem` objects into JSON (or XML) using Jackson (aka `ObjectMapper`), you need
to register appropriate module or `MixIn`-annotation.

This page describes `problem4j-jackson3` module for Jackson 3. For applications still using Jackson 2, see
[Jackson v2 Support](./02-jackson-v2-support.md).

## Registering the Integration

There are three ways to let `JsonMapper` serialize and deserialize `Problem` objects.

Register `ProblemJacksonModule` in `JsonMapper` manually:

```java
import io.github.problem4j.jackson3.ProblemJacksonModule;
import tools.jackson.databind.JsonMapper;

JsonMapper mapper =
    JsonMapper.builder()
        .addModule(new ProblemJacksonModule())
        .build();
```

Or let `JsonMapper` discover `ProblemJacksonModule` automatically with `findAndAddModules` method:

```java
import tools.jackson.databind.JsonMapper;

JsonMapper mapper = JsonMapper.builder().findAndAddModules().build();
```

Or register `ProblemJacksonMixIn` in `JsonMapper`:

```java
import io.github.problem4j.core.Problem;
import io.github.problem4j.jackson3.ProblemJacksonMixIn;
import tools.jackson.databind.JsonMapper;

JsonMapper mapper =
    JsonMapper.builder()
        .addMixIn(Problem.class, ProblemJacksonMixIn.class)
        .build();
```

With proper setup of `JsonMapper`, following code will handle `Problem` objects properly.

```java
import io.github.problem4j.core.Problem;

// ...

Problem problem = 
    Problem.builder()
        .title("Bad Request")
        .status(400)
        .detail("not a valid json")
        .build();

String json = mapper.writeValueAsString(problem);
Problem parsed = mapper.readValue(json, Problem.class);
```

## Dependency

Add library as dependency to Maven or Gradle. See the actual versions on [Maven Central][problem4j-jackson3].
**Java 17** or higher is required to use `problem4j-jackson3` library. **Note** that `problem4j-jackson3` module **does
not** declare `jackson-databind` as a transitive dependency.

```xml
<dependencies>
    <dependency>
        <groupId>tools.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>3.2.4</version>
    </dependency>
    <dependency>
        <groupId>io.github.problem4j</groupId>
        <artifactId>problem4j-core</artifactId>
        <version>2.0.1</version>
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
    implementation("tools.jackson.core:jackson-databind:3.2.4")
    implementation("io.github.problem4j:problem4j-core:2.0.1")
    implementation("io.github.problem4j:problem4j-jackson3:2.0.0")
}
```

[problem4j-jackson3]: https://central.sonatype.com/artifact/io.github.problem4j/problem4j-jackson3
