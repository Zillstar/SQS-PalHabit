# Frontend-Komponentenarchitektur

Diese Sicht ergänzt die arc42-Bausteinsicht um die Angular-Struktur. Sie
beschreibt den aktuellen Stand der Abgabe: Das Frontend arbeitet nicht mehr mit
einem reinen lokalen Mock-State, sondern spricht über `BackendApiService` mit
dem Spring-Boot-Backend.

## Zweck

Das Frontend zeigt Splash-Screen, Login/Registrierung und das Dashboard mit
Tagesquests, Wassertracking, Wetter-Szene und Pal-Fortschritt. Komponenten
sollen dabei möglichst wenig Fachlogik enthalten: Sie zeigen Daten an, geben
Nutzeraktionen nach oben weiter und lassen Services die API-Aufrufe und den
zentralen Zustand koordinieren.

## Hauptmuster

| Muster                           | Umsetzung im Projekt                                                                        | Nutzen                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Standalone Components            | Komponenten deklarieren ihre Imports selbst.                                                | Lazy Loading und kleine Komponenten bleiben übersichtlich. |
| Page Components                  | `SplashPageComponent`, `AuthPageComponent`, `DashboardPageComponent`.                       | Routen entsprechen direkt den sichtbaren Nutzerwegen.      |
| Smart Page, Presentational Child | Pages injizieren Services; Child-Komponenten nutzen Inputs/Outputs.                         | API- und Zustandslogik bleibt zentral.                     |
| Facade Service                   | `AppStateService` bündelt Login, Registrierung, Quest, Wasser, Logout und Account-Löschung. | Komponenten müssen keine API-Details kennen.               |
| API Adapter                      | `BackendApiService`, `PalService` und `WeatherService` kapseln externe Aufrufe.         | Fehlerbehandlung und Mapping liegen nicht in Templates.    |
| Signals                          | Zustand und abgeleitete Werte laufen über Angular Signals und `computed`.                   | UI aktualisiert sich nachvollziehbar bei State-Änderungen. |
| Route Guards                     | `authGuard` und `guestGuard` prüfen Session/Restore.                                        | Dashboard und Auth-Seite bleiben sauber getrennt.          |

## Struktur

```text
frontend/src/app
|-- app.routes.ts
|-- core
|   |-- guards
|   |-- services
|   `-- state
|-- pages
|   |-- auth
|   |-- dashboard
|   `-- splash
`-- shared
    |-- mock
    |-- models
    `-- ui
```

## Verantwortlichkeiten

| Bereich                           | Verantwortung                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `app.routes.ts`                   | Routen, Lazy Loading, Redirects und Guards.                                      |
| `core/guards`                     | Zugriff auf `/auth` und `/dashboard` steuern.                                    |
| `core/services/AppStateService`   | Zentraler Frontend-Zustand und Methoden für Nutzeraktionen.                      |
| `core/services/BackendApiService` | HTTP-Aufrufe, Fehlertexte und Mapping von Backend-Daten ins Frontend-Modell.     |
| `core/services/PalService`    | Pal-Bild-Daten mit lokalem Fallback.                                       |
| `core/services/WeatherService`    | Wetterdaten und Fallback-Szene.                                                  |
| `core/state/app-state.logic.ts`   | Reine Hilfslogik, z. B. Pflegezustand und testbare Regeln.                       |
| `pages/auth`                      | Login-/Registrierungsformular, Validierung und Ladezustand.                      |
| `pages/dashboard`                 | Dashboard-Komposition und Weiterleitung von Nutzeraktionen an `AppStateService`. |
| `shared/ui`                       | Wiederverwendbare UI-Bausteine wie Button, Progress Bar und Stat Badge.          |
| `shared/models`                   | TypeScript-Verträge für User, Auth, Tasks, Pet und App-State.                    |
| `shared/mock`                     | Demo-Konstanten und Fallback-Daten, nicht die produktive Persistenz.             |

## Datenfluss

```text
Nutzeraktion
  -> Page- oder Child-Komponente
  -> AppStateService
  -> BackendApiService / WeatherService / PalService
  -> Backend oder externe API
  -> gemappter Snapshot im AppStateService
  -> Angular Signals
  -> Template aktualisiert sich
```

Für Login und Session-Restore wird der aktive Benutzername im Browser gemerkt.
Der eigentliche Spielstand kommt nach dem Login aus dem Backend. Dashboard-
Aktionen werden während laufender Requests gesperrt, damit Demo und E2E-Fluss
nicht durch Doppelklicks verfälscht werden.

## Komponentenkommunikation

| Komponente                | Inputs                                            | Outputs                                               |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `AuthFormComponent`       | Modus, Feedback, Submit-Zustand.                  | Login- oder Registrierungsdaten.                      |
| `TaskListComponent`       | Tasks, Wasserstand, Questfortschritt, Busy-State. | Questabschluss oder Wasser-Menge.                     |
| `TaskCardComponent`       | Einzelne Task, Lock-/Busy-State.                  | Abschlusswunsch für diese Task.                       |
| `HydrationGaugeComponent` | Wasserstand, Ziel, Busy-State.                    | Gewählte Wassermenge.                                 |
| `PetCardComponent`        | Pet-, Wetter-, Pal- und Feedbackdaten.        | Test-Level-Up, Motivationstest, Wetteraktualisierung. |
| `TopBarComponent`         | User-, Demo- und Fortschrittsdaten.               | Neu laden, Logout, Account löschen.                   |

## Bewusst nicht gemacht

| Thema                                 | Entscheidung                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Vollständiges DDD (Domain-Driven Design = UI → Use Cases → Domain Model → API Adapter)  im Frontend      | Nicht passend für die Projektgröße. Es gibt sprechende Modelle, aber keine Aggregate oder Repositories im Frontend. |
| Eigene Repository-Schicht im Frontend | HTTP wird direkt im `BackendApiService` gekapselt. Eine weitere Schicht hätte wenig Nutzen gebracht.                |
| Lokales Auth-System                   | Authentifizierung läuft über Backend-Session; lokale Demo-Daten sind nur noch Hilfs- und Fallbackdaten. Außerdem handelt es sich um eine **Demo**.             |
