# Testpyramide

Diese Seite ist Teil des übergeordneten Testkonzepts. Das vollständige Testkonzept befindet sich unter `04 Quality / Testkonzept`.

Die Testpyramide ist für PalHabit der zentrale SQS-Nachweis. Wir trennen die
Tests nach Zweck: viele schnelle Unit-Tests unten, weniger Integrations- und
Controller-Tests in der Mitte, wenige browserbasierte E2E-Flows oben. Ergänzt
wird das durch Architektur-, Security- und statische Analysechecks.

## Überblick

| Ebene                           | Ziel                                                                                                   | Beispiele im Projekt                                                                                                     | Ausführung                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Unit-Tests                      | Fachlogik schnell und isoliert prüfen                                                                  | `AuthenticationServiceTest`, `TaskServiceTest`, `UserServiceTest`, `tests/unit/frontend/*.test.ts`                       | `mvn test`, `npm test`                    |
| Controller-/Security-nahe Tests | HTTP-Status, Auth-Pflicht, Fehlerkörper und Session-Verhalten prüfen                                   | `TaskControllerTest`, `UserControllerTest`, `AuthenticationControllerUnitTest`                                           | `mvn test`                                |
| Integrationstests               | Spring-Kontext, Repositorys und echte Persistenzpfade mit H2 prüfen                                    | `AuthenticationControllerIntegrationTest`, `UserControllerIntegrationTest`, `AuthenticationControllerConcurrentSignUpIT` | `mvn verify` / Failsafe im Verify-Lauf    |
| Architekturtests                | Paketregeln und Schichtengrenzen prüfen                                                                | `ArchitectureTest` mit ArchUnit                                                                                          | `mvn test`                                |
| Externe-Service-Tests           | Externe API-Anbindungen ohne echtes Internet prüfen                                                    | `PalApiPalServiceTest`, `weather.service.test.ts`, `weather-appearance.logic.test.ts`                               | `mvn test`, `npm test`                    |
| Frontend-Supply-Chain-Security  | Lockfile und npm-Audit prüfen                                                                          | `npm-security.test.ts`, `npm audit`                                                                                      | `npm run security:frontend`               |
| E2E-Tests                       | sichtbare Nutzerflüsse im Browser prüfen; ein Docker-Smoke-Test prüft zusätzlich echte `/api`-Requests | `user-journey.spec.ts`, `starter-evolution.spec.ts`, `fullstack-smoke.spec.ts`                                           | `npm run test:e2e`, Docker-Quality-Runner |

## Warum diese Aufteilung?

Viele Fachregeln lassen sich ohne Browser und ohne Datenbank testen. Diese
Tests sind schnell und geben früh Feedback. HTTP-, Security- und
Integrationstests prüfen danach, ob die Regeln über die echten Endpunkte sauber
erreichbar sind. Playwright läuft bewusst nur für wenige wichtige Nutzerreisen,
weil Browsertests langsamer sind und mehr bewegliche Teile haben.

`SelfCareApplicationTests` ist der zentrale Spring-Boot-Smoke-Test fuer den
Anwendungskontext. Er prueft nicht nur, dass Spring startet, sondern auch, dass
zentrale Controller-, Service- und Repository-Beans vorhanden sind, das
`test`-Profil aktiv ist, die H2-In-Memory-Datenbank verwendet wird und der
zentrale `Clock`-Bean auf UTC laeuft.

## Abgedeckte Qualitätsfragen

| Frage aus SQS-Sicht                                    | Nachweis                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Funktioniert Login, Registrierung und Logout?          | `AuthenticationServiceTest`, `AuthenticationControllerUnitTest`, `AuthenticationControllerIntegrationTest`                                                                                                                                                                                                                                                                      |
| Wird Inaktivität fachlich wirksam?                     | `AuthenticationServiceTest` prüft Streak-Reset, Level-Abzug und Motivationsverlust nach ausgelassenem Tag.                                                                                                                                                                                                                                                                      |
| Sind geschützte Endpunkte wirklich geschützt?          | `UserControllerTest`, `TaskControllerTest`                                                                                                                                                                                                                                                                                                                                      |
| Gibt es einen öffentlichen Endpunkt?                   | `TaskControllerTest` prüft `GET /api/tasks`.                                                                                                                                                                                                                                                                                                                                    |
| Funktioniert Persistenz über mehrere Schichten?        | Spring-Boot-Integrationstests mit H2.                                                                                                                                                                                                                                                                                                                                           |
| Ist die externe Wetter-API nachvollziehbar angebunden? | `weather.service.test.ts` prüft Stadtauflösung, Refresh und lokale Aktualisierungszeit; `weather-appearance.logic.test.ts` prüft das Mapping von Open-Meteo-Wettercodes auf die UI-Szene.                                                                                                                                                                                       |
| Bleiben Controller von Repositorys getrennt?           | `ArchitectureTest` mit ArchUnit.                                                                                                                                                                                                                                                                                                                                                |
| Gibt es Coverage-Nachweise?                            | JaCoCo im Backend, Vitest Coverage im Frontend.                                                                                                                                                                                                                                                                                                                                 |
| Gibt es einen echten Browserflow?                      | Playwright prüft Login, Dashboard, Wasser, Quest, Level-Up-Test, Logout, Daily-Reset und Starter-Entwicklung. Die schnellen UI-Flows mocken die eigene API; `daily-reset.spec.ts` weist zurückgesetzte Buttons und die Anmelde-Serie nach. `fullstack-smoke.spec.ts` läuft im Docker-Quality-Runner ohne `/api`-Mocking gegen Frontend, Backend, Session-Cookie und Persistenz. |
| Werden Frontend-Abhängigkeiten geprüft?                | `npm run security:frontend` kombiniert Lockfile-Test und `npm audit`.                                                                                                                                                                                                                                                                                                           |

## Manueller Wetter-API-Nachweis

Der externe Wetter-Service ist automatisiert über `weather.service.test.ts`
und `weather-appearance.logic.test.ts` abgesichert. Zusätzlich gibt es einen
manuellen Curl-/JSON-Nachweis für die Open-Meteo-Anbindung:

- Doku: [weather-open-meteo-manual-check.md](weather-open-meteo-manual-check.md)
- Tool: `scripts/weather-curl-check.ps1`
- Temperaturfeld im JSON: `current.temperature_2m`
- Wettercode für die Szene: `current.weather_code`
- Tag/Nacht-Feld: `current.is_day`

## Lokale Java-Testumgebung

Das Projekt zielt auf Java 21. Lokale Backend-Tests sollten mit einem JDK
laufen, nicht mit einem reinen JRE, weil Mockito/Byte Buddy sonst keine
Test-Doubles erzeugen kann. Die Testkonfiguration unter
`backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`
setzt Mockito auf `mock-maker-subclass`, damit die Tests nicht vom
Inline-Mock-Agent eines lokalen JRE abhaengen.

Fuer lokale Java-25-Laeufe aktiviert das Maven-Profil
`java-25-local-test-compatibility` automatisch `net.bytebuddy.experimental=true`
und `jacoco.skip=true`. CI bleibt auf Java 21 ausgerichtet; dort bleibt JaCoCo
aktiv und liefert den Coverage-Nachweis.

## Quality Runner

Der Quality Runner führt die Pyramide nicht nur einzeln im Terminal aus, sondern
gesammelt.

Pflichtchecks im Runner:

- Backend-Unit- und Integrationstests mit JaCoCo
- Checkstyle
- SpotBugs
- Frontend-Typecheck
- Frontend-Unit-Tests
- Frontend-Coverage
- ESLint
- Frontend-Security-Check

Optionaler E2E-Check:

- Playwright-User-Flows gegen den Docker-App-Stack, wenn Frontend und Backend erreichbar sind.
- `fullstack-smoke.spec.ts` wird dabei mit `PLAYWRIGHT_FULLSTACK=1` aktiviert und prüft Registrierung, Session-Cookie, Nginx-Proxy `/api`, Backend und PostgreSQL-Persistenz nach Reload.

## Präsentationshinweis

In der Präsentation nicht jede Testdatei einzeln erklären. Besser:

1. Testpyramide zeigen.
2. Ein Beispiel pro Ebene nennen.
3. Kurz sagen, was das Gate rot machen würde: Tests, Security, Typecheck, Lint
   oder Backend-Analysefehler.
