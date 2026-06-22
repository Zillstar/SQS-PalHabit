# Quality Hub

Der Quality Hub ist das sichtbare SQS-Dashboard fuer die Abgabe. Er startet per
Docker Compose und zeigt echte Ergebnisse aus Backend, Frontend, Security,
Architektur, Coverage und E2E.

## Start

```bash
docker compose --profile quality up --build
```

Danach:

| Dienst | URL |
| --- | --- |
| App | `http://localhost:3000` |
| Backend | `http://localhost:8181` |
| Quality Hub | `http://localhost:8088` |

## Checks im Runner

- `mvn verify`
- `mvn checkstyle:check`
- `mvn compile spotbugs:check`
- `npm run type-check`
- `npm test`
- `npm run test:coverage`
- `npm run lint`
- `npm run format:check`
- `npm run security:frontend`
- optional `npm run test:e2e`

## Nachweise

Der Hub sammelt Logs, Coverage-Reports und Playwright-Nachweise im Docker-Volume
`quality_output`. Die Daten werden im Browser unter `/reports/` eingebunden.

Der Quality Hub ersetzt keine CI-Plattform, ist aber fuer die Semesterarbeit ein
sehr guter sichtbarer Nachweis, weil Pruefer die Qualitaetschecks lokal
nachvollziehen koennen.

Ausfuehrliche Doku: `quality/README.md` und `docs/04-quality/`.
