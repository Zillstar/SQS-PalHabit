# API-Dokumentation — Tasks

Dieses Dokument beschreibt die Task‑APIs: öffentliche Taskliste und das Melden des Abschlusses einer Task durch den eingeloggten Benutzer.

Wichtig: Die aktuelle Implementierung nutzt die vorhandene `tasks`‑Tabelle und `user_tasks` für persistente Abschlüsse. Ein späteres append‑only `TaskCompletion`‑Log bleibt eine mögliche Erweiterung für echte Tageshistorie.

## Basis‑Pfad

```
/api/tasks
```

## Authentifizierung

- `GET /api/tasks` ist öffentlich und benötigt keine Authentifizierung.
- `POST /api/tasks/{taskId}/complete` erfordert einen authentifizierten Benutzer (Session/Token wie bestehende Authentifizierung).

## GET /api/tasks

- Zweck: Liefert die öffentliche Liste aller Tasks. Keine User‑bezogenen Completion‑Informationen werden hier zurückgegeben.
- Auth: optional (keine Auth nötig)
- Request: GET /api/tasks
- Response 200 JSON: Array von Task‑Objekten (siehe DTO `TaskPublicDto`)

TaskPublicDto (response schema)

- `id` (number)
- `title` (string)
- `description` (string)

Beispiel:

```json
[
  {
    "id": 1,
    "title": "Brush teeth",
    "description": "Brush your teeth each morning"
  },
  { "id": 2, "title": "Walk", "description": "Take a short walk outside" }
]
```

## POST /api/tasks/{taskId}/complete

- Zweck: Meldet dem Server, dass der aktuell eingeloggte Benutzer die Task `taskId` abgeschlossen hat. Der Server wendet die Spiel-Effekte an (`pendingFeedPoints`, Wachstum, Level, ggf. Hatch/Evolution) und liefert den aktualisierten Spielzustand zurück.
- Auth: erforderlich (Session/Token). Nicht‑authentifizierte Anfragen -> 401 Unauthorized.
- Request:
  - Method: POST
  - Path: `/api/tasks/{taskId}/complete` (taskId als path param)
  - Body: optionales Meta‑Objekt (nicht erforderlich in dieser Iteration)
- Response:
  - 200 OK — die Task wurde neu für den User als abgeschlossen markiert und Effekte wurden angewendet. Body enthält ein `gameState`‑Objekt (entspricht `GameStateDto`, siehe `docs/03-api/user-game-state.md`) mit aktualisierten Werten: `pendingFeedPoints`, `growth`, `palLevel`, `palImageUrl`, `serverNow`, `streak`, `tasks` (optional).
  - 404 Not Found — Task mit `taskId` existiert nicht.
  - 401 Unauthorized — kein gültiger Login vorhanden.
  - 409 Conflict — die Task ist bereits als abgeschlossen für diesen Benutzer gespeichert (für diese Iteration: `user_tasks.completed == true`).
  - 500 Internal Server Error — unerwarteter Fehler.

Wesentliche Semantik (kurz)

- Die Aktion führt zu folgenden Effekten:
  - Quest-Punkte: `task.feed_points` werden technisch zu `user.pendingFeedPoints` addiert.
  - Wachstum: Erhöht sich um `10 XP` pro neu abgeschlossenem Task, maximal bis `100`.
  - Level: Wenn der Wachstumswert den Cap erreicht und der Level-Cooldown erfüllt ist, steigt `palLevel` um genau 1 und `growth` wird auf `0` gesetzt.
  - Cooldown: Ein Level-Up ist nur möglich, wenn `last_level_up_at` leer ist oder mindestens zwei Tage zurückliegt. Ist der Cooldown aktiv, bleibt `growth` bei `100`.
  - Level‑abhängige Effekte:
    - Beim Erreichen von Level >= 10: Wenn `isEgg == true`, wird das Pal ausgebrütet (isEgg=false und `hatchedAt` gesetzt).
    - Bei Erreichen von Level >= 15 und >= 35: Wenn `evolutionId` vorhanden ist, wird das Pal einmal bzw. zweimal weiterentwickelt (sofern Evolutionskette vorhanden).
- Implementation‑Hinweis: In dieser Iteration wird für Persistenz das vorhandene Modell `user_tasks` (boolean `completed`) verwendet; langfristig wird ein `task_completions`‑Log empfohlen, das Tages‑Eindeutigkeit robust handhabt.

Tagesgrenzen / Reset

- Der Reset von Wasserstand und `user_tasks.completed` wird serverseitig beim Abruf des Game-State und vor relevanten Spielstandsaktionen bewertet, sobald das konfigurierte Reset-Intervall erreicht ist (siehe `docs/03-api/user-game-state.md`).
- Hinweis für Backend‑Integratoren: Weil aktuell kein `TaskCompletion`‑Log vorhanden ist, setzt der Server den bestehenden `user_tasks.completed`‑Wert zurück. Eine append-only Historie pro Tag bleibt eine spätere Erweiterung.

Idempotency und Fehlerverhalten

- Wenn der Server bei Einfügen/Setzen erkennt, dass die Task bereits für denselben Benutzer als abgeschlossen markiert ist, liefert er 409 Conflict.
- Hinweis: Wenn in Zukunft `TaskCompletion` eingeführt wird, sollte der Server stattdessen eine Unique‑Constraint pro (user, task, date) verwenden und 409 bei Duplikaten zurückgeben.

Effekt‑Payload (Beispielantwort nach erfolgreichem Abschluss)

```json
{
  "success": true,
  "gameState": {
    "waterLevel": 120,
    "foodLevel": 50,
    "palImageUrl": "https://cdn.example.com/pal/starter-pal.png",
    "palLevel": 5,
    "growth": 42,
    "happiness": 66,
    "pendingFeedPoints": 20,
    "tasks": [],
    "streak": 3,
    "yesterdayLoggedIn": true,
    "serverNow": "2026-06-13T07:12:00Z"
  }
}
```

Sicherheitsaspekte

- Die POST‑Operation darf nur vom authentifizierten Nutzer ausgeführt werden. Die Controller MUSS den Benutzernamen aus der Session/Token ableiten (wie in `AuthenticationController`) und darf keine `userId`‑Parameter vom Client akzeptieren.

Tests (Empfehlung)

- Unit‑Tests für `TaskService.completeTaskForUser` (mocked `UserRepository`, `TaskRepository`, `UserTaskRepository`):
  - erster Abschluss setzt `user_tasks.completed=true`, erhöht `pendingFeedPoints` und Wachstum
  - zweiter Abschluss derselben Task liefert 409
  - Level‑Up ohne `lastLevelUpAt` setzt Level und `lastLevelUpAt`
  - Level-Up innerhalb von zwei Tagen bleibt blockiert und hält `growth` am Cap
  - Hatch/Evolution‑Randfälle
- Integrationstests (Testcontainers): End‑to‑end Szenarien mit echter DB‑Migration (wenn TaskCompletion später eingeführt)

Implementationshinweise / Roadmap

- Kurzfristig (kein DB‑Change):
  - Implementiere `GET /api/tasks` aus `Task`‑Tabelle.
  - Implementiere `POST /api/tasks/{id}/complete` welches `user_tasks.completed=true` setzt (wenn ein Eintrag für user+task existiert, updaten; andernfalls anlegen) und die Effects anwendet.
- Mittelfristig (geplanter Change):
  - Führe `TaskCompletion` append‑only‑Tabelle ein (Prisma + Migration), passe POST‑Logik an, entferne `user_tasks.completed` oder migriere sie in `task_completions`.

Frontend‑Hinweis

- Nach erfolgreichem POST sollte das Frontend die lokale Darstellung des Benutzers mit den aus `gameState` zurückgegebenen Werten aktualisieren (`pendingFeedPoints`, `happiness`, `growth`, `palLevel`, `palImageUrl`). Bei 409 kann das Frontend optional den GameState neu laden (`GET /api/user/game-state`).
- Level-Ups sind serverseitig auf frühestens alle zwei Tage begrenzt. Wenn der Wachstumswert voll ist, aber der Cooldown aktiv bleibt, hält der Server `growth` am Cap und erhöht `palLevel` erst bei einer späteren qualifizierenden Aktion.

Dateiablage

- Diese Doku liegt in `docs/03-api/tasks.md`.
