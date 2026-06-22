# Architektur

PalHabit besteht aus Angular-Frontend, Spring-Boot-Backend und PostgreSQL. Die
Architektur ist nach arc42 dokumentiert und wird durch Diagramme, ADRs und
Architekturtests ergaenzt.

## Bausteine

| Bereich | Aufgabe |
| --- | --- |
| Frontend | UI, App-State, Wetter-Szene, API-Mapping |
| Backend | Auth, Sessions, Tasks, Spielstand, Pal-Daten, Wetter-Adapter |
| Datenbank | Nutzer, Tasks, User-Tasks, Pal und Spielstand |
| Externe APIs | PalAPI fuer Pal-Daten, Open-Meteo fuer Wetter |
| Quality Hub | Sichtbare Qualitaetsnachweise fuer Tests, Coverage und Security |

## Laufzeitfluss

1. Nutzer registriert sich oder loggt sich ein.
2. Backend setzt eine serverseitige Session.
3. Frontend laedt Tasks und Game-State ueber `/api`.
4. Nutzer erledigt Quests, speichert Wasser und trainiert das Pal.
5. Backend persistiert Fortschritt und gibt den aktualisierten Game-State zurueck.
6. Wetterdaten werden ueber das Backend aus Open-Meteo geladen.

## Architekturregeln

- Controller behandeln HTTP und Statuscodes.
- Services enthalten Fachlogik.
- Repositories kapseln Datenzugriff.
- DTOs halten API-Antworten stabil.
- ArchUnit prueft zentrale Schichtengrenzen.

## Wichtige Dokumente

- `docs/02-architecture/arc42/README.md`
- `docs/02-architecture/arc42/05-building-block-view.md`
- `docs/02-architecture/arc42/06-runtime-view.md`
- `docs/02-architecture/arc42/07-deployment-view.md`
- `docs/02-architecture/diagrams/`
- `docs/adr/`
- `docs/ger-adr/`
