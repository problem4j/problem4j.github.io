---
sidebar_position: 3
---

# Problem4J Jackson

In order to serialize or deserialize `Problem` objects into JSON (or XML) using Jackson (aka `ObjectMapper`), you need
to register appropriate module or `MixIn`-annotation.

Because Jackson v3 has been released with different Maven `groupId`, it's technically possible to include both Jackson
v2 and v3 within a single project, as two separate dependencies. Therefore, there are two modules for integrating
Problem4J with Jackson - `problem4j-jackson2` and `problem4j-jackson3`.

## Integration with Jackson v2

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

## Dependencies for Jackson v2 integration

Add library as dependency to Maven or Gradle. See the actual versions on [Maven Central][problem4j-jackson2].
**Java 8** or higher is required to use `problem4j-jackson2` library. **Note** that `problem4j-jackson2` module **does
not** declare `jackson-databind` as a transitive dependency.

1. Maven:
   ```xml
   <dependencies>
       <dependency>
           <groupId>com.fasterxml.jackson.core</groupId>
           <artifactId>jackson-databind</artifactId>
           <version>2.20.1</version>
       </dependency>
       <dependency>
           <groupId>io.github.problem4j</groupId>
           <artifactId>problem4j-core</artifactId>
           <version>1.4.2</version>
       </dependency>
       <dependency>
           <groupId>io.github.problem4j</groupId>
           <artifactId>problem4j-jackson2</artifactId>
           <version>1.4.2</version>
       </dependency>
   </dependencies>
   ```
2. Gradle (Kotlin DSL):
   ```kt
   dependencies {
       implementation("com.fasterxml.jackson.core:jackson-databind:2.20.0")
       implementation("io.github.problem4j:problem4j-core:1.4.2")
       implementation("io.github.problem4j:problem4j-jackson2:1.4.2")
   }
   ```

## Integration with Jackson v3

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

## Dependencies for Jackson v3 integration

Add library as dependency to Maven or Gradle. See the actual versions on [Maven Central][problem4j-jackson3].
**Java 17** or higher is required to use `problem4j-jackson3` library. **Note** that `problem4j-jackson3` module **does
not** declare `jackson-databind` as a transitive dependency.

1. Maven:
   ```xml
   <dependencies>
       <dependency>
           <groupId>tools.jackson.core</groupId>
           <artifactId>jackson-databind</artifactId>
           <version>3.0.3</version>
       </dependency>
       <dependency>
           <groupId>io.github.problem4j</groupId>
           <artifactId>problem4j-core</artifactId>
           <version>1.4.2</version>
       </dependency>
       <dependency>
           <groupId>io.github.problem4j</groupId>
           <artifactId>problem4j-jackson3</artifactId>
           <version>1.4.2</version>
       </dependency>
   </dependencies>
   ```
2. Gradle (Kotlin DSL):
   ```kt
   dependencies {
       implementation("tools.jackson.core:jackson-databind:3.0.3")
       implementation("io.github.problem4j:problem4j-core:1.4.2")
       implementation("io.github.problem4j:problem4j-jackson3:1.4.2")
   }
   ```

[problem4j-jackson2]: https://central.sonatype.com/artifact/io.github.problem4j/problem4j-jackson2

[problem4j-jackson3]: https://central.sonatype.com/artifact/io.github.problem4j/problem4j-jackson3
