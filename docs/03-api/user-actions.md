# API — Benutzeraktionen: Water, Feed & Account

Dieses Dokument beschreibt die Endpunkte, mit denen der Client Wasser trinken, den Pal-Spielstand aktualisieren und den eigenen Account löschen kann.

Hinweis: Authentifizierung wie im Projektstandard (Session / USER_TOKEN) wird erwartet. Alle Zeiten und Werte verwenden UTC‑Konventionen, Responses enthalten `GameStateDto` (siehe `docs/03-api/user-game-state.md`).

## Allgemeines

- Basis‑Pfad: `/api/user`
- Auth: erforderlich (Session/Token, wie in `AuthenticationController`) für alle Endpunkte.
- Rückgabe: Nach erfolgreicher Aktion wird der aktuelle GameState als `GameStateDto` zurückgegeben (inkl. `waterLevel`, `pendingFeedPoints`, `happiness`, `palLevel`, `palImageUrl`, u.a.).

## POST /api/user/water

- Zweck: Erhöht den Wasserspeicher (wasser level) des eingeloggten Users um die angegebene Menge in Millilitern.
- Auth: erforderlich.
- Request:
  - Method: POST
  - Path: `/api/user/water`
  - Body (JSON):
    - `ml` (number) — Milliliter, die dem Wasserspeicher hinzugefügt werden. Das Frontend sendet aktuell `250` oder `500`.

- Verhalten:
  - Der Server erhöht `user.hydrationMl += ml` und persistiert den neuen Wert.
  - Der Server gibt den aktualisierten `GameStateDto` zurück.
- Ab `3000 ml` schließt der Server den Task `Wasser trinken` automatisch ab, sofern dieser Task existiert und für den User noch offen ist.

- Responses:
  - 200 OK — JSON body: aktueller `GameStateDto`.
  - 401 Unauthorized — kein gültiger Login / Session.
  - 404 Not Found — Benutzer nicht gefunden (sollte in DB‑Mode nur bei Inkonsistenzen auftreten).
  - 500 Internal Server Error — unerwarteter Fehler.

Beispiel Request

```
POST /api/user/water
Content-Type: application/json
{
  "ml": 250
}
```

Beispiel Response (auszugsweise)

```
{
  "waterLevel": 1250,
  "pendingFeedPoints": 12,
  "happiness": 40,
  "palLevel": 5,
  "palImageUrl": "/assets/starter-pal.png",
  "serverNow": "2026-06-13T07:12:00Z"
}
```

## POST /api/user/feed

- Zweck: Wandelt die angesammelten Futter‑Punkte (die Tasks als `feed_points` vergeben) in `happiness` um.
- Auth: erforderlich.
- Request:
  - Method: POST
  - Path: `/api/user/feed`
  - Body: none

- Verhalten (Server):
  - Der Server liest `user.pendingFeedPoints` (gesammelt durch Task‑Abschlüsse) und `user.happiness`.
  - Er wendet so viele Feed‑Punkte an, wie nötig, um die `happiness` bis maximal 100 zu erhöhen (Konversion: 1 feedPoint -> 1 happiness‑Punkt). Beispiel: bei `pendingFeedPoints = 30` und `happiness = 85` werden 15 Punkte angewandt, `happiness` = 100, `pendingFeedPoints` = 15 (Rest bleibt erhalten).
  - Der Server persistiert die Änderung (`happiness` und verbleibende `pendingFeedPoints`) und gibt den aktualisierten `GameStateDto` zurück.

- Responses:
  - 200 OK — JSON body: aktueller `GameStateDto`.
  - 401 Unauthorized — kein gültiger Login / Session.
  - 404 Not Found — Benutzer nicht gefunden.
  - 500 Internal Server Error — unerwarteter Fehler.

Beispiel Request

```http
POST /api/user/feed
```

Beispiel Response

```json
{
  "waterLevel": 1250,
  "pendingFeedPoints": 15,
  "happiness": 100,
  "palLevel": 5,
  "serverNow": "2026-06-13T07:14:00Z"
}
```

## POST /api/user/test-motivation-decay

- Zweck: Manueller Test-Endpunkt für den Motivationsverlust im Dashboard.
- Auth: erforderlich.
- Request:
  - Method: POST
  - Path: `/api/user/test-motivation-decay`
  - Body: none

- Verhalten:
  - Der Server senkt `happiness` um `20` Punkte.
  - Der Wert wird bei `0` begrenzt und kann nicht negativ werden.
  - Wenn die Motivation schon bei `0` ist oder der Verlust groesser als die aktuelle Motivation ist, wird der verbleibende Verlust von `growth` abgezogen.
  - Auch `growth` wird bei `0` begrenzt und kann nicht negativ werden.
  - Der Server persistiert die Änderung und gibt den aktualisierten `GameStateDto` zurück.

- Fachliche Wirkung im aktuellen Stand:
  - Sinkende Motivation ist zuerst ein sichtbarer Pflege- und Feedback-Zustand.
  - Bei `0%` Motivation kostet weiterer Motivationsverlust etwas Wachstum/XP.
  - Unter ca. `25%` kann das Frontend den Pflegezustand als kritisch anzeigen.
  - Quests, Wassertracking und Level-Up werden dadurch aktuell nicht hart blockiert.
  - Motivation kann über Quest-Punkte und `POST /api/user/feed` wieder erhöht werden.

- Responses:
  - 200 OK - JSON body: aktueller `GameStateDto`.
  - 401 Unauthorized - kein gültiger Login / Session.
  - 404 Not Found - Benutzer nicht gefunden.

Beispiel Request

```http
POST /api/user/test-motivation-decay
```

Beispiel Response

```json
{
  "happiness": 0,
  "growth": 30,
  "palLevel": 5,
  "pendingFeedPoints": 15,
  "serverNow": "2026-06-13T07:16:00Z"
}
```

## Zusammenspiel mit Tasks

- Tasks haben jetzt ein Feld `feed_points` (DB‑Spalte `feed_points`).
- Beim Abschließen einer Task (`POST /api/tasks/{id}/complete`) werden die `feed_points` dieser Task dem Feld `user.pendingFeedPoints` hinzugefügt. Die Task‑Abschluss‑Action selbst erhöht nicht direkt `happiness` — das geschieht durch die separate `POST /api/user/feed` Aktion.
- Wachstum (`growth`), Level-Ups, Hatch und Evolution bleiben beim Task-Abschluss erhalten. Level-Ups sind auf frühestens alle zwei Tage begrenzt.

## DELETE /api/user/account

- Zweck: Löscht den aktuell authentifizierten Account inklusive userbezogener Fortschrittsdaten und invalidiert die Session.
- Auth: erforderlich.
- Request:
  - Method: DELETE
  - Path: `/api/user/account`
  - Body: none

- Verhalten:
  - Der Server leitet den User aus der Session ab.
  - `user_tasks` werden vor dem User gelöscht.
  - Falls die optionale Tabelle `user_stats` existiert, werden auch diese Zeilen gelöscht.
  - Danach wird der User gelöscht, der Auth-Token invalidiert und die HTTP-Session beendet.

- Responses:
  - `204 No Content` — Account gelöscht, Session beendet.
  - `401 Unauthorized` — keine gültige Session.
  - `404 Not Found` — Session zeigt auf einen nicht mehr existierenden User.

## Frontend‑Hinweise

- Für das Trinken gibt es Buttons für `250 ml` und `500 ml`. Jeder Button sendet ein `POST /api/user/water` mit dem entsprechenden `ml`‑Wert.
- Das Backend entscheidet, wann die Quest `Wasser trinken` abgeschlossen wird: sobald `gameState.waterLevel >= 3000`.
- Für Füttern: das Frontend zeigt die verfügbare `pendingFeedPoints` aus `gameState.pendingFeedPoints`. Nutzer können den Füttern‑Button drücken (POST /api/user/feed), um Punkte in `happiness` umzuwandeln.

- Der Button `Motivation senken` ist ein manueller Testbutton. Er ruft `POST /api/user/test-motivation-decay` auf und zeigt danach den neuen Motivationswert im Dashboard.

## Tests & Verhaltenserwartungen

- Unit‑Tests sollten folgende Fälle abdecken:
  - `POST /api/user/water` erhöht `waterLevel` um das übermittelte `ml`.
  - `POST /api/user/feed` wandelt pendingFeedPoints korrekt in `happiness` um (inkl. Randfälle: genaues Auffüllen auf 100, Restpunkte bleiben erhalten).
  - Interaktion mit Tasks: Abschluss einer Task erhöht `pendingFeedPoints` um `task.feed_points`.

## Migration & DB‑Hinweis

- Neue Spalte in `tasks` (feed_points) ist bereits in der JPA‑Entity `TaskEntity` vorhanden. Falls ihr mit Prisma/SQL migriert, legt eine Migration an, die `feed_points` (integer default 0) zur `tasks`‑Tabelle hinzufügt.
- Neue Spalte in `users` (pending_feed_points) ist in `UserEntity` vorhanden und muss analog in die DB gemigt werden.

## Test-Ergänzung

- `POST /api/user/test-motivation-decay` senkt `happiness` um 20 und begrenzt bei 0.
