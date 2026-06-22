# Backend-Komponentenarchitektur

Diese Sicht ergänzt die arc42-Bausteinsicht um die technische Struktur des
Spring-Boot-Backends. Sie beschreibt, wie HTTP-Endpunkte, fachliche Logik,
Persistenzzugriff, externe Backend-Dienste und Datenübertragung im Backend
getrennt sind.

## Zweck

Das Backend bildet die zentrale Anwendungsschicht von PalHabit. Während das
Frontend Benutzeraktionen auslöst und den aktuellen Zustand anzeigt, verarbeitet
das Backend Authentifizierung, Questabschluss, Wassertracking, Pal-Fortschritt
und Datenpersistenz.

Die Backend-Komponenten sorgen dafür, dass:

* HTTP-Anfragen kontrolliert entgegengenommen werden,
* fachliche Regeln zentral in Services umgesetzt werden,
* Datenbankzugriffe über Repositories gekapselt sind,
* externe Backend-Dienste wie die PalAPI austauschbar angebunden werden,
* DTOs die API-Kommunikation vom internen Datenmodell trennen,
* automatisierte Tests einzelne Komponenten gezielt prüfen können.

## Schichten im Backend

| Schicht         | Verantwortung                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Controller      | Stellen REST-Endpunkte bereit, validieren Eingaben und delegieren an Services.                                              |
| Services        | Enthalten die zentrale Anwendungslogik für Authentifizierung, Aufgaben, Wassertracking, Spielstand und Pal-Fortschritt. |
| Repositories    | Kapseln den Zugriff auf persistente Daten über Spring Data JPA.                                                             |
| Entities        | Bilden Tabellen und Beziehungen des Datenmodells im Java-Code ab.                                                           |
| DTOs            | Definieren API-Verträge für Requests und Responses.                                                                         |
| Externe Clients | Kapseln den Zugriff auf externe Backend-Dienste wie die PalAPI.                                                            |
| Konfiguration   | Bündelt Security-, CORS-, Datenbank- und externe API-Konfiguration.                                                         |

## Feature-Bausteine

| Baustein       | Verantwortung                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Authentication | Registrierung, Login, Passwort-Hashing, Session-/Token-Bezug und Demo-Seed.                    |
| User           | Benutzerkonto, Account-Löschung und benutzerbezogene Daten.                                    |
| Tasks          | Tagesaufgaben, Abschlussstatus und tägliche Questlogik.                                        |
| Watertracking  | Erfassung des täglichen Wasserstands und Auswirkung auf den Spielstand.                        |
| Game State     | Zusammenführung von Aufgaben, Pflegewerten, Pal-Zustand und Fortschritt für das Dashboard. |
| Pal        | Starter-Pal, Ei-Zustand, Level, XP, Entwicklung und PalAPI-Fallback.                      |
| Persistence    | Speicherung und Abfrage von Nutzern, Tasks, UserTasks, UserStats und Pal-Stammdaten.       |

## Typischer Request-Ablauf

```text
Frontend
  -> REST-Controller
  -> Service
  -> Repository
  -> Datenbank
  -> Entity
  -> Service
  -> DTO
  -> REST-Response
  -> Frontend
```

Dadurch greift das Frontend nie direkt auf die Datenbank zu. Geschäftsregeln
liegen im Backend-Service und nicht in der UI oder in SQL-Skripten.

## Beispielhafte Zuordnung

| Komponente                                          | Rolle                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| AuthController                                      | Primärer Adapter für Registrierung und Login.                           |
| TaskController                                      | Primärer Adapter für Tagesaufgaben und Questabschluss.                  |
| UserController                                      | Primärer Adapter für benutzerbezogene Aktionen.                         |
| PalController                                   | Primärer Adapter für Pal- und Fortschrittsdaten.                    |
| AuthService / UserService                           | Anwendungskern für Benutzer- und Authentifizierungslogik.               |
| TaskService                                         | Anwendungskern für Aufgaben, Abschlussstatus und Tageslogik.            |
| PalService                                      | Anwendungskern für Pal-Fortschritt, Starterdaten und Fallbacklogik. |
| UserRepository / TaskRepository / PalRepository | Sekundäre Adapter für Datenbankzugriffe.                                |
| PalAPI-Client                                      | Sekundärer Adapter für externe Pal-Daten.                           |
| DTOs                                                | Trennen externe API-Verträge vom internen Entity-Modell.                |

## Architekturprinzipien

Das Backend folgt einer mehrschichtigen Architektur mit hexagonalen Elementen.
Controller, Repositories und externe Clients sind technische Adapter um die
fachliche Service-Schicht herum.

Wichtig ist dabei:

* Controller enthalten keine Geschäftslogik.
* Services greifen nicht auf HTTP-Details des Frontends zu.
* Repositories kapseln Datenbankzugriffe.
* Externe APIs werden über eigene Clients angebunden.
* DTOs verhindern, dass interne Entities ungefiltert als API-Vertrag dienen.
* Tests können Services, Controller und externe Clients getrennt prüfen.

## Testbarkeit

Die Komponentenstruktur unterstützt automatisierte Tests:

| Testart                       | Geprüfter Bereich                                            |
| ----------------------------- | ------------------------------------------------------------ |
| Service-Tests                 | Fachlogik ohne echte HTTP-Anfragen.                          |
| Controller-/Web-Tests         | REST-Endpunkte, Statuscodes und Request-/Response-Verhalten. |
| Repository-/Integrationstests | Zusammenspiel mit der Testdatenbank.                         |
| PalAPI-Client-Tests          | Timeout, Fehlerfälle und lokaler Fallback über HTTP-Stub.    |
| ArchUnit-Tests                | Einhaltung der Schichten und Architekturregeln.              |

Für Backend-Tests wird eine H2-In-Memory-Datenbank verwendet. Details zur
Persistenzstruktur stehen in
[Datenbankarchitektur](database-architecture.md).

## Bewusst nicht gemacht

| Thema                                       | Entscheidung                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Vollständig strenge Hexagonal Architecture  | Für die Projektgröße genügt eine mehrschichtige Architektur mit hexagonalen Elementen. |
| Direkter Repository-Zugriff aus Controllern | Controller delegieren an Services, damit Geschäftslogik zentral bleibt.                |
| Direkter Datenbankzugriff aus dem Frontend  | Das Frontend kommuniziert ausschließlich mit dem Backend.                              |
| Komplexes Rollen- und Rechtemodell          | Für die Demo reicht eine einfache Benutzer- und Authentifizierungslogik.               |
| Produktiver externer API-Zwang              | Die PalAPI ist angebunden, aber durch lokale Fallback-Daten abgesichert.              |
