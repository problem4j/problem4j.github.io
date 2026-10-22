---
sidebar_position: 1
---

# Exception Resolution Reference

Complete listing of what Problem4J Spring responds with for each Spring exception it handles out of the box, and for
exceptions it knows nothing about. Use it to look up a particular response - for an introduction, see
[Exception Handling](../problem4j-spring/exception-handling) and
[Spring's Internal Exceptions](../problem4j-spring/springs-internal-exceptions).

All responses below are the defaults, before any of your customizations are applied:

- `title` is always derived from `status` (e.g. `400` becomes `"Bad Request"`), unless stated otherwise.
- `detail` texts are shown in the default `capitalized` format. With
  [`problem4j.detail-format`](../problem4j-spring/setting-up-and-configuration#problem4jdetail-format) set to
  `lowercase` or `uppercase`, they become `"validation failed"` or `"VALIDATION FAILED"`. Details copied from the
  exception itself (`ErrorResponseException`, `@ResponseStatus` reason) are never reformatted.
- [`ProblemPostProcessor`](../problem4j-spring/problem-post-processor) (`type`, `title` and `instance` overrides) runs
  afterward, on every response listed here.
- Every built-in resolver can be replaced by declaring your own `ProblemResolver` bean for the same exception class (see
  [Implementing `ProblemResolver`](../problem4j-spring/exception-handling#implementing-problemresolver)).

## How an Exception Is Resolved

For an exception thrown from a controller, the first matching step wins:

1. `ProblemException` - its own `Problem` is returned as is.
2. Exception class annotated with `@ProblemMapping` - mapped from the annotation.
3. A `ProblemResolver` registered for the exception class, or for its closest superclass - see the tables below.
4. Exception class annotated with Spring's `@ResponseStatus` - its `code` becomes `status` and its non-empty `reason`
   becomes `detail`.
5. Anything else - [unknown exception](#unknown-exceptions), resolved as `500 Internal Server Error`.

Spring's own exceptions that Spring Framework already assigns an HTTP status to (those handled by its
`ResponseEntityExceptionHandler`, such as `NoResourceFoundException`) go through step 3 as well. If no resolver
matches, they keep the status Spring assigned instead of falling back to `500`.

Errors that never reach a controller (e.g. thrown by a servlet filter) are rendered by Spring Boot's error handling,
which Problem4J replaces too. These carry only the status Spring Boot determined:

```json
{
  "status" : 404,
  "title" : "Not Found"
}
```

The built-in resolvers are registered only if the exception class they handle is on the classpath, so WebMVC-only and
WebFlux-only exceptions don't need to be told apart in your configuration.

## Validation

| Exception                                                               | Status | `detail`              | Extensions         |
|-------------------------------------------------------------------------|--------|-----------------------|--------------------|
| `BindException`, `MethodArgumentNotValidException` (WebMVC)             | `400`  | `"Validation failed"` | `errors`           |
| `WebExchangeBindException` (WebFlux)                                    | `400`  | `"Validation failed"` | `errors`           |
| `HandlerMethodValidationException`                                      | `400`  | `"Validation failed"` | `errors`           |
| `HandlerMethodValidationException`, for invalid return value            | `500`  | -                     | -                  |
| `MethodValidationException`                                             | `400`  | `"Validation failed"` | `errors`           |
| `jakarta.validation.ConstraintViolationException`                       | `400`  | `"Validation failed"` | `errors`           |

`errors` lists every violation as `field` and `error` (the constraint message). For `ConstraintViolationException`,
`field` is the last element of the violation's property path.

```json
{
  "status" : 400,
  "title" : "Bad Request",
  "detail" : "Validation failed",
  "errors" : [ {
    "field" : "email",
    "error" : "must be a well-formed email address"
  } ]
}
```

See [Validation Errors](../problem4j-spring/validation-errors) for how field names are resolved and customized.

## Type Conversion and Request Body

| Exception                                                                                      | Status | `detail`          | Extensions         |
|------------------------------------------------------------------------------------------------|--------|-------------------|--------------------|
| `TypeMismatchException`, `MethodArgumentTypeMismatchException`, `ConversionNotSupportedException` | `400`  | `"Type mismatch"` | `property`, `kind` |
| `ServerWebInputException` caused by `TypeMismatchException` (WebFlux)                          | `400`  | `"Type mismatch"` | `property`, `kind` |
| `HttpMessageNotReadableException` caused by a value of wrong type in JSON body                  | `400`  | `"Type mismatch"` | `property`, `kind` |
| `DecodingException` / `ServerWebInputException` caused by a value of wrong type in JSON body (WebFlux) | `400`  | `"Type mismatch"` | `property`, `kind` |
| `HttpMessageNotReadableException`, otherwise (e.g. malformed JSON)                             | `400`  | -                 | -                  |
| `DecodingException`, otherwise (WebFlux)                                                       | `400`  | -                 | -                  |
| `ServerWebInputException`, otherwise (WebFlux)                                                 | `400`  | -                 | -                  |

- `property` is the name of the parameter, or the dot-separated path of the JSON property (e.g. `"address.city"`).
  In WebFlux, if Spring doesn't provide it, the name of the handler method parameter is used.
- `kind` is the expected type, as named by the `TypeNameMapper` bean. The default `SimpleTypeNameMapper` names integer
  types `"integer"`, decimal types `"number"`, and also knows `"boolean"`, `"string"`, `"enum"` and `"array"` (arrays
  and collections). `kind` is omitted for types the mapper doesn't name.
- If the type mismatch in the JSON body can't be pinned to a property (e.g. the whole body has wrong type), the
  response has no `detail` and no extensions.

```json
{
  "status" : 400,
  "title" : "Bad Request",
  "detail" : "Type mismatch",
  "property" : "age",
  "kind" : "integer"
}
```

## Missing Request Values

| Exception                                                                      | Status | `detail`                      | Extensions      |
|--------------------------------------------------------------------------------|--------|-------------------------------|-----------------|
| `MissingServletRequestParameterException` (WebMVC)                             | `400`  | `"Missing request param"`     | `param`, `kind` |
| `MissingServletRequestPartException` (WebMVC)                                  | `400`  | `"Missing request part"`      | `param`         |
| `MissingRequestHeaderException` (WebMVC)                                       | `400`  | `"Missing header"`            | `header`        |
| `MissingRequestCookieException` (WebMVC)                                       | `400`  | `"Missing cookie"`            | `cookie`        |
| `MissingPathVariableException` (WebMVC)                                        | `400`  | `"Missing path variable"`     | `name`          |
| `ServletRequestBindingException` for missing request attribute (WebMVC)        | `400`  | `"Missing request attribute"` | `attribute`     |
| `ServletRequestBindingException` for missing session attribute (WebMVC)        | `400`  | `"Missing session attribute"` | `attribute`     |
| `ServletRequestBindingException`, otherwise (WebMVC)                           | `400`  | -                             | -               |
| `MissingRequestValueException` for query parameter (WebFlux)                   | `400`  | `"Missing request param"`     | `param`, `kind` |
| `MissingRequestValueException` for request part (WebFlux)                      | `400`  | `"Missing request part"`      | `param`         |
| `MissingRequestValueException` for header (WebFlux)                            | `400`  | `"Missing header"`            | `header`        |
| `MissingRequestValueException` for cookie (WebFlux)                            | `400`  | `"Missing cookie"`            | `cookie`        |
| `MissingRequestValueException` for path variable (WebFlux)                     | `400`  | `"Missing path variable"`     | `name`          |
| `MissingRequestValueException` for request attribute (WebFlux)                 | `400`  | `"Missing request attribute"` | `attribute`     |
| `MissingRequestValueException` for session attribute (WebFlux)                 | `400`  | `"Missing session attribute"` | `attribute`     |
| `ServerErrorException` for missing `@PathVariable` (WebFlux)                   | `400`  | `"Missing path variable"`     | `name`          |

Each extension holds the name of the missing value. `kind` of a missing request param is the lowercase simple name of
the parameter's Java type (e.g. `"string"`, `"long"`, `"localdate"`) - unlike in
[type conversion errors](#type-conversion-and-request-body), it's not named by the `TypeNameMapper`.

```json
{
  "status" : 400,
  "title" : "Bad Request",
  "detail" : "Missing request param",
  "param" : "page",
  "kind" : "integer"
}
```

## HTTP Protocol

| Exception                                                         | Status | `detail`                     | Extensions |
|-------------------------------------------------------------------|--------|------------------------------|------------|
| `HttpRequestMethodNotSupportedException` (WebMVC)                 | `405`  | -                            | -          |
| `MethodNotAllowedException` (WebFlux)                             | `405`  | -                            | -          |
| `HttpMediaTypeNotAcceptableException` (WebMVC)                    | `406`  | -                            | -          |
| `NotAcceptableStatusException` (WebFlux)                          | `406`  | -                            | -          |
| `HttpMediaTypeNotSupportedException` (WebMVC)                     | `415`  | -                            | -          |
| `UnsupportedMediaTypeStatusException` (WebFlux)                   | `415`  | -                            | -          |
| `MaxUploadSizeExceededException` (WebMVC)                         | `413`  | `"Max upload size exceeded"` | `max`      |
| `PayloadTooLargeException` (WebFlux)                              | `413`  | -                            | -          |
| `MultipartException`, otherwise (WebMVC)                          | `400`  | -                            | -          |
| `NoResourceFoundException`, `NoHandlerFoundException`             | `404`  | -                            | -          |
| `AsyncRequestTimeoutException` (WebMVC)                           | `503`  | -                            | -          |
| `HttpMessageNotWritableException` (WebMVC)                        | `500`  | -                            | -          |

`max` is the configured upload limit in bytes, included only if Spring knows it. Note that the reason phrase for `413`
is `Content Too Large`, per [RFC 9110 §15.5.14][rfc9110-15.5.14].

```json
{
  "status" : 413,
  "title" : "Content Too Large",
  "detail" : "Max upload size exceeded",
  "max" : 1048576
}
```

For accessing unregistered paths, see also [FAQ](../problem4j-spring/faq).

## Spring's Generic Status Exceptions

| Exception                                                    | Status                   | `detail`                          | Extensions                    |
|--------------------------------------------------------------|--------------------------|-----------------------------------|-------------------------------|
| `ErrorResponseException` and its other subclasses            | exception's status       | from exception's `ProblemDetail`  | from `ProblemDetail` properties |
| `ResponseStatusException` and its other subclasses           | exception's status       | -                                 | -                             |
| `ServerErrorException`, otherwise (WebFlux)                  | `500`                    | -                                 | -                             |

- `ErrorResponseException` is Spring's counterpart of `ProblemException`. Its `ProblemDetail` is copied whole - `type`,
  `title`, `detail`, `instance` and all custom properties.
- `ResponseStatusException` (e.g. `throw new ResponseStatusException(HttpStatus.GONE, "reason")`) keeps only the status.
  Its reason is not exposed, as it often contains internal details. Throw `ErrorResponseException` or `ProblemException`
  to return a `detail`.

```json
{
  "status" : 410,
  "title" : "Gone"
}
```

## Unknown Exceptions

Any exception not covered by the steps in [How an Exception Is Resolved](#how-an-exception-is-resolved) - typically a
`RuntimeException` from your own code or from a library - is resolved as:

```json
{
  "status" : 500,
  "title" : "Internal Server Error"
}
```

The exception's message, class and stack trace are never part of the response. To log them, use
[advice inspectors](../problem4j-spring/logging).

The same response is returned if resolution itself fails, e.g. when a custom `ProblemResolver` or
`ProblemPostProcessor` throws. In that case, a warning is logged with the exception thrown during resolution, along with
the class and message of the original exception.

To give an unknown exception a dedicated response, annotate it with `@ProblemMapping`, extend `ProblemException`,
register a `ProblemResolver` for it, or annotate it with Spring's `@ResponseStatus`:

```java
@ResponseStatus(code = HttpStatus.CONFLICT, reason = "Coupon already exists")
public class CouponAlreadyExistsException extends RuntimeException {}
```

```json
{
  "status" : 409,
  "title" : "Conflict",
  "detail" : "Coupon already exists"
}
```

[rfc9110-15.5.14]: https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.14
