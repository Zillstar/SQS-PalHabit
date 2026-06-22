# Messung von Softwarequalität

## Ziel
Wir messen Softwarequalität, um den Projektzustand objektiv bewerten und steuern zu können.

## Verwendete Maße und Metriken
- Coverage
- Bugs
- Vulnerabilities
- Security Hotspots
- Code Smells
- Duplications
- Cyclomatic Complexity
- Build Status
- ArchUnit Violations

## Zielwerte / Quality Gates
- Coverage >= 80 %
- 0 kritische Bugs
- 0 kritische Vulnerabilities
- keine blockierenden Code Smells
- geringe Duplikation
- CI muss grün sein

## Tooling
- SonarQube/SonarCloud
- JaCoCo für Backend Coverage
- Vitest Coverage für Frontend
- GitHub Actions zur automatischen Ausführung

## Maßnahmen bei Verstößen
- Bugfix
- Refactoring
- Tests ergänzen
- Architekturregel anpassen oder Code korrigieren