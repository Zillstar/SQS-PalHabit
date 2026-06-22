# ADR-001: Spring Boot für das Backend verwenden

## Status
Akzeptiert

## Kontext
Wir brauchen ein serverseitiges Framework für eine Java-basierte REST-API, die sich mit einer
relationalen Datenbank und einem externen HTTP-Service (PalAPI) integriert. Das Framework sollte
starke Standards für Sicherheit, Testing und Deployment bereitstellen.

## Alternativen
TypeScript
Flutter (Overhead)
Electron (Overhead)

## Entscheidung
Spring Boot 3 mit Spring Web, Spring Data JPA und Spring Security verwenden.
Gründe: Entwicklerressourcen, Vorkonfigurationen bedeuten weniger Arbeit

## Konsequenzen
- Convention-over-configuration reduziert Boilerplate.
- Spring Security vereinfacht das Absichern des geschützten Endpunkts.
- Großes Ökosystem bedeutet einfache Integration mit PostgreSQL, H2 (Tests) und WireMock.

## Nachteile
- "Vorhängeschloss" als Standardsicherheit
- Nicht das schnellste
- Debugging
- Statische Architektur durch Vorkonfigurationen
