# Daily-Reset-Testfälle

## Ziel

Nachweisen, dass das Frontend nach Ablauf des konfigurierten Reset-Intervalls den neuen Backend-Spielstand korrekt darstellt:

* Wasser-Buttons sind wieder aktiv.
* Erledigte Quest-Buttons werden wieder zu offenen `Erledigen`-Buttons.
* Der Wasserstand steht wieder bei `0 / 3000 ml`.
* Die Anmelde-Serie bleibt am selben UTC-Tag unverändert.

Wichtig: Der Reset wird nicht durch einen neuen Login ausgelöst.

Der Server bewertet den Reset beim Abruf von `GET /api/user/game-state`.

Das Frontend lädt den Spielstand während einer laufenden Session regelmäßig neu.

## Automatisierter Nachweis

### Backend-JUnit

Der Service-Test `backend/src/test/java/io/github/luinara/sqs/user/UserServiceTest.java` enthält den technischen Nachweis für das kurze Reset-Intervall:

* `getGameState_resetsDailyProgress_afterConfiguredIntervalWithoutNewLogin` instanziiert `UserService` mit `Duration.ofMinutes(1)`.
* Der Test setzt `lastLoginAt` auf `2026-06-16T10:00:00Z` und die feste Test-Clock auf `2026-06-16T10:01:00Z`.
* Erwartet wird, dass `waterLevel` auf `0` fällt, `lastDailyResetAt` gesetzt wird, `resetCompletionsByUserId(...)` aufgerufen wird und der User gespeichert wird.
* `getGameState_doesNotResetAgain_beforeNextInterval` prüft den Gegenfall: Nach einem Reset um `10:01:00Z` darf bei `10:01:30Z` noch kein weiterer Reset passieren.

Damit ist die Backend-Regel für `palhabit.daily-reset-interval=PT1M` automatisiert abgesichert, ohne im Test real eine Minute warten zu müssen.

### Browser-E2E

Der Playwright-Test `tests/e2e/daily-reset.spec.ts` simuliert das Reset-Intervall über gemockte API-Antworten:

1. Login mit Spielstand vor Reset: Wasser `2500 ml`, Streak `2`, alle Quests offen.
2. User klickt `+500 ml`; Wasser erreicht `3000 / 3000 ml`, Wasser-Buttons sind deaktiviert.
3. User erledigt die Lernquest; der Quest-Button zeigt `Erledigt` und ist deaktiviert.
4. Der Mock stellt den Serverzustand auf "Reset abgelaufen".
5. Der Auto-Refresh des Dashboards ruft `GET /api/user/game-state` erneut ab.
6. Playwright prüft sichtbar im Browser:

   * `0 / 3000 ml`
   * `+250 ml` und `+500 ml` sind aktiv
   * `30 Minuten lernen` hat wieder den Button `Erledigen`
   * `0/2` Quests sind erledigt
   * Es wurde kein zweiter Login ausgeführt.

Ausführung:

```bash
cd frontend
npm run test:e2e -- daily-reset.spec.ts
```

Manueller Kurztest ohne 24 Stunden Wartezeit:

* Automatisiert: den obigen Playwright-Test starten. Er mockt den abgelaufenen Reset und prüft den sichtbaren Browserzustand.
* Echte App lokal: Backend nur temporär mit `palhabit.daily-reset-interval=PT1M` starten, im Dashboard eine Quest oder Wasser erledigen, mindestens eine Minute warten und den Auto-Refresh abwarten.
* Das Dashboard fragt den Spielstand regelmäßig neu ab; dadurch wird der Reset kurz nach Ablauf des Intervalls sichtbar, ohne dass der User neu einloggen muss.
* Wichtig: Die eingecheckte Dev-Konfiguration bleibt auf `PT24H`.

## Testfall DR-01: Buttons vor Ablauf bleiben erledigt

**Vorbedingung**

* User ist eingeloggt.
* Wasserstand ist `3000 / 3000 ml`.
* Wasser-Task ist erledigt.
* Mindestens eine normale Quest ist erledigt.
* Reset-Intervall ist noch nicht abgelaufen.

**Schritte**

1. Dashboard neu laden oder Session wiederherstellen.
2. Wasserkarte prüfen.
3. Normale Questkarte prüfen.

**Erwartetes Ergebnis**

* Wasserkarte zeigt `3000 / 3000 ml`.
* Wasser-Buttons `+250 ml` und `+500 ml` sind deaktiviert.
* Normale Quest zeigt `Task erledigt`.
* Quest-Button zeigt `Erledigt` und ist deaktiviert.
* Anmelde-Serie bleibt unverändert, wenn der Login am selben UTC-Tag erfolgt.

## Testfall DR-02: Buttons nach Reset-Intervall werden ohne neuen Login offen

**Vorbedingung**

* User hat am Vortag oder vor dem temporär gesetzten Kurztest-Intervall Tasks abgeschlossen.
* Backend ist für den manuellen Kurztest temporär z. B. mit `palhabit.daily-reset-interval=PT1M` konfiguriert.
* Seit dem letzten Reset-Anker ist mindestens das konfigurierte Intervall vergangen.

**Schritte**

1. User bleibt im Dashboard eingeloggt.
2. Mindestens eine Minute warten.
3. Auto-Refresh des Dashboards abwarten.
4. Wasserkarte prüfen.
5. Normale Questkarte prüfen.

**Erwartetes Ergebnis**

* Wasserstand ist `0 / 3000 ml`.
* Wasser-Buttons `+250 ml` und `+500 ml` sind aktiv.
* Normale Quest zeigt `Offen im Tagesplan`.
* Quest-Button zeigt `Erledigen` und ist aktiv.
* Quest-Fortschritt zeigt wieder `0/n`.

## Testfall DR-03: Anmelde-Serie erhöht sich am Folgetag

**Vorbedingung**

* User hatte zuletzt gestern nach UTC einen erfolgreichen Login.
* Aktuelle Streak ist `2`.
* Neuer Login erfolgt heute nach UTC.

**Schritte**

1. User meldet sich erfolgreich an.
2. Dashboard öffnet sich.
3. Metrik `Anmelde-Serie` prüfen.

**Erwartetes Ergebnis**

* Backend liefert `streak=3`.
* Frontend zeigt in der Metrik `Anmelde-Serie` den Wert `3`.

## Testfall DR-04: Reset-Intervall ohne neuen UTC-Tag

**Vorbedingung**

* Kurztest-Reset-Intervall ist temporär z. B. `PT1M`.
* Letzter Login war vor mindestens einer Minute, aber am selben UTC-Tag.
* Aktuelle Streak ist `2`.

**Schritte**

1. User bleibt im Dashboard eingeloggt.
2. Mindestens eine Minute warten.
3. Dashboard prüfen.

**Erwartetes Ergebnis**

* Wasser und Quest-Buttons sind zurückgesetzt.
* Anmelde-Serie bleibt `2`, weil kein neuer UTC-Tag erreicht wurde.

## Testfall DR-05: Verpasster Tag setzt Serie zurück

**Vorbedingung**

* Letzter Login war älter als gestern nach UTC.
* Aktuelle Streak ist größer als `1`.

**Schritte**

1. User meldet sich erneut an.
2. Dashboard prüfen.

**Erwartetes Ergebnis**

* Backend liefert `streak=1`.
* Frontend zeigt `Anmelde-Serie` mit `1`.
* Tageswerte sind ebenfalls zurückgesetzt, wenn das Reset-Intervall erreicht ist.
