# ADR-009: Authentifizierungsstrategie für geschützte Benutzerfunktionen

## Status

Akzeptiert

## Kontext

PalHabit enthält Funktionen, die eindeutig zu einem bestimmten Benutzer gehören.
Dazu zählen Tagesquests, Wassertracking, Quest-Punkte, Pal-Fortschritt und
persönliche Fortschrittsdaten.

Diese Daten dürfen nicht öffentlich abrufbar sein. Gleichzeitig soll die
Authentifizierung für die Semesterarbeit verständlich, testbar und gut in das
Spring-Boot-Backend integrierbar sein.

## Entscheidung

Wir verwenden eine serverseitig abgesicherte Authentifizierung über Spring
Security. Öffentliche Endpunkte sind nur dort erlaubt, wo sie fachlich notwendig
sind, zum Beispiel für Registrierung.

Geschützte Endpunkte dürfen nur mit gültigem Login-Zustand verwendet werden.

## Alternativen

- Keine Authentifizierung
- HTTP Basic Auth
- JWT-basierte Authentifizierung
- Session-basierte Authentifizierung mit Spring Security

## Konsequenzen

- Benutzerbezogene Daten sind vor unberechtigtem Zugriff geschützt.
- Security-Tests können prüfen, dass geschützte Endpunkte ohne Anmeldung nicht
  erreichbar sind.
- Frontend und Backend müssen den Authentifizierungszustand konsistent behandeln.
- E2E-Tests müssen echte Login-Flows berücksichtigen.
- Die Sicherheitslogik wird Teil der überprüfbaren Qualitätssicherung.

## Nachteile

- Die Implementierung ist komplexer als eine rein öffentliche API.
- Tests benötigen teilweise vorbereitete Benutzer oder Login-Schritte.
- Fehlerhafte Security-Konfiguration kann dazu führen, dass Endpunkte zu offen
  oder zu restriktiv sind.