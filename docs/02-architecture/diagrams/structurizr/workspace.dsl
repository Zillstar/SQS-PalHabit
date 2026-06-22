workspace "PalHabit" "C4-Modell der SQS-Semesterarbeit" {
    model {
        user = person "Nutzer" "Registriert sich, meldet sich an und nutzt Quests, Wassertracking und Wetter."

        palHabit = softwareSystem "PalHabit" "Self-Care-Webanwendung mit Pal-Gamification." {
            frontend = container "Frontend" "Browser-App für Login, Dashboard, Quests, Wasser und Wetter." "Angular, TypeScript, SCSS"
            backend = container "Backend API" "REST API für Authentifizierung, Nutzerzustand, Tasks und Starter-Pal." "Java 21, Spring Boot" {
                authController = component "AuthenticationController" "Registrierung, Login und Logout." "Spring REST Controller"
                userController = component "UserController" "Liefert und verändert den Game-State." "Spring REST Controller"
                taskController = component "TaskController" "Liefert Aufgaben und verarbeitet erledigte Tasks." "Spring REST Controller"
                authService = component "AuthenticationService" "Hashing, Login-Schutz, Session-Logik und Starter-Zuweisung." "Spring Service"
                userService = component "UserService" "Berechnet Pal-Level, XP, Wasserstand und Evolution." "Spring Service"
                taskService = component "TaskService" "Task-Auswahl, Abschluss und Tageslogik." "Spring Service"
                palApiService = component "PalApiPalService" "Lädt Starter-Pal-Daten mit Timeout und lokalem Fallback." "Spring Service"
                repositories = component "Repositories" "User-, Task- und Pal-Persistenz." "Spring Data JPA"
            }
            database = container "PostgreSQL" "Persistiert Nutzer, Tasks, Pal und Fortschritt." "PostgreSQL"
            qualityHub = container "Quality Hub" "Zeigt lokale Quality-Gate-Ergebnisse aus Docker an." "Nginx, statische HTML-App"
        }

        palApi = softwareSystem "PalAPI" "Externer REST-Service für Pal-Namen und offizielles Artwork."
        openMeteo = softwareSystem "Open-Meteo" "Externer Wetterdienst für die Dashboard-Szene."

        user -> frontend "nutzt im Browser"
        frontend -> backend "REST/JSON mit Session-Cookie"
        frontend -> openMeteo "liest Wetterdaten"
        backend -> database "liest und schreibt per JPA/JDBC"
        backend -> palApi "liest Starter-Pal-Daten"

        authController -> authService "delegiert"
        userController -> userService "delegiert"
        taskController -> taskService "delegiert"
        authService -> repositories "speichert User und Starter"
        authService -> palApiService "laedt Starter-Daten"
        userService -> repositories "liest und schreibt Game-State"
        taskService -> repositories "liest und schreibt Task-Fortschritt"
        palApiService -> palApi "HTTPS/JSON"
        repositories -> database "JPA/JDBC"
    }

    views {
        systemContext palHabit "SystemContext" {
            include *
            autolayout lr
        }

        container palHabit "Containers" {
            include *
            autolayout lr
        }

        component backend "BackendComponents" {
            include *
            autolayout lr
        }

        styles {
            element "Person" {
                background "#fff0d6"
                color "#101828"
                shape person
            }

            element "Software System" {
                background "#eef2ff"
                color "#101828"
            }

            element "Container" {
                background "#e7f8ef"
                color "#101828"
            }

            element "Component" {
                background "#f8fafc"
                color "#101828"
            }
        }
    }
}
