---
slug: 2026-05-10-problem4j-major-version-update
title: Problem4J Major Version Update
authors: damianmalczewski
tags: [hello, release]
---

Hi again 👋

I’m excited to share that Problem4J has just released a major new version across all modules. This update is focused on cleaning up the library design, improving maintainability, and delivering a more polished public API.

{/* truncate */}

Deprecations were removed, the public API was refined, and experimental concepts were either fully embraced (for example, `ProblemContext` in the core library) or intentionally simplified and delegated to application code (like the cache eviction for `ProblemResolverStore` implementations).

---

The following modules and versions are the current generation of this project:

* Core
  * `io.github.problem4j:problem4j-core:2.0.0`
* Jackson Integration
  * `io.github.problem4j:problem4j-jackson2:2.0.0` (Jackson 2 - `com.fasterxml.jackson`)
  * `io.github.problem4j:problem4j-jackson3:2.0.0` (Jackson 3 - `tools.jackson`)
* Spring Boot 4.x Integration
  * `io.github.problem4j:problem4j-spring-bom:3.0.0`
  * `io.github.problem4j:problem4j-spring-web:3.0.0`
  * `io.github.problem4j:problem4j-spring-webflux:3.0.0`
  * `io.github.problem4j:problem4j-spring-webmvc:3.0.0`

---

As always, feedback, ideas, and contributions are very welcome.
