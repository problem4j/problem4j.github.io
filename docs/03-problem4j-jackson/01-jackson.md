---
sidebar_position: 1
---

# Jackson Integration

In order to serialize or deserialize `Problem` objects into JSON (or XML) using Jackson (aka `ObjectMapper`), you need
to register appropriate module or `MixIn`-annotation.

Because Jackson v3 has been released with different Maven `groupId`, it's technically possible to include both Jackson
v2 and v3 within a single project, as two separate dependencies. Therefore, there are two modules for integrating
Problem4J with Jackson - `problem4j-jackson3` described here, and `problem4j-jackson2` described in
[Jackson v2 Support](./jackson-v2-support).

| Module               | Jackson Version                                     | Java Baseline |
|----------------------|-----------------------------------------------------|---------------|
| `problem4j-jackson3` | `tools.jackson.core:jackson-databind:3.x.y`         | Java 17       |
| `problem4j-jackson2` | `com.fasterxml.jackson.core:jackson-databind:2.x.y` | Java 8        |

## Registering the Integration

There are in fact three ways, `JsonMapper` can find out how to serialize and deserialize `Problem` objects.

1. Registering `ProblemJacksonModule` in `JsonMapper` manually.
   ```java
   import io.github.problem4j.jackson3.ProblemJacksonModule;
   import tools.jackson.databind.JsonMapper;

   JsonMapper mapper = JsonMapper.builder().addModule(new ProblemJacksonModule()).build();
   ```
2. Registering `ProblemJacksonModule` in `JsonMapper` automatically with `findAndAddModules` method.
   ```java
   import tools.jackson.databind.JsonMapper;

   JsonMapper mapper = JsonMapper.builder().findAndAddModules().build();
   ```
3. Registering `ProblemJacksonMixIn` in `JsonMapper`.
   ```java
   import io.github.problem4j.core.Problem;
   import io.github.problem4j.jackson3.ProblemJacksonMixIn;
   import tools.jackson.databind.JsonMapper;

   JsonMapper mapper = JsonMapper.builder().addMixIn(Problem.class, ProblemJacksonMixIn.class).build();
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

> **Note** that for integration with Jackson v3, both module and `MixIn`-annotation include `*Jackson*` phrase in their
> names. This was done to match naming style with Jackson itself as Jackson v3 had renamed `Module` base class to
> `JacksonModule`.

## Dependency

Add library as dependency to Maven or Gradle. See the actual versions on [Maven Central][problem4j-jackson3].
**Java 17** or higher is required to use `problem4j-jackson3` library. **Note** that `problem4j-jackson3` module **does
not** declare `jackson-databind` as a transitive dependency.

1. Maven:
   ```xml
   <dependencies>
       <dependency>
           <groupId>tools.jackson.core</groupId>
           <artifactId>jackson-databind</artifactId>
           <version>3.1.2</version>
       </dependency>
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
2. Gradle (Kotlin DSL):
   ```kt
   dependencies {
       implementation("tools.jackson.core:jackson-databind:3.1.2")
       implementation("io.github.problem4j:problem4j-core:2.0.0")
       implementation("io.github.problem4j:problem4j-jackson3:2.0.0")
   }
   ```

[problem4j-jackson3]: https://central.sonatype.com/artifact/io.github.problem4j/problem4j-jackson3
