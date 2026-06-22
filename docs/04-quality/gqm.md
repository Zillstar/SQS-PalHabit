# Qualitätsmodell nach GQM

PalHabit ist keine Banking-Anwendung und kein sicherheitskritisches
Medizinsystem, sondern eine Self-Care- und Habit-Tracking-App mit
Gamification. Deshalb liegt der Qualitätsschwerpunkt nicht nur auf technischer
Korrektheit, sondern auch auf zuverlässigen Nutzerflüssen, geschützten
Nutzerdaten, wartbarer Architektur und reproduzierbarem Betrieb.

Wir verwenden GQM, um die Qualitätsziele des Projekts explizit mit konkreten
Fragen und messbaren Nachweisen zu verbinden.

| Goal                                                                                                        | Question                                                                                                                         | Metric / Zielwert / Nachweis                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Analysiere die Backend-API zum Zweck der Zuverlässigkeit aus Sicht der Nutzer im Kontext der Self-Care-App. | Funktionieren Registrierung, Login, Logout, Tasks, Wassertracking und Pal-Fortschritt stabil?                                | Backend-Unit-, Controller- und Integrationstests grün; zentrale API-Flows durch `AuthenticationControllerIntegrationTest`, `TaskControllerTest`, `UserControllerTest` und Game-State-Tests abgedeckt; Backend-Coverage mindestens 80 %. |
| Analysiere die UI zum Zweck der Benutzbarkeit aus Sicht der Nutzer.                                         | Kann ein Nutzer ohne manuelle Anleitung zentrale Aktionen ausführen?                                                             | Playwright-E2E-Flows für Registrierung/Login, Dashboard, Wasser, Quest, Level-Up, Logout, Daily Reset und Starter-Entwicklung grün; Vitest-Frontend-Tests grün; Frontend-Coverage mindestens 80 %.                                      |
| Analysiere die Architektur zum Zweck der Wartbarkeit aus Sicht der Entwickler.                              | Bleiben Controller, Services, Repositories und Domänenlogik sauber getrennt?                                                     | ArchUnit-Regeln zu Schichten und Abhängigkeiten 100 % grün; keine bewussten Architekturverletzungen; auffällige Komplexitäts-Hotspots werden dokumentiert oder refaktoriert.                                                            |
| Analysiere den Code zum Zweck der Wartbarkeit aus Sicht der Entwickler.                                     | Bleibt der Code verständlich, erweiterbar und frei von unnötiger Duplikation?                                                    | Statische Analyse und Linting grün; Code Smells möglichst niedrig; keine kritischen Befunde; Duplicate Lines unter 3–5 %.                                                                                                               |
| Analysiere die Security zum Zweck der Vertraulichkeit aus Sicht der Nutzer.                                 | Sind private User-, Task- und Fortschrittsdaten geschützt?                                                                       | Geschützte Endpoints liefern ohne gültige Session 401/403; Security-nahe Controller-Tests grün; Dependency-Scans mit 0 kritischen und 0 hohen Vulnerabilities; Frontend-Abhängigkeiten werden per `npm audit` geprüft.                  |
| Analysiere externe Abhängigkeiten zum Zweck der Robustheit aus Sicht der Nutzer.                            | Funktioniert die App nachvollziehbar, auch wenn externe APIs nicht erreichbar sind oder im Test nicht direkt kontaktiert werden? | PalAPI- und Wetter-Service-Tests verwenden kontrollierte Testdaten bzw. Mock-Server; Fallback-Verhalten ist getestet; manueller Wetter-API-Nachweis dokumentiert echte Open-Meteo-Felder.                                              |
| Analysiere das Deployment zum Zweck der Portabilität aus Sicht des Dozenten.                                | Läuft das Projekt auf einem fremden Rechner reproduzierbar?                                                                      | Frischer Clone, Setup-Skript, Docker Compose und Quality Hub ausführbar; Quality Runner sammelt Backend-, Frontend-, Security-, Lint- und Coverage-Nachweise.                                                                           |
| Analysiere die CI/CD-Pipeline zum Zweck der Prozessqualität aus Sicht des Teams.                            | Werden Qualitätsprobleme automatisch erkannt, bevor sie in den main-Branch gelangen?                                             | GitHub-Actions-Pipeline auf dem main-Branch grün; Tests, Linting, Security-Checks und Coverage laufen automatisiert; fehlerhafte Qualitätschecks blockieren die Auslieferung.                                                           |

## Qualitätsmetriken und Akzeptanzkriterien

Aus den GQM-Zielen werden konkrete Qualitätsmetriken abgeleitet. Diese Metriken dienen als Akzeptanzkriterien für die Bewertung des Projekts und werden über lokale Testläufe, GitHub Actions und den Docker-Quality-Hub nachvollziehbar gemacht.

| Qualitätsziel       | Metrik                | Zielwert / Akzeptanzkriterium                             | Nachweis                                |
| ------------------- | --------------------- | --------------------------------------------------------- | --------------------------------------- |
| Testbarkeit         | Test Coverage         | mindestens 80 %                                           | JaCoCo / Vitest Coverage Report         |
| Zuverlässigkeit     | Testergebnis          | alle Unit-, Controller-, Integrations- und E2E-Tests grün | JUnit, Vitest, Playwright               |
| Sicherheit          | Vulnerabilities       | 0 kritische, 0 hohe Befunde                               | Dependency-Check / npm audit / Trivy    |
| Zugriffsschutz      | Security-Testfälle    | geschützte Endpunkte ohne Session nicht erreichbar        | Controller- und Security-Tests          |
| Wartbarkeit         | Code Smells           | möglichst niedrig, keine kritischen Befunde               | SonarQube / statische Analyse / Linting |
| Duplikation         | Duplicated Lines      | unter 3–5 %                                               | SonarQube / statische Analyse           |
| Komplexität         | Cyclomatic Complexity | keine auffälligen Hotspots                                | SonarQube / Code Review                 |
| Architekturqualität | ArchUnit-Regeln       | 100 % grün                                                | ArchUnit-Testreport                     |
| CI-Stabilität       | Pipeline-Status       | main-Branch grün                                          | GitHub Actions                          |
| Portabilität        | Docker-Ausführbarkeit | Start und Quality-Hub reproduzierbar                      | Docker Compose / Quality Runner         |


## Verbindung zur Testpyramide

Das GQM-Modell definiert, welche Qualitätsfragen für PalHabit relevant sind.
Die Testpyramide beschreibt anschließend, mit welchen Testarten diese Fragen
praktisch geprüft werden. Damit ist die Testpyramide kein Selbstzweck, sondern
die konkrete Umsetzung der zuvor definierten Qualitätsziele.

Die vielen schnellen Unit- und Komponententests bilden die Basis der Testpyramide.
Darauf aufbauend prüfen Integrations- und Controller-Tests das Zusammenspiel von
Backend, Persistenz und Security-Konfiguration. Die Spitze der Pyramide bilden
Playwright-E2E-Tests, die ausgewählte kritische Nutzerflüsse aus Sicht echter
Nutzer absichern. Die Ergebnisse der Testpyramide fließen direkt in die oben
definierten Metriken und Akzeptanzkriterien ein.
