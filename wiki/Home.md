# PalHabit Wiki

PalHabit ist die SQS-Semesterarbeit als gamifizierte Self-Care-Web-App. Der
Stack besteht aus Angular, Spring Boot, PostgreSQL, Docker Compose und einem
lokalen Quality Hub fuer die Abgabe-Nachweise.

Dieses Wiki ist der schnelle Einstieg fuer Review, Abgabe und Praesentation. Die
ausfuehrliche technische Dokumentation liegt parallel unter `docs/` und wird mit
MkDocs/ReadTheDocs gebaut.

## Schnellstart

App, Backend und Datenbank:

```bash
docker compose up --build
```

App plus Quality Hub:

```bash
docker compose --profile quality up --build
```

| Dienst | URL | Zweck |
| --- | --- | --- |
| App | `http://localhost:3000` | Benutzeroberflaeche |
| Backend | `http://localhost:8181` | REST API |
| Quality Hub | `http://localhost:8088` | Tests, Coverage, Security und E2E |

Demo-Login:

```text
demo / password123
```

## Wichtig fuer die Bewertung

- Dreischichtige Web-App: Frontend, Backend und Persistenz.
- Oeffentlicher Endpunkt: `GET /api/tasks`.
- Geschuetzte Nutzer-Endpunkte mit serverseitiger Session.
- Externe Integrationen: PalAPI und Open-Meteo.
- Nachweise: Unit-, Controller-, Integrations-, Architektur-, Security- und
  E2E-Tests.
- Quality Hub als sichtbares SQS-Dashboard.
- arc42, ADRs und C4-Diagramme unter `docs/`.

## Einstiegspunkte

| Thema | Wiki-Seite | Ausfuehrliche Doku |
| --- | --- | --- |
| Architektur | [Architektur](Architektur) | `docs/02-architecture/` |
| API | [API](API) | `docs/03-api/` |
| Frontend | [Frontend](Frontend) | `frontend/README.md` |
| Teststrategie | [Teststrategie](Teststrategie) | `docs/04-quality/` |
| Quality Hub | [Quality Hub](Quality-Hub) | `quality/README.md` |
| Abgabe | [Abgabe-Checkliste](Abgabe-Checkliste) | `docs/05-presentation/` |
| ReadTheDocs | [ReadTheDocs](ReadTheDocs) | `docs/06-operations/` |
