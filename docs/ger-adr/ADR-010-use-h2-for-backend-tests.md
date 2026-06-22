# ADR-010: H2 In-Memory-Datenbank für Backend-Tests verwenden

## Status

Akzeptiert

## Kontext

Die Anwendung verwendet PostgreSQL als produktive Datenbank. Für automatisierte
Backend-Tests soll jedoch keine manuell gestartete lokale Datenbank notwendig
sein.

Die Tests sollen schnell, reproduzierbar und unabhängig von der lokalen
Entwicklungsumgebung laufen. Dadurch können sie sowohl lokal als auch im
Quality-Workflow zuverlässig ausgeführt werden.

## Entscheidung

Für automatisierte Backend-Tests verwenden wir eine H2 In-Memory-Datenbank im
Testprofil.

PostgreSQL bleibt die Hauptdatenbank für die Anwendung und wird über Docker
Compose für lokale Demo- und Integrationsszenarien bereitgestellt.

## Alternativen

- PostgreSQL auch für alle Tests verwenden
- Testcontainers mit PostgreSQL verwenden
- H2 In-Memory-Datenbank verwenden
- Persistenzschicht vollständig mocken

## Konsequenzen

- Backend-Tests laufen ohne externe Datenbank.
- Tests sind schneller und einfacher reproduzierbar.
- Der Datenbankzustand ist pro Testlauf isoliert.
- Repository- und Service-Tests können automatisiert im Quality-Workflow laufen.
- Die Testausführung ist auch auf neuen Rechnern ohne zusätzliche Einrichtung
  möglich.

## Nachteile

- H2 verhält sich nicht in allen Details exakt wie PostgreSQL.
- PostgreSQL-spezifische SQL- oder Dialektprobleme können unentdeckt bleiben.
- Für sehr datenbanknahe Funktionen wären ergänzende Tests mit PostgreSQL oder
  Testcontainers sinnvoll.