# ADR-011: Playwright für End-to-End-Tests verwenden

## Status

Akzeptiert

## Kontext

Unit- und Integrationstests prüfen einzelne Bestandteile der Anwendung. Für die
Qualität der Gesamtanwendung reicht das jedoch nicht aus.

PalHabit soll auch aus Benutzersicht getestet werden. Wichtige Abläufe sind zum
Beispiel Registrierung, Login, Dashboard-Anzeige, Tagesquests, Wassertracking und
Daily Reset.

Diese Abläufe betreffen Frontend, Backend und API-Kommunikation gleichzeitig.

## Entscheidung

Wir verwenden Playwright für browserbasierte End-to-End-Tests.

Die Tests prüfen zentrale User-Flows gegen die laufende Anwendung und dienen als
Nachweis, dass Frontend und Backend gemeinsam funktionieren.

## Alternativen

- Keine End-to-End-Tests
- Manuelle Tests
- Selenium
- Cypress
- Playwright

## Konsequenzen

- Kritische Benutzerabläufe werden automatisiert geprüft.
- Fehler in Routing, API-Kommunikation, Authentifizierung oder UI-Zustand können
  früher erkannt werden.
- Die Tests ergänzen Backend- und Frontend-Unit-Tests um eine realistische
  Benutzersicht.
- Die Ergebnisse können im Quality-Workflow sichtbar gemacht werden.
- Die Anwendung wird nicht nur technisch, sondern auch fachlich überprüft.

## Nachteile

- End-to-End-Tests sind langsamer als Unit-Tests.
- Sie benötigen eine kontrollierte Testumgebung.
- Testdaten und Mock-Daten müssen stabil vorbereitet werden.
- Zu viele E2E-Tests können wartungsintensiv werden.