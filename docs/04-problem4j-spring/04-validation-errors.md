---
sidebar_position: 4
---

# Validation Errors

Returning validation errors for HTTP request arguments.

Library overrides default responses for `jakarta.validation` exceptions for both `@RequestBody` and any other
`@RestController` arguments.

```json
{
  "status" : 400,
  "title" : "Bad Request",
  "detail" : "Validation failed",
  "errors" : [ {
    "field" : "email",
    "error" : "must be a well-formed email address"
  }, {
    "field" : "age",
    "error" : "must be greater than or equal to 18"
  } ]
}
```

## Adapted Constraint Violations

More notably, for `@RequestParam`, `@RequestHeader` etc., there's a tweak that comes from settings configuration
property `spring.validation.method.adapt-constraint-violations` to `true`. Enabling it, switches default validation to
not rely on raw `ConstraintViolationException`, but rather on `MethodValidationException`, which contains more details
about validated element.

Let's say we have following `@RestController`, where `customerId` query param has different Java parameter name (its
`String customerIdParam`). We would like to have `customerId` in our response body as potential API clients do not have
knowledge about internal technologies used by backend.

```java
@Validated
@RestController
public class RequestParamController {

  @GetMapping("/endpoint")      // note that query param in annotation different name from method param
  public String endpoint(@Size(min = 5, max = 30) @RequestParam("customerId") String customerIdParam) {
    return "OK";
  }
}
```

The `.errors[].field` will differ, depending on whether `spring.validation.method.adapt-constraint-violations` is
enabled or not. For `true` it will use value from `@RequestParam` (if able), and not from Java method argument name (the
same goes for `@PathVariable`, `@RequestHeader`, `@CookieValue` etc.).

1. For `ConstraintViolationException`:
   ```json
   {
     "status" : 400,
     "title" : "Bad Request",
     "detail" : "Validation failed",
     "errors" : [ {
       "field" : "customerIdParam",
       "error" : "size must be between 5 and 30"
     } ]
   }
   ```
2. For `MethodValidationException`:
   ```json
   {
     "status" : 400,
     "title" : "Bad Request",
     "detail" : "Validation failed",
     "errors" : [ {
       "field" : "customerId",
       "error" : "size must be between 5 and 30"
     } ]
   }
   ```

[`MethodValidationProblemResolver`][MethodValidationProblemResolver] contains implementation of retrieving configured
values from parameter annotations.

> For Spring Boot versions lower than `3.5`, the above-mentioned property is not available and one must configure it
> programmatically. Consider checking up `org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration`
> and [Method Validation Exceptions][method-validation-exceptions] chapter of Spring Framework documentation.
>
> ```java
> @Configuration
> public class ExampleConfiguration {
>
>   @Bean
>   public MethodValidationPostProcessor methodValidationPostProcessor() {
>     MethodValidationPostProcessor processor = new MethodValidationPostProcessor();
>     processor.setAdaptConstraintViolations(true);
>     return processor;
>   }
> }
> ```

Method `setAdaptConstraintViolations` is available since Spring Framework `6.1` (therefore since Spring Boot `3.2`).

## Supporting `@ModelAttribute` and `@BindParam`

Similarly, for `@ModelAttribute` method arguments (object that groups query or form params), violation field names are
resolved from `@BindParam` annotation if present on canonical constructor parameters.

Let's see the following example.

```java
public class QueryBindObject {

  @Size(min = 1, max = 5)
  private final String text;

  @Positive
  private final Integer number;

  public QueryBindObject(String text, @BindParam("num") Integer number) {
    this.text = text;
    this.number = number;
  }

  // ...
}
```

Given `QueryBindObject`, declares, that a `num` query parameter will be resolved into `number` constructor argument.
Therefore, for violation of that field name, we would like error to point to `num` field as being invalid instead of
`number`.

```java
@Validated
@RestController
public class RequestParamController {

  @GetMapping(path = "/endpoint")
  public String endpoint(@ModelAttribute @Valid QueryBindObject query) {
    return "OK";
  }
}
```

While resolving constraint violation error, Problem4J will resolve `@BindParam` annotations present on canonical
constructor of `@ModelAttribute`-annotated request argument. Node that if there's no annotation on controller method,
Spring automatically assumes it to be a `@ModelAttribute`.

**Note** that given object must have exactly one, full-args constructor if it is an ordinary `class`. If multiple
constructors are present, Problem4J will skip evaluation of `@BindParam`. If it is a `record`, then actual arguments
will be taken from **record's canonical constructor**, and additional constructors are ignored.

[MethodValidationProblemResolver]: https://github.com/problem4j/problem4j-spring/blob/v2.2.2/problem4j-spring-web/src/main/java/io/github/problem4j/spring/web/resolver/MethodValidationProblemResolver.java

[method-validation-exceptions]: https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html#validation-beanvalidation-spring-method-exceptions
