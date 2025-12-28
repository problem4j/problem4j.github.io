---
sidebar_position: 8
---

# FAQ

Questions and answers about using and debugging Problem4J Spring.

## Accessing unregistered HTTP path doesn't return proper response body

1. In Spring Boot versions before `3.2.0`, Spring WebMVC required setting following property for
   `NoHandlerFoundException` to ever be thrown.
   ```properties
   spring.mvc.throw-exception-if-no-handler-found=true
   ```
   See `org.springframework.boot.autoconfigure.web.servlet.WebMvcProperties` class to debug it yourself.
2. By default, Spring Boot includes mappings to static resources. If you want to disable them and make Spring return 404
   on `src/main/resources/static/*` (and others), set following property.
   ```properties
   spring.web.resources.add-mappings=false
   ```
   See `org.springframework.boot.autoconfigure.web.SpringWebProperties` class to debug it yourself.

## Messages of `jakarta.validation` errors are localized

Property `spring.web.locale-resolved` default has `accept_header`, to prioritize `Accept` header. Consider updating it
as it follows.

```properties
spring.web.locale=en_US
spring.web.locale-resolver=fixed
```

See `org.springframework.boot.autoconfigure.web.SpringWebProperties` class to debug it yourself.
