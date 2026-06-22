# Kontext und Abgrenzung

PalHabit ist die Web-App, die wir für die SQS-Semesterarbeit gebaut haben. Im
Kern geht es um tägliche Quests, Wassertracking und einen Pal-Partner, der
durch erledigte Aufgaben Fortschritt bekommt.

Zum eigenen System zählen das Angular-Frontend, das Spring-Boot-Backend, die
PostgreSQL-Datenbank und der Quality Hub für die lokale Qualitätssicherung.
Externe Nachbarsysteme sind die PalAPI für Pal-Daten und Open-Meteo für
Wetterdaten.

## Kontextdiagramm

Die Kontextsicht grenzt PalHabit von externen Kommunikationspartnern ab. Sie
zeigt Nutzer, das eigene System und die externen Dienste, mit denen PalHabit
kommuniziert.

![C4 Level 1 - System Context](../diagrams/mermaid/c4-level-1-system-context.svg)

Eine zusammengefasste Übersicht über Kontext-, Container-, Komponenten- und
Deployment-Sicht befindet sich zusätzlich im C4-Gesamtdiagramm:

![C4 Diagram - PalHabit](../diagrams/c4-diagram.svg)

## Fachlicher Kontext

| Nachbar                  | Beziehung                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Nutzer                   | Nutzt die Browseroberfläche für Login, Registrierung, Quests, Wassertracking, Wetteranzeige, Pal-Fortschritt und Account-Löschung. |
| PalAPI / Pal-Bilder | Liefert Pal-Daten, Namen und Bildquellen für den Pal-Partner.                                                                  |
| Open-Meteo               | Liefert Wetterdaten für die Szene im Dashboard.                                                                                        |
| SQS-Bewertung            | Prüft den Stand über Dokumentation, Docker-Start, Tests, Quality Hub, C4-Diagramme und Architekturentscheidungen.                      |

## Technischer Kontext

| Schnittstelle                           | Beschreibung                                                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser -> Angular-Frontend             | Lädt die Angular-App; im Docker-Setup wird das Frontend über Nginx bereitgestellt.                                                                  |
| Angular-Frontend -> Spring-Boot-Backend | Ruft REST-Endpunkte für Authentifizierung, Tasks, User-Daten, Wassertracking, Wetterdaten und Pal-Fortschritt auf.                              |
| Spring-Boot-Backend -> PostgreSQL       | Speichert Benutzer, Tasks, Aufgabenstatus, Fortschritt, Wasserstand, Streak, Starter-Pal und Pal-Zustand.                                   |
| Spring-Boot-Backend -> PalAPI          | Holt bei Bedarf Pal-Daten, Namen und Artwork. Bei Timeout oder Fehlern greift ein lokaler Fallback.                                             |
| Spring-Boot-Backend -> Open-Meteo       | Holt Wetterdaten für die Dashboard-Szene. Bei Fehlern liefert das Backend einen Fallback-Zustand oder die App bleibt mit lokalem Zustand benutzbar. |
| Quality Runner -> Projekt               | Führt Maven-, npm-, Vitest-, ESLint-, SpotBugs-, Checkstyle-, npm-audit- und Playwright-Checks aus.                                                 |
| Quality Hub -> Quality Output           | Liest `report.json`, Logs und HTML-Reports aus dem Docker-Volume und stellt sie im Browser dar.                                                     |

## Abgrenzung des Systems

Innerhalb des Systems liegen:

* Angular-Frontend
* Spring-Boot-Backend
* PostgreSQL-Datenbank
* Quality Hub und Quality Runner
* Docker-Compose-Konfiguration
* lokale Demo- und Testdaten

Außerhalb des Systems liegen:

* Nutzerbrowser als Zugriffsumgebung
* PalAPI als externer Pal-Dienst
* Open-Meteo als externer Wetterdienst
* GitHub als Repository- und CI-Plattform
* ReadTheDocs als Veröffentlichungsplattform der Dokumentation

## Nicht im Scope

* Öffentliches Produktivhosting mit eigener Domain und TLS.
* Externer Login-Anbieter wie Google, GitHub oder Microsoft.
* Native Mobile-App.
* Produktives Rollen- und Rechtemodell.
* Vollständige Tageshistorie mit append-only Task-Completions.
* Hochverfügbare Cloud-Datenbank.
