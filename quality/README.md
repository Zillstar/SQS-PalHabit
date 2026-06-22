# PalHabit Quality Hub

Der Quality Hub ist ein lokales, dockerisiertes Software-Qualitätssicherungs-Cockpit für die Abgabe.
Er startet zusammen mit der App und zeigt echte Prüfergebnisse aus Backend, Frontend, Security,
Architektur, Coverage und E2E.

## Start

```bash
docker compose --profile quality up --build
```

Danach sind erreichbar:

- App: `http://localhost:3000`
- Backend: `http://localhost:8181`
- Quality Hub: `http://localhost:8088`

Bei lokalen Port-Konflikten können die Host-Ports überschrieben werden, zum Beispiel:

```bash
FRONTEND_PORT=3001 docker compose --profile quality up --build
```

## Was passiert im Runner?

Der Runner kopiert das Repository in eine temporäre Arbeitskopie im Container und führt dort die
Checks aus. Der lokale Arbeitsbaum bleibt dadurch frei von Container-`node_modules`, Maven-Targets
und Coverage-Artefakten.

Pflichtchecks:

- `mvn verify` inklusive Unit-Tests, Integrationstests und JaCoCo-Report
- `mvn checkstyle:check`
- `mvn compile spotbugs:check`
- `npm run type-check`
- `npm test`
- `npm run test:coverage`
- `npm run lint`
- `npm run security:frontend`

Optional:

- `npm run test:e2e` gegen den Docker-Frontend-Service, wenn App und Backend erreichbar sind.
- Dabei wird `PLAYWRIGHT_FULLSTACK=1` gesetzt. So läuft zusätzlich ein Smoke-Test ohne `/api`-Mocking, der Registrierung, Session-Cookie, Nginx-Proxy, Backend und Persistenz nach Reload prüft.

Die Ergebnisse liegen im Docker-Volume `quality_output` und werden vom Hub unter `/reports/`
ausgeliefert.
