# Querschnittliche Konzepte

Dieses Kapitel beschreibt technische und organisatorische Konzepte, die mehrere
Bausteine der Anwendung betreffen. Dazu gehören Authentifizierung,
Fehlerbehandlung, Logging, Validierung, API-Konventionen, Teststrategie,
Dependency Injection, externe Services und Code Style.

## Authentifizierung und Autorisierung

Das Backend arbeitet mit serverseitigen Sessions. Nach erfolgreichem Login wird
eine Session erzeugt und über ein Session-Cookie mit dem Browser verknüpft. Das
Frontend sendet API-Anfragen mit Credentials, damit dieses Cookie bei weiteren
Requests automatisch mitgeschickt wird.

Passwörter werden nicht im Browser gespeichert. Im Backend werden Passwörter
nicht im Klartext persistiert, sondern gehasht gespeichert. Dadurch bleiben
Passwörter auch bei einem Datenbankzugriff geschützt.

Geschützte Endpunkte prüfen, ob eine gültige Session vorhanden ist. Öffentliche
Endpunkte wie Registrierung und Login sind ohne bestehende Session erreichbar.
Fachliche Daten wie Tasks, Wasserstand, Punkte und Pal-Fortschritt sind an
den angemeldeten Nutzer gebunden.

## Fehlerbehandlung

Fehler werden bewusst auf Backend- und Frontend-Ebene behandelt.

Im Backend liefern Controller passende HTTP-Statuscodes und kurze, verständliche
Fehlermeldungen. Fachliche Fehler, zum Beispiel ungültige Eingaben oder nicht
gefundene Ressourcen, werden von technischen Fehlern getrennt. Dadurch kann das
Frontend angemessen reagieren.

Im Frontend werden technische Fehler in verständliche UI-Meldungen übersetzt.
Die Nutzer sollen nicht mit Stacktraces oder internen Fehlermeldungen
konfrontiert werden. Stattdessen werden klare Hinweise angezeigt, zum Beispiel
bei fehlgeschlagenem Login, ungültigen Eingaben oder nicht erreichbaren Diensten.

Externe Dienste werden defensiv angebunden. Der Zugriff auf die PalAPI verwendet
kurze Verbindungs- und Request-Timeouts. Außerdem ist die Anwendung nicht davon
abhängig, dass externe APIs dauerhaft verfügbar sind. Wenn PalAPI beim
Registrieren nicht antwortet, wird der Nutzer trotzdem angelegt und die App nutzt
lokale Starter-Daten als Fallback.

## Logging

Logging dient der Nachvollziehbarkeit technischer Abläufe, ohne sensible Daten
offenzulegen.

Das Backend protokolliert relevante technische Ereignisse, zum Beispiel Fehler
bei externen API-Aufrufen oder unerwartete Serverfehler. Sensible Informationen
wie Passwörter, Session-Cookies oder personenbezogene Daten werden nicht geloggt.

## Validierung

Eingaben werden an mehreren Stellen validiert.

Im Frontend werden Formulareingaben früh geprüft, damit Nutzer direktes Feedback
erhalten. Dazu gehören zum Beispiel Pflichtfelder, einfache Plausibilitätsregeln
und Fehlermeldungen bei ungültigen Eingaben.

Im Backend findet die verbindliche Validierung statt. Das Backend darf sich nicht
darauf verlassen, dass das Frontend korrekte Daten sendet. Deshalb werden
kritische Eingaben wie Registrierungsdaten, Login-Daten, Task-Aktionen und
Wassertracking serverseitig geprüft.

Diese doppelte Validierung verbessert sowohl die Nutzerfreundlichkeit als auch
die Sicherheit der Anwendung.

## API-Konventionen

Die Kommunikation zwischen Frontend und Backend erfolgt über REST-Endpunkte unter
dem gemeinsamen `/api`-Pfad. Das Frontend greift nicht direkt auf die Datenbank
zu, sondern ausschließlich über die Backend-API.

API-Antworten verwenden JSON. Erfolgreiche Anfragen liefern fachliche Daten oder
Bestätigungen zurück. Fehlerhafte Anfragen verwenden passende HTTP-Statuscodes,
zum Beispiel für ungültige Eingaben, fehlende Authentifizierung oder nicht
gefundene Ressourcen.

Die API ist so aufgebaut, dass Frontend und Backend klar getrennt bleiben. Das
Frontend kennt keine Persistenzdetails und das Backend ist unabhängig von der
konkreten Darstellung im Browser.

## Zustandsverwaltung im Frontend

Der zentrale UI-Zustand liegt im Angular-Service `AppStateService`. Dort werden
Nutzer, Tasks, Wasserstand, Pal, Feedback und Session-Restore
zusammengeführt.

Reine Fachlogik wird möglichst aus Komponenten ausgelagert. Dadurch bleiben
Komponenten schlanker und die Logik kann ohne Angular-Rendering getestet werden.
Das verbessert Wartbarkeit und Testbarkeit.

## Dependency Injection

Backend und Frontend nutzen Dependency Injection, um Abhängigkeiten explizit und
testbar zu machen.

Im Backend werden Services, Repositories und Controller über Spring verwaltet.
Dadurch können fachliche Services unabhängig von Controller-Logik getestet
werden. Externe Zugriffe, zum Beispiel auf PalAPI, sind gekapselt und können im
Testprofil ersetzt oder deaktiviert werden.

Im Frontend werden Angular-Services verwendet, um API-Zugriffe und
Zustandsverwaltung von Komponenten zu trennen. Komponenten müssen dadurch nicht
wissen, wie Daten technisch geladen oder gespeichert werden.

## Umgang mit externen Services

Die Anwendung nutzt externe Dienste für Pal- und Wetterdaten. Diese Dienste
werden als optionale Integrationen behandelt und dürfen die Kernfunktion der App
nicht blockieren.

Für PalAPI existiert ein lokaler Fallback-Katalog. Dadurch kann die Registrierung
auch dann abgeschlossen werden, wenn der externe Dienst nicht erreichbar ist.
Im Testprofil werden externe API-Aufrufe deaktiviert oder gegen lokale
Testadressen ersetzt, damit Tests reproduzierbar und unabhängig vom Netzwerk
laufen.

Wetterdaten beeinflussen nur die Darstellung im Dashboard. Wenn Wetterdaten
nicht geladen werden können, bleibt die Anwendung weiterhin nutzbar.

## Teststrategie

Die Qualitätssicherung folgt einer Testpyramide.

Viele schnelle Unit-Tests prüfen Fachlogik, Services und Hilfsfunktionen.
Integrationstests sichern das Zusammenspiel von Backend, Persistenz und API ab.
Frontend-Tests prüfen Komponentenlogik und UI-Verhalten. Playwright-E2E-Tests
decken sichtbare Nutzerflüsse im Browser ab.

Zusätzlich werden statische Prüfungen eingesetzt:

- Checkstyle für Java-Code-Konventionen
- SpotBugs zur Erkennung möglicher Fehlerquellen
- ArchUnit zur Prüfung architektonischer Regeln
- ESLint für TypeScript- und Angular-Code
- npm audit und Lockfile-Tests zur Prüfung von Frontend-Abhängigkeiten

## Code Style und Wartbarkeit

Das Projekt verwendet einheitliche Code-Konventionen für Backend und Frontend.
Ziel ist, dass Code auch für andere Teammitglieder verständlich und wartbar
bleibt.

Im Backend werden Verantwortlichkeiten getrennt: Controller behandeln HTTP,
Services enthalten Fachlogik und Repositories kapseln Persistenzzugriffe.
Im Frontend werden Komponenten, Services und reine Logik getrennt gehalten.

Kommentare werden sparsam eingesetzt. Sie erklären nicht offensichtliche
Entscheidungen, Workarounds oder fachliche Besonderheiten. Allgemein
verständlicher Code soll durch klare Namen und einfache Struktur lesbar sein.

## Dokumentation

Die Architektur wird in der Projektdokumentation nach arc42 beschrieben.
Wichtige Architekturentscheidungen werden als ADRs dokumentiert. API-Verträge
liegen unter `docs/03-api/`. Der Docker-Start und die lokale Qualitätssicherung
sind in der Root-README und in `quality/README.md` beschrieben.

Damit sind zentrale technische Entscheidungen nicht nur im Code vorhanden,
sondern auch für Prüfer und Teammitglieder nachvollziehbar dokumentiert.