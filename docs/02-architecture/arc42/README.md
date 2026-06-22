# arc42-Dokumentation

Die veröffentlichte Dokumentation ist unter
[luinarasqs-semesterarbeit.readthedocs.io](https://luinarasqs-semesterarbeit.readthedocs.io/de/latest/)
abrufbar.

Dieser Ordner enthält die Architektur-Dokumentation für PalHabit. Die Struktur
folgt arc42, die Inhalte sind aber auf den aktuellen Abgabestand zugeschnitten:
Angular-Frontend, Spring-Boot-Backend, PostgreSQL, externe Dienste und Quality
Hub.

| Abschnitt | Datei                                                            | Inhalt                                          |
| --------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| 01        | [01-introduction-and-goals.md](01-introduction-and-goals.md)     | Ziele, Qualitätsziele und Stakeholder           |
| 02        | [02-constraints.md](02-constraints.md)                           | Technische und organisatorische Randbedingungen |
| 03        | [03-context-and-scope.md](03-context-and-scope.md)               | Kontext, Schnittstellen und Abgrenzung          |
| 04        | [04-solution-strategy.md](04-solution-strategy.md)               | Lösungsstrategie                                |
| 05        | [05-building-block-view.md](05-building-block-view.md)           | Bausteinsicht                                   |
| 06        | [06-runtime-view.md](06-runtime-view.md)                         | Laufzeitsicht                                   |
| 07        | [07-deployment-view.md](07-deployment-view.md)                   | Docker-Deployment                               |
| 08        | [08-crosscutting-concepts.md](08-crosscutting-concepts.md)       | Querschnittliche Konzepte                       |
| 09        | [09-architecture-decisions.md](09-architecture-decisions.md)     | Architekturentscheidungen                       |
| 10        | [10-quality-requirements.md](10-quality-requirements.md)         | Qualitätsanforderungen                          |
| 11        | [11-risks-and-technical-debt.md](11-risks-and-technical-debt.md) | Risiken und technische Schulden                 |
| 12        | [12-glossary.md](12-glossary.md)                                 | Begriffe                                        |

## Zusätzliche Sichten

| Sicht                | Datei                                                                    | Inhalt                                                                             |
| -------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Frontend-Komponenten | [frontend-component-architecture.md](frontend-component-architecture.md) | Angular-Struktur, Datenfluss und Komponentenkommunikation                          |
| Backend-Komponenten  | [backend-component-architecture.md](backend-component-architecture.md)   | Spring-Boot-Struktur, Controller, Services, Repositories, DTOs und externe Clients |
| Datenbankarchitektur | [database-architecture.md](database-architecture.md)                     | Persistenzstruktur, Tabellen, Beziehungen, Docker-Datenbank und Testdatenbank      |

## Abgedeckte Architektursichten

| Sicht aus der Vorlesung | Umsetzung in der Dokumentation | Inhalt im Projekt |
| --- | --- | --- |
| Kontextsicht | [03-context-and-scope.md](03-context-and-scope.md) | Nutzer, Angular-Frontend, Spring-Boot-Backend, PostgreSQL, PalAPI und Open-Meteo als externe Systeme |
| Bausteinsicht | [05-building-block-view.md](05-building-block-view.md) | Frontend, Backend-API, Datenbank, externe Dienste und Quality Hub als zentrale Bausteine |
| Laufzeitsicht | [06-runtime-view.md](06-runtime-view.md) | Login-Flow, Registrierung, Task-Erledigung, Wassertracking, Pal-Fortschritt und Fallback-Verhalten |
| Verteilungssicht | [07-deployment-view.md](07-deployment-view.md) | Docker Compose mit Frontend, Backend, PostgreSQL und optionalem Quality Hub |
| Implementierungssicht | [backend-component-architecture.md](backend-component-architecture.md) und [frontend-component-architecture.md](frontend-component-architecture.md) | Package-/Komponentenstruktur, Controller, Services, Repositories, DTOs, externe Clients, Angular-Komponenten und Services |
| Persistenzsicht | [database-architecture.md](database-architecture.md) | Tabellen, Beziehungen, PostgreSQL-Docker-Setup, H2-Testdatenbank und Datenfluss |