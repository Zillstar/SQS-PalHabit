# ADR-007: Prisma für Datenbankmigrationen und Seeding verwenden

## Status

Akzeptiert

## Kontext

Das Projekt benötigt ein reproduzierbares Datenbankschema und automatisierten Import von Pal-Daten.

## Alternativen

* Manuelle SQL-Skripte
* Flyway
* Liquibase
* Hibernate-Schemagenerierung

## Entscheidung

Prisma für Schemaverwaltung, Migrationen und Seeding verwenden.

Prisma wird nicht als Runtime-Persistenzschicht verwendet. Runtime-Zugriff wird durch Spring Boot und JPA/Hibernate gehandhabt.

## Konsequenzen

* Das Datenbankschema ist versioniert.
* Teammitglieder können die Datenbank konsistent neu erstellen.
* Pal-Daten können automatisch durch Seed-Skripte importiert werden.

## Nachteile

* Zusätzliches Tooling neben Spring Boot.
* Prisma 7 führt zusätzliche Konfigurationsanforderungen ein.
