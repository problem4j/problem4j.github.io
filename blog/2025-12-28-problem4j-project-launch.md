---
slug: 2025-12-28-problem4j-project-launch
title: Problem4J Project Launch
authors: malczuuu
tags: [hello, release]
---

Hi everyone 👋

Allow me to introduce Problem4J to y'all. It's another set of Java libraries implementing **RFC7807 - Problem Details
for HTTP APIs**.

Problem4J is a package of libraries that introduces RFC Problem Details to the Java ecosystem. It combines an
imperative approach, based on extending a common exception type (`ProblemException`), with a declarative,
annotation-based approach (via `@ProblemMapping`). As a primary set of modules, `problem4j-core`, `problem4j-jackson`,
and `problem4j-spring` were introduced, providing a core (framework-agnostic) module, Jackson integration (both v2 -
`com.fasterxml.jackson` and v3 - `tools.jackson`), as well as Spring Boot integration (supporting both leading versions
\- v3 and v4). Other integrations may (or may not) eventually arrive  (...)

{/* truncate */}

**Why should I care?**  

If you are building HTTP APIs in Java, Problem4J aims to reduce the boilerplate around error handling while keeping
your domain logic clean and explicit. By clearly separating the `Problem` representation from exceptions, and by 
offering both imperative and declarative mapping options, the library helps you produce consistent, standards-compliant
error responses without tightly coupling your code to a specific framework. This becomes especially useful in high-end
framework applications (such as Spring Boot), where sensible defaults and simple extension points can significantly
improve both developer experience and maintainability.

---

The following modules and versions are considered the first public releases of this library. Previous versions were
developed as a "personal playground" under the `io.github.malczuuu.problem4j` group namespace.

* Core
  * `io.github.problem4j:problem4j-core:1.3.0`
* Jackson Integration
  * `io.github.problem4j:problem4j-jackson2:1.3.0` (Jackson 2 - `com.fasterxml.jackson`)
  * `io.github.problem4j:problem4j-jackson3:1.3.0` (Jackson 3 - `tools.jackson`)
* Spring Boot 3.x Integration
  * `io.github.problem4j:problem4j-spring-bom:1.2.0`
  * `io.github.problem4j:problem4j-spring-web:1.2.0`
  * `io.github.problem4j:problem4j-spring-webflux:1.2.0`
  * `io.github.problem4j:problem4j-spring-webmvc:1.2.0`
* Spring Boot 4.x Integration
  * `io.github.problem4j:problem4j-spring-bom:2.1.0`
  * `io.github.problem4j:problem4j-spring-web:2.1.0`
  * `io.github.problem4j:problem4j-spring-webflux:2.1.0`
  * `io.github.problem4j:problem4j-spring-webmvc:2.1.0`

---

The main inspiration was the idea of taking a slightly different approach than [`zalando/problem`][zalando-problem], as
well as the fact that [`zalando/problem-spring-web`][zalando-problem-spring-web] does not seem to have received an
update for Spring Boot 4 at the time of writing this post. What differentiates this library from Zalando's is the
separation of the `Problem` model from the throwable `ProblemException`, including a declarative approach with
`@ProblemMapping` annotation, as well as making Spring Boot's predefined exception handlers more beginner-friendly
(simple `ProblemResolver` implementations declared as `@Component`s). Moreover, predefined Spring Boot error messages
tend to hide exception internals and do not expose plain exception messages in HTTP responses.

---

Feedback, ideas, and contributions are very welcome 🚀

**References**

* [RFC7807 - Problem Details for HTTP APIs][rfc7807]
* [RFC9457 - Problem Details for HTTP APIs][rfc9457]

[rfc7807]: https://datatracker.ietf.org/doc/html/rfc7807

[rfc9457]: https://datatracker.ietf.org/doc/html/rfc9457

[zalando-problem]: https://github.com/zalando/problem

[zalando-problem-spring-web]: https://github.com/zalando/problem-spring-web
