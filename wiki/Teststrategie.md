# Teststrategie

Die Teststrategie folgt einer Testpyramide: viele schnelle Unit-Tests, mehrere
Controller- und Integrationstests, wenige browserbasierte E2E-Flows.

## Ebenen

| Ebene | Beispiele | Ausfuehrung |
| --- | --- | --- |
| Unit-Tests | Services, Fachlogik, Mapping, Mock-Daten | `mvn test`, `npm test` |
| Controller-Tests | Statuscodes, Auth-Pflicht, Fehlerkoerper | `mvn test` |
| Integrationstests | Spring-Kontext, Session-Flows, Persistenz | `mvn verify` |
| Architekturtests | Schichtengrenzen mit ArchUnit | `mvn test` |
| Security | npm-Lockfile-Guardrails, `npm audit` | `npm run security:frontend` |
| E2E | Login, Dashboard, Wasser, Quest, Training, Logout | `npm run test:e2e` |

## Wichtige Orte

- `backend/src/test/java/`
- `tests/unit/frontend/`
- `tests/e2e/`
- `frontend/vitest.config.ts`
- `frontend/playwright.config.ts`
- `docs/04-quality/test-pyramid.md`
- `docs/04-quality/frontend-npm-security.md`
- `docs/04-quality/daily-reset-testfaelle.md`

## Lokale Java-Hinweise

- Backend-Tests mit JDK ausfuehren, nicht mit reinem JRE.
- Die CI nutzt Java 21 mit JaCoCo-Coverage.
- Fuer lokale Java-25-Setups aktiviert Maven ein Kompatibilitaetsprofil.
- SpotBugs sollte fuer eine echte lokale Pruefung mit Java 21 laufen.

## Wetter-Nachweis

Die Wetter-Szene wird automatisiert getestet. Fuer den manuellen Nachweis gibt
es:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\weather-curl-check.ps1 -City "Hawaii" -RawJson
```

Die passende Doku liegt unter:

```text
docs/04-quality/weather-open-meteo-manual-check.md
```
