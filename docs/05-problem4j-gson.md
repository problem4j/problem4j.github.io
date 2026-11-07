---
sidebar_position: 5
---

# Problem4J Gson

In order to serialize or deserialize `Problem` objects into JSON using [Gson][gson], you need to register
`ProblemTypeAdapterFactory` in `GsonBuilder`. The module requires only **Java 8**, so it fits also older applications
and environments where Jackson is not an option.

## Registering the Integration

`ProblemTypeAdapterFactory` is a standard Gson `TypeAdapterFactory`, so it's registered the same way as any other
adapter factory.

```java
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.github.problem4j.gson.ProblemTypeAdapterFactory;

Gson gson = new GsonBuilder()
    .registerTypeAdapterFactory(new ProblemTypeAdapterFactory())
    .create();
```

With proper setup of `Gson`, following code will handle `Problem` objects properly.

```java
import io.github.problem4j.core.Problem;

// ...

Problem problem =
    Problem.builder()
        .title("Bad Request")
        .status(400)
        .detail("not a valid json")
        .extension("userId", "u-123")
        .build();

String json = gson.toJson(problem, Problem.class);
Problem parsed = gson.fromJson(json, Problem.class);
```

Will result in following JSON:

```json
{"title":"Bad Request","status":400,"detail":"not a valid json","userId":"u-123"}
```

Standard members are written first, followed by extensions in alphabetical order. Members without value (e.g. missing
`type` or `instance`) are omitted.

If using Java module system, add the following `requires` directive to your `module-info.java` file.

```java
module org.example.project {
    requires io.github.problem4j.gson;
}
```

## Numeric Extensions

Extension values are read with Gson's own `Object` adapter, so they follow the `GsonBuilder` configuration. By default,
Gson reads every JSON number as `Double`, therefore an extension written as `42` is read back as `42.0`. To keep
integral numbers as `Long`, configure the number strategy.

```java
import com.google.gson.ToNumberPolicy;

Gson gson = new GsonBuilder()
    .registerTypeAdapterFactory(new ProblemTypeAdapterFactory())
    .setObjectToNumberStrategy(ToNumberPolicy.LONG_OR_DOUBLE)
    .create();
```

## Dependency

Add library as dependency to Maven or Gradle. See the actual versions on [Maven Central][problem4j-gson]. **Java 8** or
higher is required to use `problem4j-gson` library. **Note** that `problem4j-gson` module **does not** declare `gson`
nor `problem4j-core` as transitive dependencies.

```xml
<dependencies>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.15.0</version>
    </dependency>
    <dependency>
        <groupId>io.github.problem4j</groupId>
        <artifactId>problem4j-core</artifactId>
        <version>2.0.1</version>
    </dependency>
    <dependency>
        <groupId>io.github.problem4j</groupId>
        <artifactId>problem4j-gson</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

```kt
dependencies {
    implementation("com.google.code.gson:gson:2.15.0")
    implementation("io.github.problem4j:problem4j-core:2.0.1")
    implementation("io.github.problem4j:problem4j-gson:1.0.0")
}
```

[gson]: https://github.com/google/gson

[problem4j-gson]: https://central.sonatype.com/artifact/io.github.problem4j/problem4j-gson
