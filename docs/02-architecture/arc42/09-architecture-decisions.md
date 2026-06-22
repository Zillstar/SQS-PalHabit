# Architekturentscheidungen

Dieses Kapitel verweist auf die wichtigsten Architekturentscheidungen des
Projekts. Die vollständigen Entscheidungen sind als Architecture Decision
Records unter `docs/adr/` dokumentiert.

In diesem Kapitel werden die ADRs nicht vollständig wiederholt. Stattdessen wird
zusammengefasst, welche Entscheidungen für die Architektur besonders relevant
sind und welche Konsequenzen daraus für das Projekt entstehen.

| ADR                                                                       | Entscheidung                                               | Status   | Architektonische Bedeutung                                                                                        |
|---------------------------------------------------------------------------|------------------------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------|
| [ADR-001](../../ger-adr/ADR-001-use-spring-boot.md)                       | Spring Boot für das Backend                                | Accepted | Legt das zentrale Backend-Framework fest und bestimmt Aufbau, Dependency Injection, REST-API und Testintegration. |
| [ADR-002](../../ger-adr/ADR-002-use-angular-typescript.md)                | Angular und TypeScript für das Frontend                    | Accepted | Legt die Frontend-Technologie, Komponentenstruktur, Typisierung und Frontend-Teststrategie fest.                  |
| [ADR-003](../../ger-adr/ADR-003-use-postgresql.md)                        | PostgreSQL als Persistenzschicht                           | Accepted | Entscheidet die relationale Datenhaltung und beeinflusst Datenmodell, Migrationen und Docker-Deployment.          |
| [ADR-004](../../ger-adr/ADR-004-use-palapi.md)                           | PalAPI als externe Datenquelle                            | Accepted | Führt eine externe Abhängigkeit ein und erfordert Timeouts, Fallbacks und testbare Schnittstellen.                |
| [ADR-005](../../ger-adr/ADR-005-use-feature-specific-folder-structure.md) | Feature-orientierte Ordnerstruktur                         | Accepted | Unterstützt Wartbarkeit durch fachlich geschnittene Module statt rein technischer Sortierung.                     |
| [ADR-006](../../ger-adr/ADR-006-use-typescript.md)                        | TypeScript für das Frontend                                | Accepted | Erzwingt statische Typisierung und reduziert Fehler durch frühere Compile-Prüfung.                                |
| [ADR-007](../../ger-adr/ADR-007-use-prisma.md)                            | Prisma-Migrationen als dokumentiertes DB-Schema            | Accepted | Macht Datenbankänderungen nachvollziehbar und versioniert das Datenbankschema.                                    |
| [ADR-008](../../ger-adr/ADR-008-use-hidden-egg-assignment.md)             | Versteckte Ei-Zuweisung am Anfang des Pal-Fortschritts | Accepted | Definiert eine zentrale fachliche Spiellogik und beeinflusst Registrierung, Fortschritt und UI-Darstellung.       |
| [ADR-009](../../ger-adr/ADR-009-authentication-strategy.md)               | Serverseitige Session-Authentifizierung                    | Accepted | Legt das Sicherheitsmodell fest und beeinflusst Backend-Endpunkte, Frontend-Requests und Zugriffsschutz.          |
| [ADR-010](../../ger-adr/ADR-010-use-h2-for-backend-tests.md)              | H2 für Backend-Tests                                       | Accepted | Ermöglicht schnelle, isolierte Backend-Tests ohne externe PostgreSQL-Testdatenbank.                               |
| [ADR-011](../../ger-adr/ADR-011-use-playwright-for-e2e-tests.md)          | Playwright für E2E-Tests                                   | Accepted | Legt die Browser-Teststrategie fest und sichert zentrale User-Flows ab.                                           |

## Besonders relevante Entscheidungen

Die wichtigsten Architekturentscheidungen betreffen die Grundstruktur der
Anwendung: Spring Boot im Backend, Angular im Frontend, PostgreSQL als
Datenbank und Docker Compose als lokales Deployment. Diese Entscheidungen legen
fest, wie die Anwendung entwickelt, getestet und betrieben wird.

Ebenfalls kritisch ist die Entscheidung für serverseitige Session-
Authentifizierung. Sie bestimmt, wie Login, Logout, geschützte Endpunkte und
Frontend-Requests umgesetzt werden. Da fachliche Daten nutzerbezogen sind, ist
diese Entscheidung sicherheitsrelevant.

Die Entscheidung für externe Dienste wie PalAPI beeinflusst die Stabilität der
Anwendung. Deshalb wurden Fallbacks, Timeouts und testbare Schnittstellen
notwendig. Externe API-Ausfälle dürfen die Kernfunktionen der Anwendung nicht
blockieren.

Die Testentscheidungen zu H2 und Playwright sind ebenfalls architektonisch
relevant. Sie legen fest, wie automatisierte Qualitätssicherung reproduzierbar
ausgeführt wird und wie Backend-Integration sowie echte Browser-Flows geprüft
werden.

## Umgang mit weiteren Entscheidungen

Nicht jede technische Detailentscheidung wird als ADR dokumentiert. Ein ADR wird
dann erstellt, wenn eine Entscheidung langfristige Auswirkungen hat, schwer
rückgängig zu machen ist oder mehrere Bausteine der Architektur betrifft.

Kleinere Implementierungsdetails werden direkt im Code, in README-Dateien oder
in der jeweiligen Fachdokumentation beschrieben.