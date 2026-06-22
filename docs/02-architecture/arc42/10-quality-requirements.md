# Qualitätsanforderungen

Dieses Kapitel beschreibt die wichtigsten Qualitätsanforderungen an PalHabit.
Die Anforderungen orientieren sich an den in der Vorlesung behandelten
Qualitätsmerkmalen nach ISO 25010 und werden durch konkrete Prüfszenarien,
Tests und Reports nachgewiesen.

## Qualitätsbaum

| Qualitätsmerkmal | Qualitätsziel                                                            | Umsetzung im Projekt                                                                                                                            | Nachweis                                                                    |
|------------------|--------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| Funktionalität   | Zentrale User-Flows funktionieren zuverlässig.                           | Registrierung, Login, Session-Restore, Tagesquests, Wassertracking, Pal-Fortschritt und Logout sind als fachliche Kernfunktionen umgesetzt. | Backend-Tests, Frontend-Tests und Playwright-E2E-Tests.                     |
| Security         | Private Endpunkte und Nutzerdaten sind geschützt.                        | Serverseitige Sessions, gehashte Passwörter, geschützte API-Endpunkte und Prüfung von npm-Abhängigkeiten.                                       | Security-Tests, Auth-Tests, npm audit, Lockfile-Check.                      |
| Wartbarkeit      | Code bleibt verständlich, änderbar und fachlich strukturiert.            | Feature-orientierte Packages, klare Trennung von Controller, Service, Repository, Angular-Komponenten und Services.                             | Checkstyle, SpotBugs, ESLint, ArchUnit.                                     |
| Testbarkeit      | Fachlogik ist isoliert und automatisiert prüfbar.                        | Dependency Injection, ausgelagerte Services, testbare reine Funktionen, Mocking externer Schnittstellen und H2-Testprofil.                      | Unit-Tests, Integrationstests, Coverage-Reports.                            |
| Portabilität     | Die Anwendung kann lokal reproduzierbar gestartet werden.                | Docker Compose startet Frontend, Backend, Datenbank und Quality-Umgebung.                                                                       | `docker compose up --build`, `docker compose --profile quality up --build`. |
| Usability        | Nutzer können die Kernfunktionen ohne technische Vorkenntnisse bedienen. | Einfache Aufgabenverwaltung, sichtbares Feedback, verständliche Fehlermeldungen und klare Dashboard-Struktur.                                   | Frontend-Tests, Playwright-Flows, manuelle Abnahme.                         |
| Zuverlässigkeit  | Externe API-Ausfälle blockieren die Kernfunktionen nicht.                | PalAPI-Fallback, Wetter-Fallback, Timeouts und defensiver Umgang mit externen Diensten.                                                        | Tests für PalAPI-Ausfall, Fallback-Tests, dokumentierte Fehlerbehandlung.  |

## Qualitätsziele mit Priorität

| Priorität | Qualitätsziel                                                       | Begründung                                                                                                                      |
|-----------|---------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Hoch      | Zentrale User-Flows müssen funktionieren.                           | Ohne Registrierung, Login, Quests, Wassertracking und Pal-Fortschritt ist die Anwendung fachlich nicht nutzbar.             |
| Hoch      | Geschützte Daten dürfen nur für angemeldete Nutzer erreichbar sein. | Die Anwendung arbeitet mit nutzerbezogenen Fortschrittsdaten und benötigt deshalb Zugriffsschutz.                               |
| Hoch      | Tests und Quality Gate müssen reproduzierbar laufen.                | Für die Abgabe muss nachvollziehbar sein, dass Qualitätssicherung nicht nur beschrieben, sondern automatisiert ausgeführt wird. |
| Mittel    | Externe Dienste dürfen die App nicht unbenutzbar machen.            | PalAPI und Wetterdaten verbessern die Anwendung, dürfen aber keine harte Voraussetzung für die Kernfunktionen sein.            |
| Mittel    | Code muss wartbar und verständlich bleiben.                         | Die Anwendung wurde im Team entwickelt und soll auch nach Änderungen nachvollziehbar bleiben.                                   |
| Mittel    | Die App muss lokal ohne Spezialsetup startbar sein.                 | Docker Compose reduziert Installationsaufwand und macht die Abgabe reproduzierbar.                                              |

## Qualitätsszenarien

| Szenario                                                           | Qualitätsmerkmal            | Erwartetes Ergebnis                                                                      | Nachweis                                     |
|--------------------------------------------------------------------|-----------------------------|------------------------------------------------------------------------------------------|----------------------------------------------|
| Ein neuer Nutzer registriert sich und meldet sich danach an.       | Funktionalität              | Nutzerkonto wird erstellt, Login funktioniert und Dashboard wird geladen.                | Backend-/Frontend-Tests, Playwright.         |
| Ein nicht angemeldeter Nutzer ruft einen geschützten Endpunkt auf. | Security                    | Der Zugriff wird abgelehnt.                                                              | Auth-/Security-Tests.                        |
| Ein angemeldeter Nutzer erledigt eine Tagesquest.                  | Funktionalität              | Quest wird als erledigt gespeichert und Fortschritt wird aktualisiert.                   | Service-Tests, API-Tests, E2E-Test.          |
| Ein Nutzer trägt Wasser ein.                                       | Funktionalität / Usability  | Wasserstand wird sichtbar aktualisiert und fachlich korrekt gespeichert.                 | Frontend-Tests, Backend-Tests.               |
| PalAPI ist beim Registrieren nicht erreichbar.                    | Zuverlässigkeit             | Registrierung funktioniert trotzdem mit lokalem Starter-Katalog.                         | Fallback-Test.                               |
| Wetterdaten können nicht geladen werden.                           | Zuverlässigkeit / Usability | Dashboard bleibt nutzbar und zeigt keinen technischen Fehlerzustand.                     | Frontend-Test, manuelle Prüfung.             |
| Ein Entwickler ändert Backend-Code fehlerhaft.                     | Wartbarkeit / Testbarkeit   | Tests oder statische Analyse schlagen fehl.                                              | GitHub Actions, Quality Runner, Quality Hub. |
| Coverage fällt unter den Grenzwert.                                | Testbarkeit                 | Das Quality Gate schlägt fehl und zeigt den Fehler im Hub.                               | JaCoCo-/Vitest-Coverage, Gate-Score.         |
| Eine unsichere npm-Abhängigkeit wird erkannt.                      | Security                    | Der Security-Check schlägt fehl, bis Lockfile oder Dependency-Tree bereinigt sind.       | `npm audit`, Lockfile-Test.                  |
| Die Anwendung wird auf einem anderen Rechner gestartet.            | Portabilität                | Docker Compose startet Frontend, Backend und Datenbank ohne manuelle Einzelinstallation. | Docker-Compose-Start.                        |

## Messbare Qualitätskriterien

| Kriterium         | Zielwert / Erwartung                                                 |
|-------------------|----------------------------------------------------------------------|
| Backend-Coverage  | Mindestens 80 %, gemessen mit JaCoCo.                                |
| Frontend-Coverage | Mindestens 80 %, gemessen mit Vitest Coverage.                       |
| Backend-Tests     | Müssen vollständig grün sein.                                        |
| Frontend-Tests    | Müssen vollständig grün sein.                                        |
| Playwright-E2E    | Zentrale User-Flows müssen erfolgreich durchlaufen.                  |
| Checkstyle        | Keine blockierenden Regelverletzungen.                               |
| SpotBugs          | Keine blockierenden Findings.                                        |
| ESLint            | Keine blockierenden Lint-Fehler.                                     |
| ArchUnit          | Architekturregeln müssen eingehalten werden.                         |
| npm Security      | Keine blockierenden npm-Audit-Funde im definierten Prüfprofil.       |
| Docker-Start      | `docker compose up --build` muss reproduzierbar funktionieren.       |
| Quality-Profil    | `docker compose --profile quality up --build` muss Reports erzeugen. |

## Aktuelle Nachweise

Die Qualitätsanforderungen werden nicht nur beschrieben, sondern durch konkrete
Artefakte im Projekt belegt:

- JaCoCo-Report für Backend-Coverage
- Vitest-Coverage-Report für Frontend-Coverage
- Playwright-HTML-Report für E2E-Tests
- Logs für jeden Quality-Gate-Schritt
- Checkstyle-, SpotBugs-, ESLint- und ArchUnit-Ergebnisse
- npm-audit- und Lockfile-Prüfung
- Gate-Score mit Pflichtcheck-Zusammenfassung im Quality Hub

Der Quality Hub bündelt diese Nachweise lokal und macht sichtbar, ob die
definierten Qualitätsanforderungen aktuell erfüllt werden.

## Weiterführende Qualitätsnachweise

Neben den zusammengefassten Qualitätsanforderungen in diesem Kapitel liegen
detaillierte Nachweise und Konzepte im Ordner `docs/04-quality/`.

| Dokument                                                                                     | Inhalt                                                                                                  |
|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| [`test-concept.md`](../../04-quality/test-concept.md)                                        | Beschreibt das übergreifende Testkonzept, die eingesetzten Testarten und deren Grenzen.                 |
| [`test-pyramid.md`](../../04-quality/test-pyramid.md)                                        | Ordnet Unit-, Integrations-, Frontend- und E2E-Tests in die Testpyramide ein.                           |
| [`gqm.md`](../../04-quality/gqm.md)                                                          | Beschreibt das Software-Qualitätsmanagement und die organisatorische Qualitätssicherung.                |
| [`metrics-and-static-analysis.md`](../../04-quality/metrics-and-static-analysis.md)          | Dokumentiert Metriken, Coverage, Checkstyle, SpotBugs, ESLint und weitere statische Analysen.           |
| [`security-hotspots.md`](../../04-quality/security-hotspots.md)                              | Beschreibt sicherheitsrelevante Stellen wie Authentifizierung, geschützte Endpunkte und sensible Daten. |
| [`frontend-npm-security.md`](../../04-quality/frontend-npm-security.md)                      | Dokumentiert npm-audit, Lockfile-Prüfung und Risiken aus Frontend-Abhängigkeiten.                       |
| [`docker-deployment.md`](../../04-quality/docker-deployment.md)                              | Beschreibt den reproduzierbaren Start und die Qualitätsprüfung über Docker.                             |
| [`quality-costs.md`](../../04-quality/quality-costs.md)                                      | Bewertet Aufwand und Nutzen der Qualitätssicherungsmaßnahmen.                                           |
| [`daily-reset-testfälle.md`](../../04-quality/daily-reset-testfälle.md)                      | Dokumentiert Testfälle rund um den täglichen Reset der Aufgaben.                                        |
| [`crypto-random-ids.md`](../../04-quality/crypto-random-ids.md)                              | Beschreibt den Umgang mit zufälligen beziehungsweise sicheren IDs.                                      |
| [`weather-open-meteo-manual-check.md`](../../04-quality/weather-open-meteo-manual-check.md)  | Dokumentiert die manuelle Prüfung der Wetterintegration.                                                |
| [`wetter-daten.md`](../../04-quality/wetter-daten.md)                                        | Beschreibt Daten und Verhalten der Wetterintegration.                                                   |
| [`iso-25010.md`](../../04-quality/iso-25010.md)                                              | Ordnet die Projektqualität den ISO-25010-Qualitätsmerkmalen zu.                                         |