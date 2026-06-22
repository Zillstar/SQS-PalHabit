# PalHabit Frontend

Diese README beschreibt unser Frontend für PalHabit. Die App ist keine klassische To-do-Liste, sondern eine kleine Game-App: Man erledigt Tagesquests, sammelt Punkte, trinkt Wasser, begleitet sein Pokémon und bekommt eine Wetter-Szene, die aus echten Wetterdaten kommt.

Wichtig für die Abgabe: Im sichtbaren UI soll die App nicht nach Technik-Demo aussehen. Begriffe wie API, Backend oder Abgabe gehören nicht auf Buttons und Karten. Technisch ist das Frontend aber sauber an das Spring-Backend angebunden.

## Kurz gesagt

- Angular mit Standalone Components
- SCSS mit globalen Tokens und Component Styles
- Backend-Anbindung über einen gekapselten API-Service
- zentraler App-State für Spieler, Quests, Wasser, Energie und Pokémon
- Wetter-Szene über Open-Meteo
- Pokémon-Sprite aus dem Spielstand, mit Fallback
- Unit-Tests mit Vitest
- User-Flows mit Playwright
- SonarQube für Abgabe-Checks

## Qualität für die Abgabe

Im Repo-Root startet ein einziger Docker-Compose-Befehl die App:

```powershell
docker compose --build
```

Danach:

```text
App:         http://localhost:3000
Backend:     http://localhost:8181
```

Falls lokal ein Port belegt ist, können die Defaults überschrieben werden, zum Beispiel:

```powershell
$env:FRONTEND_PORT = "3001"
docker compose --build
```

Der Quality Runner durchläuft:

- Backend-Tests mit JaCoCo
- Checkstyle und SpotBugs
- TypeScript-Typecheck
- Vitest-Unit-Tests und Coverage-Gate
- ESLint
- npm-Security-Check
- Playwright-E2E-Status

## Lokaler Start

### Ein Kommando

Im Repo-Root:

```powershell
.\scripts\dev.ps1
```

Das Skript startet PostgreSQL und Backend per Docker Compose, wartet auf `http://localhost:8181` und startet danach das Angular-Frontend auf `http://localhost:4200`.

### Datenbank starten

Im Repo-Root:

```powershell
docker compose up -d db
```

Unsere Postgres-DB nutzt lokal Host-Port `5433`, damit sie nicht mit anderen Projekten kollidiert, die oft schon `5432` belegen.

```text
Host: localhost
Port: 5433
Database: sqs_db
User: sqs_user
Password: sqs_password
```

### Backend starten

Das Backend muss auf `http://localhost:8181` laufen.

Dev-Profil:

```text
SPRING_PROFILES_ACTIVE=dev
```

Der Dev-Seed legt beim Start automatisch einen Demo-User und Basisquests an:

```text
demo / password123
```

### Frontend starten

```powershell
cd frontend
npm install
npm start
```

Browser:

```text
http://localhost:4200
```

## Warum der Proxy wichtig ist

Angular läuft lokal auf `localhost:4200`, das Backend auf `localhost:8181`. Damit die Komponenten keine harte Backend-URL kennen müssen, nutzt Angular den Proxy:

```text
frontend/proxy.conf.json
```

Weiterleitungen:

```text
/api    -> http://localhost:8181
/assets -> http://localhost:8181
```

Wenn im Terminal steht:

```text
http proxy error: /api/auth/login ECONNREFUSED
```

dann ist das kein Frontend-Fehler. Das Backend läuft dann nicht auf Port `8181`.

## App-Flow

1. Spieler öffnet die App.
2. Splash-Screen führt in das Spiel.
3. Spieler loggt sich ein oder registriert sich.
4. Quest-Board lädt Tagesquests und Spielstand.
5. Spieler erledigt Quests.
6. Punkte füllen Tagesziel und Level-Fortschritt.
7. Spieler kann Wasser über die Wasser-Gauge speichern.
8. Wetter-Szene passt sich an Stadt und Wetterdaten an.

So kann man die Demo gut zeigen: anmelden, klicken, Feedback sehen, Spielstand aktualisiert sich.

## Screens und Buttons

### Splash

Der Splash-Screen ist der Einstieg in die App.

Button:

- `Spiel starten`: führt zum Login oder bei vorhandener Session direkt ins Spiel.

### Login und Registrierung

Der Spieler kommt hier in seinen Spielstand.

Felder:

- `Spielername`: wird als Username für das Backend genutzt.
- `Passwort`: beim Login nur erforderlich, bei Registrierung mindestens 8 Zeichen.

Buttons:

- `Einloggen und weitermachen`: meldet den Spieler an.
- `Profil anlegen und starten`: erstellt einen neuen Spieler.

Wichtig: Das Frontend speichert keine Passwörter im Browser.

### Topbar

Die Topbar gibt schnell Kontext.

Sie zeigt:

- Spielername
- erledigte Quests

Buttons:

- `Neu laden`: lädt den Spielstand frisch.
- `Abmelden`: beendet die Session und führt zur Login-Seite.
- `Profil löschen`: löscht den Account über das Backend und beendet die Session.

### Tagesquests

Die Quests sind die Hauptmechanik.

Regeln:

- Quests kommen aus dem Backend.
- Eine Quest kann nur einmal abgeschlossen werden.
- Nach Abschluss wird der Spielstand neu geladen.
- Das Backend bleibt die Quelle der Wahrheit.

Button:

- `Erledigen`: schließt eine Quest ab.

### Tagesziel

Die Tagesziel-Karte zeigt Fortschritt und Ressourcen.

Sie zeigt:

- Quest-Punkte
- Fortschritt in Prozent
- Wasserstand
- Energie
- Anmelde-Serie

Wasser-Gauge:

- `+250 ml`: speichert Wasser in der Wasser-Quest.
- `+500 ml`: speichert Wasser in der Wasser-Quest.
- Bei `3000 ml` wird die Quest automatisch als erledigt markiert.

### Pokémon Partner

Das Pokémon ist das visuelle Zentrum der App.

Die Karte zeigt:

- Pokémon-Sprite
- Level
- Wachstum
- Motivation
- Wetter-Szene

Das Aktionspanel unter der Partnerkarte ist zweigeteilt:

- links Pflege-Hinweis und `Pokémon trainieren`
- rechts der helle Demo-Bereich mit `Level-Up testen` und `Motivation senken`

Die Demo-Aktionen sind bewusst als Pruefhilfe gestaltet: Sie erlauben schnelle
Sichtkontrolle fuer Level-Up-Feedback, Motivation und Backend-Spielstand, ohne
in der Praesentation lange warten zu muessen.

### Wetter-Szene

Die Wetter-Szene macht die App lebendiger und weniger statisch.

Open-Meteo liefert:

- Temperatur
- Wettercode
- Tag oder Nacht

Daraus baut das Frontend eine Szene für:

- Sonne
- Wolken
- Regen
- Schnee
- Hagel
- Sturm
- Nebel
- Tag/Nacht-Stimmung

Buttons:

- `Stadt laden`: sucht eine Stadt und lädt das passende Wetter.
- `Aktualisieren`: lädt das Wetter für die aktuelle Stadt neu.

### Wetterdaten manuell prüfen

Die App zeigt keine beliebigen Wetterdaten aus einer anderen Website, sondern
die Antwort von Open-Meteo. Für einen sauberen Vergleich sollte deshalb immer
derselbe Open-Meteo-Request geprüft werden. Andere Wetterseiten können andere
Koordinaten, andere Modelle, andere Rundungen oder andere Aktualisierungszeiten
nutzen.

So lässt sich die Anzeige prüfen:

1. Stadt wie in der App suchen, zum Beispiel Rosenheim:

   ```text
   https://geocoding-api.open-meteo.com/v1/search?name=Rosenheim&count=1&language=de&format=json
   ```

2. Aus der Antwort `latitude`, `longitude`, `name`, `admin1` und `country`
   übernehmen. Diese Werte sollten zur Ortsanzeige der App passen.

3. Mit denselben Koordinaten die Wetterdaten abrufen:

   ```text
   https://api.open-meteo.com/v1/forecast?latitude=47.8564&longitude=12.1225&current=temperature_2m,weather_code,is_day&timezone=auto
   ```

4. In der JSON-Antwort `current.temperature_2m`, `current.weather_code` und
   `current.is_day` vergleichen. Die App übernimmt die Temperatur ohne Rundung
   und mappt den Wettercode auf die sichtbare Szene, zum Beispiel Wolken,
   Regen, Schnee, Hagel, Sturm oder Nebel.

5. Die Zeile `Letzte Aktualisierung` ist bewusst nicht die Open-Meteo-Zeit
   `current.time`. Sie zeigt den Zeitpunkt, zu dem die App den Refresh
   erfolgreich ausgeführt hat.

Für die Präsentation reicht als Nachweis: App öffnen, Stadt laden,
Open-Meteo-URL mit denselben Koordinaten öffnen und Temperatur, Wettercode und
Tag/Nacht-Wert vergleichen.

## API-Anbindung

Komponenten rufen nicht direkt `fetch` auf. Dafür gibt es eine eigene Schicht:

```text
src/app/core/services/backend-api.service.ts
```

Diese Schicht macht:

- Requests ans Backend
- Session-Cookies mitsenden
- Backend-DTOs in Frontend-Modelle mappen
- Fehlertexte kapseln

Genutzte Endpunkte:

```text
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
DELETE /api/user/account
GET  /api/tasks
POST /api/tasks/{id}/complete
GET  /api/user/game-state
POST /api/user/water
POST /api/user/feed
```

Der App-State liegt hier:

```text
src/app/core/services/app-state.service.ts
```

Er verbindet:

- aktiven Spieler
- Quests
- Pokémon-Zustand
- Wasser und Energie
- Feedback-Meldungen
- Session-Restore für Guards

Kurz gesagt: Komponenten sollen nicht wissen müssen, wie genau das Backend antwortet.

## Datenfluss

Login:

```text
AuthForm -> AuthPage -> AppStateService.login -> BackendApiService.login
```

Quest erledigen:

```text
TaskCard -> TaskList -> DashboardPage -> AppStateService.completeTask -> BackendApiService.completeTask
```

Wasser trinken:

```text
Tagesziel-Karte -> DashboardPage -> AppStateService.addWater -> BackendApiService.addWater
```

Wetter:

```text
PetCard -> WeatherService -> BackendWeatherAdapter -> /api/weather -> Backend WeatherService -> Open-Meteo
```

## Projektstruktur

```text
frontend/
|-- public/
|-- src/
|   |-- app/
|   |   |-- core/
|   |   |   |-- guards/
|   |   |   |-- services/
|   |   |   `-- state/
|   |   |-- pages/
|   |   |   |-- splash/
|   |   |   |-- auth/
|   |   |   `-- dashboard/
|   |   |       `-- components/
|   |   `-- shared/
|   |       |-- models/
|   |       |-- mock/
|   |       `-- ui/
|   |-- styles/
|   |-- main.ts
|   `-- styles.scss
|-- proxy.conf.json
|-- angular.json
|-- package.json
|-- playwright.config.ts
|-- vitest.config.ts
`-- README.md
```

## Teststrategie

Wir testen nicht nur einzelne Funktionen, sondern auch echte Klickwege.

### Unit-Tests

Unit-Tests prüfen:

- Punkteberechnung
- Tagesziel
- Pokémon-Level und Wachstum
- Wetter-Mapping
- Pokémon-Fallbacks
- API-Mapping im Frontend

Befehl:

```powershell
npm test
```

### Typecheck

```powershell
npm run type-check
```

### Lint

```powershell
npm run lint
```

### E2E / User-Mocking

Playwright simuliert einen echten Spieler.

Aktuell wichtig:

- Seite öffnen
- Login ausfüllen
- Button klicken
- Quest-Board sehen
- Wasserbutton klicken
- Quest erledigen
- Level-Up-Test ausführen
- Logout ausführen

Befehl:

```powershell
npm run test:e2e
```

Zusätzlich decken Unit- und Service-Tests Registrierung, Stadt- und Wetterlogik,
Backend-Fehler und Fallback-Verhalten ab. Der Quality Runner führt die wichtigsten
Checks gesammelt aus.

## Clean-Code-Methodik

Unser Ziel ist, dass die App nicht nur läuft, sondern nachvollziehbar gebaut ist.

Regeln:

- Komponenten bleiben für UI und Events zuständig.
- HTTP bleibt im API-Service.
- Spielstand bleibt im State-Service.
- Wetter und Pokémon sind über Adapter gekapselt.
- Sichtbare Texte bleiben Game-Sprache.
- Alte Mock-/Legacy-Begriffe werden nicht in der UI gezeigt.
- Mapping-Logik wird nicht wild in Komponenten verteilt.
- Styles nutzen vorhandene Tokens und Mixins.

## Cyber-Security-Hardening

Aktueller Stand:

- Session-Cookies werden über `credentials: 'include'` genutzt.
- Das Frontend speichert keine Passwörter.
- Nur der aktive Spielername wird für Session-Restore lokal gespeichert.
- Fehlertexte werden für Spieler verständlich gekapselt.

Abgabe-Status:

- Keine Passwörter oder Secrets im Frontend.
- `npm run security:frontend` kombiniert Offline-Lockfile-Guards mit `npm audit`.
- Bekannte Frontend-Supply-Chain-Risiken sind in `docs/04-quality/frontend-npm-security.md` dokumentiert.
- Cookie- und CSP-Hardening bleiben Teil eines echten Produktionsdeployments.

## Checks vor Abgabe

Lokal im Frontend:

```powershell
npm run type-check
npm test
npm run lint
```

## Troubleshooting

### Proxy-Fehler beim Login

Fehler:

```text
http proxy error: /api/auth/login ECONNREFUSED
```

Bedeutung:

- Frontend läuft.
- Backend läuft nicht auf `localhost:8181`.

Lösung:

```powershell
docker compose up -d db
```

Dann Backend mit Profil `dev` starten.

### Port-Konflikt bei Postgres

Dieses Projekt nutzt:

```text
5433:5432
```

Wenn Docker trotzdem meckert:

```powershell
docker ps
```

### Demo-Login

```text
demo / password123
```

## Abgabe-Stand

Der aktuelle Stand ist auf eine reproduzierbare Demo ausgelegt: App starten,
Demo-Login nutzen, SonarQube öffnen und dort Test-, Coverage-, Security-,
Analyse- und E2E-Nachweise zeigen.
