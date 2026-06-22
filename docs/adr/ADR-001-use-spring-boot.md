# ADR-001: Use Spring Boot for backend

## Status
Accepted

## Context
We need a server-side framework for a Java-based REST API that integrates with a
relational database and an external HTTP service (PalAPI). The framework should
provide strong defaults for security, testing, and deployment.

## Alternatives
Typescript
Flutter (Overhead)
Electron (Overhead)

## Decision
Use Spring Boot 3 with Spring Web, Spring Data JPA, and Spring Security.
Reasons: Developer resources, pre-configurations mean less work

## Consequences
- Convention-over-configuration reduces boilerplate.
- Spring Security simplifies securing the protected endpoint.
- Large ecosystem means easy integration with PostgreSQL, H2 (tests), and WireMock.

## Downsides
- "Padlock" as default security
- Not the fastest
- Debugging
- Static architecture due to pre-configurations
