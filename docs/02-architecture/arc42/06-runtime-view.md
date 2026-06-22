# Laufzeitsicht

Die Laufzeitsicht beschreibt zentrale dynamische Abläufe der Anwendung. Sie zeigt,
wie Frontend, Backend, Datenbank und externe Dienste zur Laufzeit
zusammenarbeiten. Dokumentiert werden insbesondere fachlich wichtige User-Flows,
externe Schnittstellen und qualitätsrelevante Abläufe.

## Login und Session

![Login und Session](../diagrams/mermaid/runtime-login-session.svg)

[Mermaid-Quelle](../diagrams/mermaid/runtime-login-session.mmd)

Der Login-Flow stellt sicher, dass fachliche Funktionen nur für angemeldete
Nutzer ausgeführt werden. Registrierung und Login laufen über das Backend, damit
Authentifizierung, Session-Verwaltung und Nutzerzustand zentral kontrolliert
werden.

## Quest abschließen und Pal-Fortschritt aktualisieren

![Quest abschliessen und Pal-Fortschritt aktualisieren](../diagrams/mermaid/quest-fortschritt.svg)

[Mermaid-Quelle](../diagrams/mermaid/quest-fortschritt.mmd)

Dieser Flow ist fachlich zentral, weil hier die Gamification-Logik sichtbar wird.
Ein Klick im Frontend führt nicht nur zu einer UI-Änderung, sondern aktualisiert
serverseitig Taskstatus, Questpunkte, Happiness und Pal-Fortschritt.

## Wassertracking und automatische Quest-Aktualisierung

![Wassertracking und automatische Quest-Aktualisierung](../diagrams/mermaid/watertracking.svg)

[Mermaid-Quelle](../diagrams/mermaid/watertracking.mmd)

Dieser Ablauf zeigt eine wichtige fachliche Ausnahme: Eine Nutzeraktion kann
indirekt eine Quest abschließen. Die Entscheidung darüber liegt im Backend,
damit der Spielstand konsistent bleibt und nicht allein vom Frontend abhängt.

## Wetter abrufen und Hintergrund anzeigen

![Wetter abrufen und Hintergrund anzeigen](../diagrams/mermaid/weather.svg)

[Mermaid-Quelle](../diagrams/mermaid/weather.mmd)

Die Wetter-API wird nicht direkt aus dem Browser angesprochen, sondern über das
Backend gekapselt. Dadurch bleiben externe Schnittstellen, Fehlerbehandlung und
mögliche API-Konfigurationen zentral im Backend. Das Frontend erhält nur ein
vereinfachtes Wettermodell und entscheidet daraus, welche Szene angezeigt wird.

## Wetter-Fehlerfall

![Wetter-Fehlerfall](../diagrams/mermaid/weather-error.svg)

[Mermaid-Quelle](../diagrams/mermaid/weather-error.mmd)

Der Fehlerfall ist wichtig, weil externe Dienste nicht vollständig kontrolliert
werden können. Bei Timeout oder Fehler liefert das Backend einen kontrollierten
Fallback, sodass das Dashboard weiterhin benutzbar bleibt.

