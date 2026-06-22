# Architecture Decision Records (ADRs)

Architekturentscheidungen für dieses Projekt werden hier im
[MADR](https://adr.github.io/madr/)-Format (Markdown Architectural Decision Records) dokumentiert.

## Index

| ID                                                          | Titel | Status |
|-------------------------------------------------------------|-------|--------|
| [ADR-001](ADR-001-use-spring-boot.md)                       | Spring Boot für das Backend verwenden | Akzeptiert |
| [ADR-002](ADR-002-use-angular-typescript.md)                | Angular + TypeScript für das Frontend verwenden | Akzeptiert |
| [ADR-003](ADR-003-use-postgresql.md)                        | PostgreSQL als Persistenzschicht verwenden | Akzeptiert |
| [ADR-004](ADR-004-use-palapi.md)                           | PalAPI als externer Backend-Service | Akzeptiert |
| [ADR-005](ADR-005-use-feature-specific-folder-structure.md) | Feature-spezifische Ordnerstruktur statt schichtenspezifischer Struktur verwenden | Akzeptiert |
| [ADR-006](ADR-006-use-typescript.md)                        | TypeScript für das Frontend verwenden | Akzeptiert |
| [ADR-007](ADR-007-use-prisma.md)                            | Prisma für Datenbankmigrationen und Seeding verwenden | Akzeptiert |
| [ADR-008](ADR-008-use-hidden-egg-assignment.md)             | Verdeckte Ei-Pal-Zuweisung verwenden | Akzeptiert |
| [ADR-009](ADR-009-authentication-strategy.md)             | Authentifizierungsstrategie für geschützte Benutzerfunktionen | Akzeptiert |
| [ADR-010](ADR-010-use-h2-for-backend-tests.md)             | H2 In-Memory-Datenbank für Backend-Tests verwenden | Akzeptiert |
| [ADR-011](ADR-011-use-playwright-for-e2e-tests.md)             | Playwright für End-to-End-Tests verwenden | Akzeptiert |

## Vorlage

```markdown
# ADR-XXX: [Kurzer Titel]

## Status
[Vorgeschlagen | Akzeptiert | Veraltet | Ersetzt durch ADR-YYY]

## Kontext
[Beschreibe die Situation, die die Entscheidung motiviert hat]

## Entscheidung
[Formuliere die Entscheidung klar]

## Konsequenzen
[Beschreibe den resultierenden Kontext nach Anwendung der Entscheidung]
```
