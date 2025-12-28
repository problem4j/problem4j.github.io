---
sidebar_position: 1
---

# Intro

Designing clear and consistent error responses in a REST API is often harder than it looks. Without a shared standard,
each application ends up inventing its own ad-hoc format, which quickly leads to inconsistency and confusion.
[RFC 7807 - Problem Details for HTTP APIs][rfc7807] solves this by defining a simple, extensible JSON structure for
error messages.

**Problem4J** brings this specification into the Java ecosystem, offering a practical way to model, throw, and handle
API errors using `Problem` objects. It helps you enforce a consistent error contract across your services, while staying
flexible enough for custom exceptions and business-specific details.

> Note that [RFC 7807][rfc7807] was later extended in [RFC 9457][rfc9457], however core concepts remain the same.

An example of `application/problem+json` response on HTTP API would look as follows.

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

Problem4J itself aims to be generic enough to allow implementing integrations with various frameworks. Currently the
only integrated frameworks are Jackson (aka `ObjectMapper`) for JSON/XML serialization and deserialization and Spring
Boot (in form of Spring WebFlux and WebMVC) as a primary web framework presenting Problem4J in action. Please visit
appropriate documentation pages for more info. Other integrations may come as well, but please note that nothing is
considered as promised.

Minor information about resons for Problem4J's inception are described in the first blog post -
[Problem4J Project Launch](/blog/2025-12-28-problem4j-project-launch).

[rfc7807]: https://datatracker.ietf.org/doc/html/rfc7807

[rfc9457]: https://datatracker.ietf.org/doc/html/rfc9457
