# Testkonzept

Dieses Kapitel beschreibt das dokumentierte und implementierte Testkonzept des Projekts. Ziel ist es, die Qualität der 
Anwendung systematisch abzusichern und die in der Aufgabenstellung geforderte vollständige Testpyramide nachvollziehbar umzusetzen.

Das Testkonzept ergänzt die bestehende Dokumentation zur Testpyramide und fasst zusammen, welche Testarten verwendet werden, 
welche Risiken dadurch abgesichert werden, welche Grenzen bewusst gesetzt wurden und wie die Tests in die CI-Pipeline integriert sind.

## Ziele des Testkonzepts

Das Testkonzept verfolgt folgende Ziele:

* Absicherung der fachlichen Kernfunktionen der Anwendung
* Nachweis einer vollständigen Testpyramide
* Schutz geschützter Endpunkte und sicherheitsrelevanter Funktionen
* Sicherstellung stabiler Backend-, Frontend- und Persistenzintegration
* Automatisierte Qualitätssicherung über GitHub Actions
* Erreichen einer Testabdeckung von mindestens 80 %
* Nachvollziehbare Dokumentation der bewusst gesetzten Testgrenzen

## Testpyramide

Die Tests orientieren sich an der Testpyramide. Dabei liegt der Schwerpunkt auf vielen schnellen Unit-Tests, ergänzt 
durch Integrationstests, Architekturtests, Security-Tests und wenige, gezielte End-to-End-Tests.

Die detaillierte Beschreibung der Testpyramide befindet sich auf der Seite [Testpyramide](test-pyramid.md). 
Diese Seite beschreibt die konkrete Umsetzung der einzelnen Testarten im Projekt.

## Eingesetzte Testarten

### Unit-Tests

Unit-Tests prüfen einzelne Klassen, Funktionen oder Komponenten isoliert. Sie bilden die Basis der Testpyramide und sollen schnell, stabil und unabhängig von externen Systemen ausführbar sein.

Im Backend werden Unit-Tests vor allem für Services, Mapper, Validierungslogik und fachliche Regeln eingesetzt. Im Frontend werden Komponenten, Services, Guards und Hilfsfunktionen getestet.

### Integrationstests

Integrationstests prüfen das Zusammenspiel mehrerer Anwendungsteile. Dazu gehören insbesondere Controller, Services, Repositories, Datenbankzugriffe und sicherheitsrelevante Backend-Flows.

Im Backend werden Integrationstests mit Spring Boot eingesetzt. Sie stellen sicher, dass HTTP-Endpunkte, Persistenz und fachliche Logik korrekt zusammenspielen.

### End-to-End-Tests

End-to-End-Tests prüfen zentrale Benutzerflüsse über die Benutzeroberfläche. Sie werden bewusst auf wenige kritische Szenarien beschränkt, weil sie langsamer und wartungsintensiver sind als Unit- und Integrationstests.

Getestet werden insbesondere Kernflüsse wie Registrierung, Login, Nutzung geschützter Funktionen und das Abschließen täglicher Aufgaben.

### Security-Tests / Penetration-nahe Tests

Da die Aufgabenstellung abgesicherte Endpunkte fordert, werden sicherheitsrelevante Tests als Teil des Testkonzepts betrachtet.

Dabei wird insbesondere geprüft, dass geschützte Endpunkte nicht ohne gültige Authentifizierung erreichbar sind und dass Login-Kontext, Session- beziehungsweise Token-Handling und Zugriffsbeschränkungen korrekt funktionieren.

Diese Tests ersetzen keinen professionellen Penetrationstest, erfüllen im Rahmen der Projektarbeit aber die Anforderung, die Sicherheitslogik automatisiert zu prüfen.

### Architekturtests

Architekturtests prüfen, ob die geplante Schichtenarchitektur eingehalten wird. Dadurch wird verhindert, dass beispielsweise Controller direkt auf Persistenzdetails zugreifen oder fachliche Logik in falsche Schichten wandert.

Damit unterstützen die Architekturtests die Wartbarkeit des Projekts und sichern zentrale Architekturentscheidungen langfristig ab.

### Tests externer Services

Das Backend bindet externe Services an. Diese Integration wird so getestet, dass die Anwendung nicht von der realen Verfügbarkeit externer APIs abhängig ist.

Externe Antworten werden in automatisierten Tests kontrolliert simuliert. Zusätzlich werden Fehlerfälle wie nicht erreichbare Services oder unerwartete Antworten berücksichtigt, damit die Anwendung robust reagieren kann.

## Kritische Risiken und Absicherung

| Risiko                                                         | Absicherung durch Tests                    |
| -------------------------------------------------------------- | ------------------------------------------ |
| Geschützte Endpunkte sind ohne Login erreichbar                | Security- und Integrationstests            |
| Login, Registrierung oder Logout funktionieren nicht korrekt   | Unit-, Integration- und E2E-Tests          |
| Backend und Datenbank arbeiten nicht korrekt zusammen          | Repository- und Integrationstests          |
| Frontend und Backend passen nicht zusammen                     | End-to-End-Tests und Smoke-Tests           |
| Fachliche Kernlogik ist fehlerhaft                             | Unit-Tests                                 |
| Architekturregeln werden verletzt                              | Architekturtests                           |
| Externe Services fallen aus oder liefern unerwartete Antworten | Service-Tests mit kontrollierten Antworten |
| Änderungen brechen bestehende Funktionen                       | Automatisierte CI-Pipeline                 |

## Coverage-Ziel

Das Projekt verfolgt eine Testabdeckung von mindestens 80 %. Die Abdeckung wird getrennt für Backend und Frontend erhoben.

Im Backend wird die Coverage über JaCoCo gemessen. Im Frontend wird die Coverage über die Testwerkzeuge des Frontends 
ermittelt. Die Coverage-Berichte werden in der CI-Pipeline erzeugt und als Artefakte bereitgestellt.

Die Coverage dient nicht als alleiniger Qualitätsnachweis. Entscheidend ist zusätzlich, dass kritische Geschäftslogik, 
Sicherheitslogik, Integrationspunkte und zentrale Benutzerflüsse sinnvoll getestet werden.

Die 80-%-Grenze gilt als Zielwert für die bewertungsrelevanten Projektbereiche. Generierte Dateien, Konfigurationen und reine Framework-Bootstrap-Klassen werden dabei nicht als fachlich relevante Kernlogik betrachtet.

## CI-Integration

Die Tests sind in die GitHub-Actions-Pipeline integriert. Die Pipeline führt automatisiert Build, Tests, 
Coverage-Erzeugung, statische Analyse und End-to-End-Tests aus.

Die CI-Pipeline umfasst insbesondere:

* Backend-Build
* Backend-Unit- und Integrationstests
* JaCoCo-Coverage-Bericht
* Checkstyle und SpotBugs
* Frontend-Build und TypeScript-Type-Check
* Frontend-Unit-Tests mit Coverage
* ESLint und Format-Check
* SonarQube-Analyse
* Playwright-End-to-End-Tests

Dadurch wird sichergestellt, dass Änderungen am Projekt automatisiert geprüft werden und Qualitätsprobleme früh sichtbar werden.

## Bewusst nicht automatisiert getestete Aspekte

Nicht oder nur eingeschränkt automatisiert getestet werden:

* vollständige visuelle Pixel-Perfektion der Benutzeroberfläche
* umfangreiche Last- und Performancetests
* alle möglichen Browser- und Gerätekombinationen
* produktionsnahe Langzeittests
* die echte Verfügbarkeit externer APIs in jedem CI-Lauf

Diese Punkte werden bewusst ausgeschlossen, weil sie im Rahmen der Projektarbeit entweder nicht zentral für die 
Bewertung sind oder zu instabilen Tests führen würden. Stattdessen konzentriert sich das Testkonzept auf stabile, 
automatisierbare und qualitätsrelevante Tests.

## Manuelle Demo-Tests

Zusätzlich zu den automatisierten Tests wird vor der Präsentation ein manueller Smoke-Test durchgeführt. 
Dieser dient dazu, die Anwendung aus Sicht eines Nutzers in einer realistischen Demo-Situation zu prüfen.

Der manuelle Demo-Test umfasst:

1. Anwendung starten
2. Öffentlichen Endpunkt prüfen
3. Registrierung durchführen
4. Login durchführen
5. Geschützten Bereich aufrufen
6. Tägliche Aufgabe abschließen
7. Fortschritt des virtuellen Pal prüfen
8. Logout durchführen
9. Geschützten Bereich ohne gültige Authentifizierung aufrufen
10. Verhalten bei externer Servicefunktion prüfen

## Fazit

Das Testkonzept kombiniert automatisierte Tests auf mehreren Ebenen mit statischer Analyse, Coverage-Messung und 
manuellen Demo-Tests. Dadurch wird die vollständige Testpyramide umgesetzt und die Qualität der Anwendung nachvollziehbar abgesichert.
