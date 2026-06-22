# Einführung und Ziele

PalHabit ist unsere Web-App für die SQS-Semesterarbeit. Nutzer melden sich an,
erledigen Tagesquests, trinken Wasser und sammeln Quest-Punkte für ein
Pal-basiertes Begleittier. 

Die App besteht aus einem Angular-Frontend, einem Spring-Boot-Backend und einer
PostgreSQL-Datenbank. Ergänzend dazu gibt es einen Docker-Quality-Hub, über den
die Qualitätssicherung reproduzierbar ausgeführt und sichtbar gemacht wird.

Für die Abgabe ist nicht nur die App selbst wichtig. Wir zeigen auch, dass die
Qualitätssicherung wirklich ausgeführt wird: Backend-Tests, Frontend-Tests,
Coverage, statische Analyse, Security-Checks und Playwright-E2E laufen über den
Docker-Quality-Hub und sind dort als Report sichtbar.

## Fachlicher Überblick

- Nutzer können sich registrieren und anmelden.
- Tagesquests und Wassertracking verändern den Spielstand.
- Quest-Punkte und Wasser steigern Wachstum und Pal-Fortschritt.
- Das Backend nutzt PalAPI für Starter-Pal und fällt bei Problemen auf
  lokale Daten zurück.
- Das Frontend nutzt Wetterdaten für die Szene im Dashboard.
- Demo- und Quality-Start laufen reproduzierbar über Docker Compose.

## Qualitätsziele

| Priorität | Ziel                         | Nachweis                                                                                       |
|-----------| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| 1         | Reproduzierbarer Start       | `docker compose up --build` startet App, Backend und Datenbank.                                |
| 2         | Sichtbare Qualitätssicherung | `docker compose --profile quality up --build` startet den Quality Hub mit Logs und Reports.    |
| 3         | Testpyramide                 | Unit-, Integrations-, Architektur-, Security- und E2E-Tests sind dokumentiert und ausführbar.  |
| 4         | Stabile Demo                 | Demo-User, Starterdaten, Questfluss und E2E-Nutzerreise sind für die Präsentation abgesichert. |
| 5         | Klare Architektur            | Frontend, Backend, Datenbank und Quality Hub sind getrennt beschrieben und nachvollziehbar.   |
| 6         | Umgang mit externen Diensten | PalAPI wird nur bei fehlenden Pal-Daten genutzt und hat Timeout/Fallback.                 |

## Stakeholder

| Rolle               | Erwartung                                                                         |
| ------------------- | --------------------------------------------------------------------------------- |
| Prüfer im SQS-Modul | Können App, Doku und Quality Hub lokal nachvollziehen.                            |
| Projektteam         | Kann die Demo ohne manuelle Datenbank-Reparatur starten und erklären.             |
| Nutzer der App      | Bekommen ein verständliches Dashboard für Quests, Wasser und Pal-Fortschritt. |
