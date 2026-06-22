# PalHabit

PalHabit ist unsere gamifizierte Self-Care-App für die SQS-Semesterarbeit. Der
Stack besteht aus Angular-Frontend, Spring-Boot-Backend und PostgreSQL.

Dieses Projekt ist ein nicht-kommerzielles Studienprojekt im Rahmen der SQS-Semesterarbeit. Pokémon-Daten und -Sprites werden über 
die öffentliche PokeAPI eingebunden. Pokémon, Pokémon-Namen, Figuren und zugehörige Bilder/Marken sind Eigentum der jeweiligen 
Rechteinhaber. Dieses Projekt steht in keiner Verbindung zu Nintendo, Game Freak, Creatures Inc. oder The Pokémon Company und wird 
von diesen weder unterstützt noch autorisiert. Die PokeAPI wird ausschließlich als externe Datenquelle zu Demonstrations- und 
Ausbildungszwecken verwendet.

Für eine kommerzielle Nutzung, öffentliche Produktvermarktung oder App-Store-Veröffentlichung wäre eine gesonderte rechtliche 
Prüfung beziehungsweise eine Erlaubnis der Rechteinhaber erforderlich.

## One-Click-Start

### Voraussetzungen

- Docker Desktop oder Docker Engine mit Docker Compose
- Freie lokale Ports `3000`, `8181`, `5433` und optional `8088`
- Im Repo-Root ausführen, also im Ordner mit dieser `README.md`

### App starten

# Variante 1

```bash
.\scripts\setup.ps1
.\scripts\start.ps1
```

# Variante 2
Der normale Demo-Start startet PostgreSQL, Backend und Frontend:

```bash
docker compose up --build
```

Alternativ:
```bash
./scripts/start.ps1
```


Danach sind erreichbar:

- App: `http://localhost:3000`
- Backend: `http://localhost:8181`

Beim ersten Start werden die Docker-Images gebaut. Das kann ein paar Minuten
dauern. Spätere Starts sind deutlich schneller.

### Demo-Login

Im Backend-Profil `dev` legt der Start automatisch einen Demo-Nutzer an:

- Benutzername: `demo`
- Passwort: `password123`

Alternativ kann in der App ein eigenes Profil registriert werden.

### Stoppen

Im laufenden Terminal:

```bash
Ctrl+C
```

Danach Container sauber stoppen:

```bash
docker compose down
```

Wenn auch die lokale Datenbank zurückgesetzt werden soll:

```bash
docker compose down -v
```

### Ports ändern

Die Ports sind Defaults und können bei lokalen Konflikten überschrieben werden:

```bash
FRONTEND_PORT=3001 BACKEND_PORT=8182 docker compose --build
```

Unter PowerShell:

```powershell
$env:FRONTEND_PORT = "3001"
$env:BACKEND_PORT = "8182"
docker compose --build
```

### Häufige Probleme

- Wenn Port `3000`, `8181`, `5433` oder `8088` belegt ist, entweder den anderen
  Prozess beenden oder die Ports wie oben ändern.
- Wenn Docker noch nicht läuft, Docker Desktop starten und den Befehl erneut
  ausführen.
- Wenn Maven beim Docker-Build mit `pthread_create failed` oder
  `Failed to start thread "GC Thread#0"` abbricht, den Build einmal seriell
  starten:

  ```powershell
  $env:COMPOSE_PARALLEL_LIMIT = "1"
  docker compose --profile quality up --build
  ```

  Falls das nicht reicht, Docker Desktop neu starten und unter
  Settings > Resources mindestens 2 CPUs und 4 GB RAM zuweisen.
- Wenn nach Codeänderungen alte Artefakte sichtbar sind, mit
  `docker compose up --build` neu bauen.

## Lokale Checks

Backend lokal prüfen:

```bash
cd backend
sh ./mvnw verify
```

Unter Windows geht alternativ:

```powershell
cd backend
.\mvnw.cmd verify
```

Hinweis fuer lokale Java-Setups: Die Backend-Tests sollten mit einem JDK
laufen, nicht mit einem reinen JRE. Wenn lokal Java 25 verwendet wird, aktiviert
Maven automatisch ein Kompatibilitaetsprofil fuer Mockito/Byte Buddy und
ueberspringt JaCoCo nur lokal. In CI bleibt Java 21 mit JaCoCo-Coverage aktiv.

Wetterdaten manuell mit echten Open-Meteo-Curl-Aufrufen prüfen:

```powershell
cd C:\Workspace\Uni-26\SQS\SQS-Semesterarbeit
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\weather-curl-check.ps1
```

Einzelne Orte prüfen:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\weather-curl-check.ps1 -City "Hawaii", "Tokyo"
```

Das Script zeigt den Forecast-`curl.exe`-Befehl und die Temperatur aus
`current.temperature_2m`. Beim Wetterabruf nutzt es `elevation=nan`, damit kein
einzelner Berg- oder Höhenpunkt die Temperatur verfälscht.

Mit `-RawJson` ist im Forecast-JSON ein Feld wie
`"temperature_2m": 24.7` zu erwarten. Dieser Wert ist die Temperatur der App.

Eigenen Forecast-Curl mit Koordinaten bauen:

```powershell
curl.exe -s "https://api.open-meteo.com/v1/forecast?latitude=DEINE_LATITUDE&longitude=DEINE_LONGITUDE&current=temperature_2m,weather_code,is_day&elevation=nan&timezone=auto"
```

Oder über das Script mit eigenen Koordinaten:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\weather-curl-check.ps1 -Latitude 21.29637 -Longitude -157.70175 -Label "Mein Ort" -RawJson
```

## Quality Runner

- Backend-Tests mit JaCoCo
- Checkstyle und SpotBugs
- Frontend-Typecheck, Unit-Tests, Coverage und ESLint
- npm-Security-Check
- optionaler Playwright-E2E-Flow gegen den Docker-App-Stack

Der Runner schreibt `report.json`, Logs und HTML-Reports in ein Docker-Volume.

## Dokumentation

Die technische Dokumentation liegt unter `docs/` und ist für ReadTheDocs
vorbereitet. Wichtige Einstiegspunkte:

- `docs/index.md`
- `docs/04-quality/test-pyramid.md`
- `docs/02-architecture/arc42/`
- `docs/adr/`
- `docs/ger-adr/`
- `docs/02-architecture/diagrams/c4-diagram.md`
- `docs/02-architecture/diagrams/structurizr/workspace.dsl`
- `docs/05-presentation/presentation-plan.md`
- `docs/05-presentation/presentation-cheat-sheet.md`

ReadTheDocs nutzt `.readthedocs.yaml`, `mkdocs.yml` und
`docs/requirements.txt`. Nach dem Verbinden des öffentlichen Repositorys ist
die Doku dort direkt gebaut: https://luinarasqs-semesterarbeit.readthedocs.io/de/unlimitedgaming_soph/. 
Die Schritte stehen in `docs/06-operations/readthedocs-publish.md`.

Zusätzlich liegt unter `wiki/` eine schlankere Wiki-Fassung mit `Home.md`,
`_Sidebar.md` und Abgabe-/Review-Einstiegen. `docs/` bleibt die ausführliche
MkDocs-/ReadTheDocs-Doku; `wiki/` ist für schnelle Navigation und kann bei
Bedarf in ein GitHub-Wiki übernommen werden.
