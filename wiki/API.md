# API

Das Backend stellt REST-Endpunkte unter `/api` bereit. Authentifizierung laeuft
ueber eine serverseitige Session mit `JSESSIONID`.

## Oeffentlicher Endpunkt

| Methode | Pfad | Zweck |
| --- | --- | --- |
| `GET` | `/api/tasks` | Oeffentliche Task-Liste laden |

Dieser Endpunkt ist der wichtigste API-Nachweis fuer die Praesentation: Er ist
ohne Login erreichbar und zeigt, dass das Backend eine oeffentliche REST-Ressource
bereitstellt.

## Auth

| Methode | Pfad | Zweck |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Nutzer registrieren und Session starten |
| `POST` | `/api/auth/login` | Nutzer anmelden |
| `POST` | `/api/auth/logout` | Session beenden |

## Geschuetzter Spielstand

| Methode | Pfad | Zweck |
| --- | --- | --- |
| `POST` | `/api/tasks/{id}/complete` | Task abschliessen |
| `GET` | `/api/user/game-state` | Spielstand laden |
| `POST` | `/api/user/water` | Wasserstand speichern |
| `POST` | `/api/user/feed` | Pal trainieren |
| `DELETE` | `/api/user/account` | Account loeschen |

Diese Endpunkte erwarten eine gueltige Session. Fehlende oder ungueltige
Sessions werden mit `401` beantwortet.

## Wetter

| Methode | Pfad | Zweck |
| --- | --- | --- |
| `GET` | `/api/weather/location?city=...` | Stadt in Koordinaten aufloesen |
| `GET` | `/api/weather/current?latitude=...&longitude=...&label=...` | Aktuelles Wetter laden |

Das Backend kapselt Open-Meteo, setzt kurze Timeouts und liefert ein fuer das
Frontend stabiles Wettermodell.

## Frontend-Anbindung

Angular-Komponenten rufen die API nicht direkt auf. Die Kapselung liegt in:

- `frontend/src/app/core/services/backend-api.service.ts`
- `frontend/src/app/core/services/app-state.service.ts`
- `frontend/src/app/core/services/weather.service.ts`

Ausfuehrliche API-Doku:

- `docs/03-api/auth.md`
- `docs/03-api/tasks.md`
- `docs/03-api/user-actions.md`
- `docs/03-api/user-game-state.md`
