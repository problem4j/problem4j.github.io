---
sidebar_position: 5
---

# Spring's Internal Exceptions

Selected set of most common Spring exceptions handled by Problem4J Spring.

## Occurrences of `TypeMismatchException`

Triggered for example when trying to pass `String` value into `@RequestParam("param") Integer param`.

```json
{
    "status" : 400,
    "title" : "Bad Request",
    "detail" : "Type mismatch",
    "property" : "age",
    "kind" : "integer"
}
```

## Occurrences of `ErrorResponseException`

Similar to `ProblemException`, but comes from Spring and relies on mutable `ProblemDetails` object.

Explicitly thrown `ErrorResponseException` (or subclasses like `ResponseStatusException`). Each of these exceptions
carry HTTP status within it as well as details to be used in `application/problem+json` response.

Example:

```json
{
    "type" : "https://example.org/problem-type",
    "title" : "Some Error",
    "status" : 400,
    "detail" : "Explanation of the error",
    "instance" : "https://example.org/instances/123"
}
```

## General HTTP Stuff

1. If trying to call `POST` for and endpoint with only `GET` (or any other similar situation), service will write
   following response.
   ```json
   {
       "status" : 405,
       "title" : "Method Not Allowed"
   }
   ```
2. If calling REST API with invalid `Accept` header, service will write following response.
   ```json
   {
       "status" : 406,
       "title" : "Not Acceptable"
   }
   ```
3. If calling REST API with invalid `Content-Type` header, service will write following response.
   ```json
   {
       "status" : 415,
       "title" : "Unsupported Media Type"
   }
   ```
4. If passing request body that has invalid JSON syntax, service will write following response.
   ```json
   {
       "status" : 400,
       "title" : "Bad Request"
   }
   ```
5. If passing request that's too large by configuration, service will write following response. Note that reason phrase
   for `413` was changed into `Content Too Large` in [RFC 9110 §15.5.14][rfc9110-15.5.4].
   ```json
   {
       "status" : 413,
       "title" : "Content Too Large"
   }
   ```
