# Docker und reproduzierbares Deployment

Ein wichtiges Qualitätsziel von PalHabit ist, dass das Projekt auf einem
fremden Rechner reproduzierbar gestartet und geprüft werden kann. Dieses Ziel
gehört zum ISO-25010-Merkmal Portability und ist für die Abgabe besonders
wichtig, weil die Anwendung nicht nur auf einem einzelnen Entwicklungsrechner
funktionieren darf.

Die Vorlesung behandelt Docker als Mittel, um Laufzeitumgebungen,
Abhängigkeiten und Dienste kontrolliert bereitzustellen. Für PalHabit wird
Docker genutzt, um Backend, Frontend, Datenbank und Quality-Umgebung
nachvollziehbar zusammenzuführen.

## Umsetzung im Projekt

| Maßnahme                      | Umsetzung                                                                                         | Nutzen                                                                                      |
|-------------------------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| Docker Compose                | Zentrale Orchestrierung der Projektcontainer über `docker-compose.yml`                            | Die Anwendung kann mit einem einheitlichen Befehl gestartet werden.                         |
| Gepinnte Images               | Es werden konkrete Image-Versionen verwendet, z. B. `postgres:16-alpine`, statt `latest`.         | Builds bleiben reproduzierbarer und ändern sich nicht unbemerkt durch neue Image-Versionen. |
| Service-Namen statt localhost | Container kommunizieren im Docker-Netzwerk über Servicenamen wie `db`, `backend` oder `frontend`. | Die Kommunikation funktioniert unabhängig vom Host-System.                                  |
| Setup- und Start-Skripte      | `scripts/setup.sh` und `scripts/start.sh` unterstützen einen einheitlichen Projektstart.          | Neue Entwickler oder Prüfer müssen nicht alle Befehle manuell zusammensuchen.               |
| Environment-Konfiguration     | Beispielkonfigurationen werden über `.env.example` dokumentiert.                                  | Benötigte Variablen sind nachvollziehbar, ohne echte Secrets zu committen.                  |


## Vermeidung typischer Docker-Probleme

Für die Abgabe ist besonders wichtig, dass Docker nicht nur irgendwie genutzt,
sondern sauber begründet eingesetzt wird.

Deshalb gelten für PalHabit folgende Regeln:

```text
- Keine Images mit :latest verwenden.
- Datenbank-Images auf konkrete Versionen pinnen.
- Container sprechen intern über Docker-Servicenamen, nicht über localhost.
- README erklärt docker compose up, setup.sh und start.sh.
- .env.example dokumentiert notwendige Variablen.
- Keine echten Secrets oder Passwörter ins Repository committen.
```
## Begründung der Image-Versionen

Images mit dem Tag `:latest` werden vermieden, weil sich deren Inhalt ändern
kann, ohne dass sich die Projektdateien ändern. Dadurch könnte ein Projekt, das
heute funktioniert, später durch eine neue Image-Version unerwartet fehlschlagen.

Stattdessen werden konkrete Versionen verwendet, zum Beispiel:
```text
image: postgres:16-alpine
```
Dadurch ist klar, welche Hauptversion der Datenbank verwendet wird. Das macht
das Verhalten reproduzierbarer und erleichtert Fehlersuche, Updates und
Bewertung.

## Verbindung zu Portability

Docker unterstützt in PalHabit vor allem das Qualitätsmerkmal Portability.
Die Anwendung soll nicht nur lokal bei einem Teammitglied laufen, sondern auf
einem fremden Rechner mit dokumentierten Befehlen startbar sein.

Der Qualitätsnachweis lautet daher:

```text
Frischer Clone
→ .env aus .env.example erstellen
→ scripts/setup.sh ausführen
→ scripts/start.sh oder docker compose up ausführen
→ Anwendung sind erreichbar
```

Damit wird Docker nicht nur als technisches Hilfsmittel verwendet, sondern als
konkreter Qualitätsnachweis für reproduzierbares Deployment.

## Prüfung auf `latest`-Tags

Ein häufiger Docker-Fehler ist die Verwendung von Images mit dem Tag `latest`.
Dadurch kann sich die tatsächlich verwendete Laufzeitumgebung ändern, ohne dass
sich das Repository ändert.

Für PalHabit wurde deshalb geprüft, ob in Dockerfiles, Compose-Dateien oder
YAML-Konfigurationen `:latest` verwendet wird:

```powershell
Get-ChildItem -Recurse -File -Include Dockerfile,*.yml,*.yaml | Select-String -Pattern ':latest'
```
Der Befehl lieferte keine Treffer. Damit werden in den versionierten
Docker-Konfigurationsdateien keine externen Images über `:latest` referenziert.

In Docker Desktop können dennoch lokale Images mit Tags wie
`projekt-backend:latest` oder `projekt-frontend:latest` erscheinen. Diese Tags
entstehen lokal beim Build der eigenen Projekt-Images und sind nicht gleichzusetzen
mit externen, unkontrolliert aktualisierten Basis-Images.
