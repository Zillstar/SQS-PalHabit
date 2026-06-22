# ADR-007: Use Prisma for database migrations and seeding

## Status

Accepted

## Context

The project requires a reproducible database schema and automated import of Pal data.

## Alternatives

* Manual SQL scripts
* Flyway
* Liquibase
* Hibernate schema generation

## Decision

Use Prisma for schema management, migrations and seeding.

Prisma is not used as the runtime persistence layer. Runtime access is handled by Spring Boot and JPA/Hibernate.

## Consequences

* Database schema is version-controlled.
* Team members can recreate the database consistently.
* Pal data can be imported automatically through seed scripts.

## Downsides

* Additional tooling besides Spring Boot.
* Prisma 7 introduces extra configuration requirements.
