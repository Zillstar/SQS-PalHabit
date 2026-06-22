# PalHabit Dokumentation

PalHabit ist die SQS-Semesterarbeit als Web-App mit Angular-Frontend,
Spring-Boot-Backend, PostgreSQL und lokalem Quality Hub. Diese Dokumentation ist
kapitelweise geordnet, damit Abgabe, Review und Präsentation schnell prüfbar
bleiben.


## Inhaltsverzeichnis

| Kapitel                                                 | Inhalt                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| [02 Architektur](02-architecture/arc42/README.md)       | arc42, C4-Diagramme, englische ADRs und deutsche ADR-Kopien         |
| [03 API](03-api/auth.md)                                | Authentifizierung, Tasks, User Actions, Game State und API-Handover |
| [04 Qualität](04-quality/test-pyramid.md)               | Testpyramide, Quality Hub, Coverage und Frontend-npm-Security       |
| [05 Präsentation](05-presentation/presentation-plan.md) | Ablaufplan und Sprechzettel für die Demo                            |
| [06 Betrieb](06-operations/readthedocs-publish.md)      | ReadTheDocs-Veröffentlichung und operative Hinweise                 |

## Schnellstart

Die Anwendung kann entweder als App-Stack oder mit zusätzlichem Quality Hub gestartet werden.

App und Datenbank:

```bash
docker compose up --build
```

App, Datenbank und Quality Hub:

```bash
docker compose --profile quality up --build
```

Standard-URLs:

| Dienst      | URL                     |
| ----------- | ----------------------- |
| Frontend    | `http://localhost:3000` |
| Backend     | `http://localhost:8181` |
| Quality Hub | `http://localhost:8088` |

---

## Technologie-Stack

| Ebene              | Technologie                                                |
|--------------------|------------------------------------------------------------|
| Backend            | Java 21, Spring Boot 3.2, Spring Data JPA                  |
| Authentifizierung  | Passwort-Hashing mit Spring Security Crypto                |
| Datenbank          | PostgreSQL 16 (H2 In-Memory-Datenbank für Tests)           |
| Externer Dienst    | Open-Meteo API für Wetterdaten                             |
| Frontend           | TypeScript, Angular 21                                     |
| Unit-Tests         | JUnit 5 + Mockito (Backend), Vitest (Frontend)             |
| Integrationstests  | Spring Boot Test, H2, WireMock                             |
| Architekturtests   | ArchUnit                                                   |
| E2E-Tests          | Playwright                                                 |
| Codequalität       | JaCoCo, Checkstyle, SpotBugs, ESLint, Prettier, SonarQube  |
| CI/CD              | GitHub Actions                                             |
| Betrieb            | Docker Compose                                             |

---

## Wichtige Nachweise

| Bereich                   | Dokumentation                                                                                                 |
| ------------------------- |---------------------------------------------------------------------------------------------------------------|
| API-Verträge              | `03-api/`                                                                                                     |
| Architektur               | `02-architecture/arc42/`                                                                                      |
| Architekturentscheidungen | `adr/` und `ger-adr/`                                                                                         |
| C4-Modell                 | `02-architecture/diagrams/c4-diagram-description.md` und `02-architecture/diagrams/structurizr/workspace.dsl` |
| Qualitätssicherung        | `04-quality/`, Quality Hub, JaCoCo, Vitest Coverage, Checkstyle, SpotBugs, ESLint, npm Audit, Playwright, H2  |
| Präsentation              | `05-presentation/`                                                                                            |

## Abgabe-relevante Punkte

- Öffentlicher Endpunkt: `GET /api/tasks`.
- Geschützte Endpunkte: User-Game-State, Wassertracking, Logout und Account-Löschung.
- Drei Schichten: Frontend, Backend, Persistenz.
- Externe API: Open-Meteo über `WeatherService` und `BackendWeatherAdapter`
  für Geocoding, aktuelle Wetterdaten und die Dashboard-Wetter-Szene.
- Testpyramide: Unit-, Integrations-, Architektur-, Security- und E2E-Tests.
- Docker-Start mit maximal zwei Befehlen; für die Demo reicht der Quality-Profile-Start.

## ReadTheDocs

Das Repository enthält die ReadTheDocs-Konfiguration:

- `.readthedocs.yaml`
- `mkdocs.yml`
- `docs/requirements.txt`

Nach dem Verbinden des öffentlichen Repositorys mit ReadTheDocs wurde die
Dokumentation direkt aus dem `docs/`-Ordner gebaut.
Die konkreten Schritte stehen in [ReadTheDocs](06-operations/readthedocs-publish.md).

Die öffentliche Dokumentation ist unter folgender URL erreichbar:

[https://luinarasqs-semesterarbeit.readthedocs.io/de/latest/](https://luinarasqs-semesterarbeit.readthedocs.io/de/latest/)
