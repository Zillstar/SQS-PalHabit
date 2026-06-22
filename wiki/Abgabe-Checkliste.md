# Abgabe-Checkliste

## Fertig

- Web-App mit Frontend, Backend und Persistenz.
- Docker-Start fuer App, Backend, Datenbank und Quality Hub.
- Demo-Login: `demo / password123`.
- Oeffentlicher Endpunkt: `GET /api/tasks`.
- Geschuetzte Endpunkte mit Session-Cookie.
- PalAPI-Anbindung im Backend mit Fallback.
- Open-Meteo-Anbindung fuer Wetterdaten.
- Tests fuer Backend, Frontend, Security, Architektur und E2E.
- Quality Hub fuer sichtbare Abgabe-Nachweise.
- arc42-Doku, ADRs und C4-Diagramme.
- Praesentationsplan und Sprechzettel.

## Vor der Demo pruefen

1. `docker compose --profile quality up --build` startet sauber.
2. App ist unter `http://localhost:3000` erreichbar.
3. Login mit `demo / password123` funktioniert.
4. `GET http://localhost:8181/api/tasks` liefert JSON.
5. Quality Hub ist unter `http://localhost:8088` erreichbar.
6. README, Wiki und `docs/` zeigen auf denselben Stand.

## Demo-Reihenfolge

1. App mit Quality Hub starten.
2. Login mit `demo / password123`.
3. Quest abschliessen.
4. Wasser speichern.
5. Pal trainieren.
6. Wetter-Stadt laden.
7. Quality Hub zeigen.
8. C4, Testpyramide und API-Doku zeigen.

## Nicht mehr anfangen

- Kein neues Auth-System.
- Kein komplettes UI-Redesign.
- Kein grosser Datenmodell-Umbau.
- Keine grossen neuen Features kurz vor der Abgabe.
