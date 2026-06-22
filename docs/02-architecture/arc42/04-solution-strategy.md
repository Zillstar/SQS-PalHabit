# Lösungsstrategie

Die Lösung ist bewusst überschaubar gehalten: Die App soll in der Demo direkt
benutzbar sein, und die Qualitätssicherung soll nicht nur in einzelnen
Terminalbefehlen versteckt sein. Deshalb gibt es zusätzlich zum normalen
Docker-Start den Quality Hub.

## Strategische Entscheidungen

Die wichtigsten Architektur- und Technologieentscheidungen wurden bewusst klein,
nachvollziehbar und projektangemessen gehalten. Ziel war nicht eine maximal
komplexe Architektur, sondern eine gut testbare, lokal reproduzierbare und für
die Semesterarbeit nachvollziehbare Lösung.

| Bereich | Entscheidung | Begründung |
| --- | --- | --- |
| Frontend | Angular mit Standalone Components | Angular passt gut zu einer komponentenbasierten Web-App. Standalone Components reduzieren Modul-Komplexität und erleichtern isolierte Tests. |
| Backend | Spring Boot | Spring Boot bietet eine stabile Grundlage für REST-APIs, Dependency Injection, Tests, Security und Datenbankzugriff. |
| Kommunikation | REST-API zwischen Frontend und Backend | REST ist für die Projektgröße ausreichend, leicht nachvollziehbar und gut mit HTTP- und E2E-Tests prüfbar. |
| Persistenz | PostgreSQL im Docker-Betrieb, H2 für Tests | PostgreSQL bildet die reale Persistenz ab. H2 macht Backend-Tests schnell, unabhängig und reproduzierbar. |
| Architektur | Schichtenarchitektur mit hexagonalen Elementen | Controller, Services, Repositories und externe Clients sind getrennt. Dadurch bleibt Fachlogik testbar und technische Details können ausgetauscht werden. |
| Externe APIs | PalAPI und Wetter-API werden im Backend über gekapselte Services angebunden | Externe Abhängigkeiten werden nicht direkt in Frontend- oder Fachlogik eingebaut. Dadurch bleiben API-Schlüssel geschützt, Tests stabiler und Netzprobleme können zentral behandelt werden. |
| Lokale Ausführung | Docker Compose | Die Anwendung kann reproduzierbar mit Datenbank und Backend/Frontend gestartet werden. Das erleichtert Demo, Entwicklung und Bewertung. |
| Qualitätssicherung | Tests, CI, Sonar/Reports und Quality Hub | Qualität wird nicht nur beschrieben, sondern automatisiert ausgeführt und zentral sichtbar gemacht. |

## Architekturansatz

Das Projekt verwendet eine klassische mehrschichtige Webarchitektur mit
hexagonalen Elementen im Backend.

Die Anwendung besteht aus einem Angular-Frontend, einem Spring-Boot-Backend,
einer PostgreSQL-Datenbank sowie externen Schnittstellen zur PalAPI und zur
Wetter-API. Die Kommunikation zwischen Frontend und Backend erfolgt über eine
REST-API.

Das Frontend kommuniziert ausschließlich mit dem Backend. Externe APIs werden
nicht direkt aus dem Browser angesprochen, sondern über Backend-Services
gekapselt. Dadurch bleiben technische Details, Fehlerbehandlung und mögliche
API-Schlüssel zentral im Backend.

Im Backend sind die Verantwortlichkeiten bewusst getrennt. REST-Controller
nehmen HTTP-Anfragen entgegen und validieren die Schnittstelle nach außen.
Services enthalten die zentrale Anwendungslogik. Repositories kapseln den
Datenbankzugriff. Externe API-Clients kapseln die Kommunikation mit
Fremdsystemen.

Damit folgt das Backend keiner vollständig strengen Hexagonal Architecture,
übernimmt aber zentrale Prinzipien davon. Die fachliche Logik steht im
Mittelpunkt, während technische Details wie REST, Persistenz und externe APIs
als Adapter darum herum angeordnet sind. Controller bilden primäre Adapter,
Repositories und externe Clients sekundäre Adapter. Diese Struktur verbessert
Testbarkeit, Wartbarkeit und Austauschbarkeit einzelner Komponenten.

## Qualitätsansatz

* Unit-Tests prüfen ausgelagerte Frontend-Logik, Angular-Services und Backend-Services.
* Controller- und Integrationstests prüfen REST-Endpunkte, Authentifizierung und Zusammenspiel mit der Anwendungsschicht.
* ArchUnit, Checkstyle und SpotBugs prüfen die Backend-Struktur.
* Externe Backend-Clients für PalAPI und Wetter-API werden mit lokalen HTTP-Stubs getestet, damit Timeout, Fehlerbehandlung und Fallback ohne echte Netzabhängigkeit nachweisbar sind.
* TypeScript, ESLint und npm-Lockfile-Tests prüfen Frontend-Qualität und Supply-Chain-Risiken.
* Playwright deckt die wichtigsten Klickwege im Browser ab.
* Der Quality Hub sammelt diese Ergebnisse für die Abgabe an einer Stelle.

## Bezug zu Architecture Decision Records

Die zentralen Architekturentscheidungen wurden zusätzlich als Architecture
Decision Records dokumentiert. Dazu gehören insbesondere die Entscheidung
für Angular, Spring Boot, REST, PostgreSQL, Docker Compose, die Testpyramide und
den Quality Hub.

Die ADRs halten jeweils fest:

* den Kontext der Entscheidung,
* die getroffene Entscheidung,
* mögliche Alternativen,
* die Begründung,
* und die Konsequenzen für Entwicklung, Betrieb und Qualitätssicherung.

Dadurch sind die wichtigsten Lösungsentscheidungen nicht nur im Fließtext
beschrieben, sondern auch einzeln nachvollziehbar dokumentiert.
