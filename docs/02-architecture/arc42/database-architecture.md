# Datenbank Architektur

Diese Sicht ergänzt die arc42-Bausteinsicht um die Persistenzstruktur des
Projekts. Sie beschreibt den aktuellen Stand der Abgabe: Die Anwendung speichert
Benutzer, Pal-Fortschritt, Tagesaufgaben, Wassertracking und Statistikdaten
in PostgreSQL. Für automatisierte Backend-Tests wird statt PostgreSQL eine
H2-In-Memory-Datenbank verwendet.

Die Persistenzstruktur ist zusätzlich in
[Datenbank Architektur](database-architecture.md)
dokumentiert.

## Zweck

Die Datenbank bildet den persistenten Kern der Anwendung. Während das Frontend
den aktuellen Zustand anzeigt und das Backend die Geschäftslogik ausführt,
sorgt die Datenbank dafür, dass Benutzerkonten, Spielfortschritt und erledigte
Aufgaben dauerhaft gespeichert werden.

Persistiert werden vor allem:

- Benutzerkonten mit Passwort-Hash
- aktuelles Pal bzw. Ei-Zustand eines Benutzers
- Level, Erfahrungspunkte, Glücklichkeit, Hunger und Streak
- täglicher Wasserstand
- Tagesaufgaben und deren Abschlussstatus
- einfache Nutzungsstatistiken
- Pal-Stammdaten inklusive Evolutionsbeziehungen

## Hauptmuster

| Muster                         | Umsetzung im Projekt                                                                  | Nutzen                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Relationale Datenbank          | PostgreSQL als produktive Datenbank im Docker-Compose-Setup.                          | Robuste Persistenz und klare Beziehungen zwischen Datensätzen. |
| JPA/Hibernate-Persistenz       | Das Spring-Boot-Backend greift über Spring Data JPA auf die Datenbank zu.             | Fachlogik arbeitet mit Java-Objekten statt direktem SQL.       |
| Repository Pattern             | Datenzugriff wird in Repository-Klassen gekapselt.                                   | Services müssen keine SQL-Details kennen.                      |
| Entity Mapping                 | Tabellen werden auf Backend-Entities abgebildet.                                     | Datenmodell und Fachmodell bleiben nachvollziehbar verbunden.  |
| Testdatenbank                  | H2-In-Memory-Datenbank im Testprofil.                                                 | Tests laufen unabhängig von lokaler PostgreSQL-Installation.   |
| Seed-/Schema-Struktur          | `db/prisma/schema.prisma` und `db/prisma/seed.ts` dokumentieren Schema und Seed-Daten. | Datenmodell ist zusätzlich explizit nachvollziehbar.            |
| Docker Volume                  | PostgreSQL-Daten liegen im Docker-Volume `db_data`.                                  | Daten bleiben zwischen Container-Neustarts erhalten.           |
| Reset über Compose             | `docker compose down -v` entfernt auch das Datenbank-Volume.                          | Demo- und Testzustand kann sauber zurückgesetzt werden.         |

## Schichten im Backend

Das Backend ist in klar getrennte Verantwortungsbereiche gegliedert:

- Controller: HTTP-Endpunkte und Request-/Response-Verarbeitung
- Services: fachliche Abläufe und Anwendungslogik
- Repositories: Zugriff auf persistente Daten
- Externe Clients: Zugriff auf PalAPI und Wetter-API
- DTOs: Datentransfer zwischen API und Anwendung

Diese Struktur unterstützt die Testbarkeit, da Services isoliert getestet werden können und externe Systeme über Adapter beziehungsweise Clients gekapselt sind.

## Struktur

```text
Projekt-Root
|-- docker-compose.yml
|-- backend
|   `-- src
|       |-- main
|       |   `-- java
|       |       `-- ...
|       `-- test
|-- db
|   |-- prisma
|   |   |-- migrations
|   |   |-- schema.prisma
|   |   `-- seed.ts
|   |-- package.json
|   |-- prisma.config.ts
|   `-- tsconfig.json
```

## Datenbank im Docker-Setup

Die PostgreSQL-Datenbank wird als eigener Service im Docker-Compose-Setup
gestartet. Das Backend verbindet sich innerhalb des Docker-Netzwerks über den
Service-Namen `db`.

| Eigenschaft     | Wert                               |
| --------------- | ---------------------------------- |
| Datenbank-Image | `postgres:16-alpine`               |
| Datenbankname   | `sqs_db`                           |
| Interner Port   | `5432`                             |
| Lokaler Port    | `5433`                             |
| JDBC-URL intern | `jdbc:postgresql://db:5432/sqs_db` |
| Docker-Volume   | `db_data:/var/lib/postgresql/data` |

Lokal kann die Datenbank deshalb über `localhost:5433` erreicht werden, während
das Backend im Container die Datenbank über `db:5432` anspricht.

## Zentrale Tabellen

| Tabelle      | Zweck                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| `users`      | Speichert Benutzerkonto, Passwort-Hash und aktuellen Spielfortschritt. |
| `pal`    | Enthält Pal-Stammdaten, Sprite-URL und Evolutionsbeziehungen.      |
| `tasks`      | Enthält die verfügbaren Tagesaufgaben.                                 |
| `user_tasks` | Verknüpft Benutzer mit Aufgaben und speichert den Abschlussstatus.      |
| `user_stats` | Speichert einfache Nutzungsstatistiken pro Benutzer.                   |

## Wichtige Beziehungen

| Beziehung                                | Bedeutung                                       |
| ---------------------------------------- | ----------------------------------------------- |
| `users.current_pal_id -> pal.id` | Aktuelles Pal eines Benutzers.              |
| `users.egg_pal_id -> pal.id`     | Pal, das sich noch im Ei-Zustand befindet.  |
| `pal.evolution_id -> pal.id`     | Selbstreferenz für Pal-Entwicklungen.       |
| `user_stats.user_id -> users.id`         | 1:1-Statistikdaten zu einem Benutzer.           |
| `user_tasks.user_id -> users.id`         | Aufgabenstatus gehört zu einem Benutzer.        |
| `user_tasks.task_id -> tasks.id`         | Aufgabenstatus verweist auf eine Aufgabe.       |

Die Tabelle `user_tasks` besitzt zusätzlich eine eindeutige Kombination aus
`user_id` und `task_id`. Dadurch kann dieselbe Aufgabe pro Benutzer nur einmal
als Statusdatensatz existieren.

## Verantwortlichkeiten

| Bereich                   | Verantwortung                                                                    |
| ------------------------- | -------------------------------------------------------------------------------- |
| PostgreSQL                | Persistente Speicherung der produktiven Demo-Daten.                              |
| Docker Compose            | Startet Datenbank, Backend und Frontend gemeinsam mit passenden Umgebungswerten. |
| Docker Volume `db_data`   | Hält Datenbankdaten über Container-Neustarts hinweg.                             |
| Spring Data JPA           | Kapselt den Datenbankzugriff im Backend.                                         |
| Backend-Services          | Enthalten Geschäftsregeln wie Login, Questabschluss, Wassertracking und Level-Fortschritt. |
| Backend-Entities          | Bilden Tabellen und Beziehungen im Java-Code ab.                                 |
| Repository-Klassen        | Stellen CRUD- und Suchoperationen für Services bereit.                           |
| `db/prisma/schema.prisma` | Dokumentiert das relationale Schema zusätzlich auf Prisma-Ebene.                 |
| `db/prisma/seed.ts`       | Enthält Seed-Logik für Stammdaten und Demo-/Initialdaten.                        |
| H2-Testdatenbank          | Ermöglicht schnelle und isolierte Backend-Tests ohne externe Datenbank.          |

## Datenfluss

```text
Nutzeraktion im Frontend
  -> Angular-Komponente
  -> AppStateService
  -> BackendApiService
  -> Spring-Boot-Controller
  -> Backend-Service
  -> Repository
  -> PostgreSQL
  -> Entity / DTO
  -> BackendApiService
  -> AppStateService
  -> Angular Signals
  -> Template aktualisiert sich
```
Die Datenbank wird nicht direkt vom Frontend angesprochen. Alle Änderungen laufen
über das Backend. Dadurch bleiben Validierung, Geschäftsregeln und Persistenz an
einer zentralen Stelle.

## Persistierte Fachzustände

| Fachzustand          | Speicherung im Datenmodell                                             |
| -------------------- | ---------------------------------------------------------------------- |
| Benutzerkonto        | `users.username`, `users.password_hash`                                |
| Session-/Login-Bezug | Persistenter Benutzerstand; aktive Session wird vom Backend/Client behandelt. |
| Pal-Zustand      | `current_pal_id`, `egg_pal_id`, `is_egg`                       |
| Fortschritt          | `pal_level`, `pal_xp`, `happiness`, `streak`                   |
| Pflegewerte          | `hydration_ml`, `hunger`, `pending_feed_points`                        |
| Tageslogik           | `last_task_completion_date`, `last_daily_reset_at`                     |
| Aufgaben             | `tasks` und `user_tasks.completed`                                     |
| Statistik            | `user_stats.total_logins`, `total_happiness_gained`, `last_login`      |
| Pal-Stammdaten   | `pal.name`, `image_url`, `evolution_id`, `evolution_stage`         |

## Testbetrieb

Für Backend-Tests wird eine H2-In-Memory-Datenbank verwendet. Dadurch benötigen
Unit- und Integrationstests keine laufende PostgreSQL-Instanz. Das Testprofil
erstellt das Schema für den Testlauf neu und verwirft die Daten anschließend
wieder.

```text
Teststart
  -> Spring-Testprofil
  -> H2-In-Memory-Datenbank
  -> Schema wird für den Testlauf erzeugt
  -> Test führt Repository-/Service-/Controller-Logik aus
  -> Daten werden nach dem Testlauf verworfen
```
Das trennt produktionsnahe Persistenz im Docker-Setup von schnellen,
reproduzierbaren Tests in der CI/CD-Pipeline.

## Zugriff für lokale Entwicklung

Die Datenbank ist lokal über den veröffentlichten Port erreichbar:

```text
Host: localhost
Port: 5433
Database: sqs_db
User: sqs_user
Password: sqs_password
```
Diese Zugangsdaten sind ausschließlich für das lokale Docker-Demo-Setup gedacht und nicht für einen produktiven Betrieb vorgesehen.
Beispiel für eine JDBC-Verbindung von außen:
```text
jdbc:postgresql://localhost:5433/sqs_db
```
Innerhalb des Docker-Netzwerks verwendet das Backend dagegen:
```text
jdbc:postgresql://db:5432/sqs_db
```
## Bewusst nicht gemacht
| Thema                                      | Entscheidung                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Direkter Datenbankzugriff aus dem Frontend | Das Frontend kommuniziert ausschließlich mit dem Backend.                                |
| Produktive Benutzerverwaltung mit Rollen   | Für die Projektgröße reicht ein einfacher Demo-Login mit Passwort-Hashing.               |
| Komplexes Migrationskonzept im Backend     | Das Schema bleibt überschaubar; Prisma-Schema und JPA-Modell dokumentieren die Struktur. |
| Externe produktive Cloud-Datenbank         | Für Abgabe und Demo genügt PostgreSQL im Docker-Compose-Setup.                           |
| Persistente Testdatenbank                  | Tests verwenden H2, damit sie schnell und unabhängig laufen.                             |
| Vollständiges Audit-Logging                | Für die Demo werden nur fachlich relevante Zeitpunkte und Statistikwerte gespeichert.    |

