# Vitest Tests

Dieses Dokument beschreibt die Frontend-Unit-Tests mit Vitest für das Angular-Frontend.

## Zweck

Vitest wird für schnelle, isolierte Unit-Tests im Frontend verwendet. Der Fokus liegt aktuell auf testbarer Fachlogik, Mock-Daten und browsernahen Services, nicht auf kompletten UI-Flows.

Die E2E-Tests laufen separat mit Playwright.

## Wichtige Dateien

| Datei / Ordner                  | Bedeutung                             |
|---------------------------------|---------------------------------------|
| `frontend/vitest.config.ts`     | Zentrale Vitest-Konfiguration         |
| `tests/unit/setup.ts`           | Gemeinsames Test-Setup für Unit-Tests |
| `tests/unit/frontend/*.test.ts` | Frontend-Unit-Tests                   |
| `frontend/coverage/`            | Generierte Coverage-Reports           |

## Aktuelle Testdateien

| Testdatei                                             | Prüft                                                             |
|-------------------------------------------------------|-------------------------------------------------------------------|
| `tests/unit/frontend/app-state.logic.test.ts`         | Login-Logik, Registrierung, Task-Abschluss, Pet-Füttern und Reset |
| `tests/unit/frontend/browser-storage.service.test.ts` | Lesen und Schreiben von JSON-Daten im `localStorage`              |
| `tests/unit/frontend/mock-data.test.ts`               | Initiale Demo-Daten, E-Mail-Normalisierung und Wachstumsregeln    |

## Befehle

Alle Befehle werden im Ordner `frontend/` ausgeführt.

```bash
npm test
```

Führt alle Vitest-Unit-Tests einmalig aus.

```bash
npm run test:watch
```

Startet Vitest im Watch-Modus für die lokale Entwicklung.

```bash
npm run test:coverage
```

Führt alle Unit-Tests aus und erstellt einen Coverage-Report.

## Coverage

Die Coverage wird mit dem Vitest/V8-Provider gemessen. Es werden folgende Reports erzeugt:

| Report | Zweck |
| --- | --- |
| `text` | Ausgabe direkt im Terminal |
| `html` | Lokaler HTML-Report unter `frontend/coverage/` |
| `lcov` | Report für SonarQube unter `frontend/coverage/lcov.info` |

## 80-Prozent-Regel

Die Projektvorgabe für die Frontend-Codeabdeckung ist auf 80 Prozent gesetzt. Vitest prüft daher:

| Metrik | Mindestwert |
| --- | --- |
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

Wenn eine dieser Metriken unter 80 Prozent fällt, schlägt `npm run test:coverage` fehl.

## Aktueller Coverage-Scope

Aktuell werden diese Frontend-Bereiche in die Coverage-Bewertung aufgenommen:

```text
src/app/core/state/**/*.ts
src/app/core/services/browser-storage.service.ts
src/app/shared/mock/**/*.ts
```

Model-Dateien sind ausgeschlossen, weil sie nur TypeScript-Typen enthalten und keine ausführbare Logik abdecken.

## Warum dieser Scope?

Die Anwendung ist ein Angular-Frontend mit lokaler Demo-Logik. Die wichtigsten Fachregeln liegen bewusst in reinen Funktionen und kleinen Services. Dadurch bleiben die Tests schnell, stabil und unabhängig von UI-Rendering.

Später können weitere Bereiche in den Coverage-Scope aufgenommen werden, zum Beispiel Guards, UI-Komponenten oder API-Services.

## Lokaler Hinweis für Windows

Falls PowerShell `npm` wegen der Execution Policy blockiert, kann stattdessen dieser Befehl verwendet werden:

```powershell
npm.cmd run test:coverage
```

Das führt denselben Script-Eintrag aus, umgeht aber das blockierte `npm.ps1`.
