---
sidebar_position: 2
---

# Jackson v2 Support

For projects still on Jackson v2 (`com.fasterxml.jackson`), the `problem4j-jackson2` module provides the same
functionality as [`problem4j-jackson3`](./jackson), compiled against Jackson `2.x` and **Java 8**.

API differs only in names - the module is called `ProblemModule` and the `MixIn`-annotation `ProblemMixIn`, without the
`*Jackson*` phrase that Jackson v3 naming introduced.

## Registering the Integration

There are in fact three ways, `ObjectMapper` can find out how to serialize and deserialize `Problem` objects.

1. Registering `ProblemModule` in `ObjectMapper` manually.
   ```java
   import com.fasterxml.jackson.databind.ObjectMapper;
   import io.github.problem4j.jackson2.ProblemModule;

   ObjectMapper mapper = new ObjectMapper().registerModule(new ProblemModule());
   ```
2. Registering `ProblemModule` in `ObjectMapper` automatically with `findAndRegisterModules` method.
   ```java
   import com.fasterxml.jackson.databind.ObjectMapper;

   ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
   ```
3. Registering `ProblemMixIn` in `ObjectMapper`.
   ```java
   import com.fasterxml.jackson.databind.ObjectMapper;
   import io.github.problem4j.core.Problem;
   import io.github.problem4j.jackson2.ProblemMixIn;

   ObjectMapper mapper = new ObjectMapper().addMixIn(Problem.class, ProblemMixIn.class);
   ```

With proper setup of `ObjectMapper`, following code will handle `Problem` objects properly.

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

Add library as dependency to Maven or Gradle. See the actual versions on [Maven Central][problem4j-jackson2].
**Java 8** or higher is required to use `problem4j-jackson2` library. **Note** that `problem4j-jackson2` module **does
not** declare `jackson-databind` as a transitive dependency.

1. Maven:
   ```xml
   <dependencies>
       <dependency>
           <groupId>com.fasterxml.jackson.core</groupId>
           <artifactId>jackson-databind</artifactId>
           <version>2.21.3</version>
       </dependency>
       <dependency>
           <groupId>io.github.problem4j</groupId>
           <artifactId>problem4j-core</artifactId>
           <version>2.0.0</version>
       </dependency>
       <dependency>
           <groupId>io.github.problem4j</groupId>
           <artifactId>problem4j-jackson2</artifactId>
           <version>2.0.0</version>
       </dependency>
   </dependencies>
   ```
2. Gradle (Kotlin DSL):
   ```kt
   dependencies {
       implementation("com.fasterxml.jackson.core:jackson-databind:2.21.3")
       implementation("io.github.problem4j:problem4j-core:2.0.0")
       implementation("io.github.problem4j:problem4j-jackson2:2.0.0")
   }
   ```

[problem4j-jackson2]: https://central.sonatype.com/artifact/io.github.problem4j/problem4j-jackson2
