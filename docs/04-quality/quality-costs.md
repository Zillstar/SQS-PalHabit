# Qualitätskosten und technische Schulden

Ein zentrales Motiv der Qualitätssicherung ist, Fehler möglichst früh zu finden.
Je später ein Fehler im Entwicklungsprozess entdeckt wird, desto aufwendiger
und teurer ist seine Behebung. Ein Fehler, der bereits durch einen Unit-Test
auffällt, kann meist direkt im betroffenen Code korrigiert werden. Ein Fehler,
der erst in der Demo, im Deployment oder durch manuelles Testen auffällt,
verursacht dagegen deutlich mehr Aufwand, weil Ursache, betroffene Komponenten
und Seiteneffekte erst nachträglich analysiert werden müssen.

Für PalHabit bedeutet das: Qualitätssicherung soll nicht erst am Ende der
Entwicklung stattfinden, sondern kontinuierlich während der Umsetzung. Dadurch
werden technische Schulden reduziert und Fehler früher sichtbar gemacht.

## Umsetzung im Projekt

| Maßnahme | Vermeideter später Fehler | Nutzen |
| --- | --- | --- |
| Unit-Tests | Fehler in Businesslogik, z. B. bei Tagesquests, Wassertracking oder Pal-Fortschritt | Fehler werden direkt auf Methoden- oder Service-Ebene gefunden. |
| Controller- und Integrationstests | Fehler im Zusammenspiel von API, Authentifizierung, Datenbank und Validierung | Kritische Nutzerflüsse werden vor der Demo automatisiert geprüft. |
| Playwright-E2E-Tests | Fehler im echten Nutzerfluss zwischen Frontend und Backend | Zentrale Abläufe wie Login, Dashboard, Tasks, Wasser und Level-Up werden aus Nutzersicht geprüft. |
| ArchUnit-Tests | Unklare Schichtentrennung und unkontrollierte Abhängigkeiten | Architekturverletzungen werden früh erkannt, bevor sie zu Wartungsproblemen werden. |
| CI-/Quality-Runner | Fehlerhafte Tests, Lint-Probleme oder Security-Probleme auf einzelnen Rechnern | Qualitätsprüfungen laufen reproduzierbar und unabhängig von lokalen IDE-Einstellungen. |
| SonarQube / statische Analyse | Code Smells, Duplication, mögliche Bugs und technische Schulden | Wartbarkeitsprobleme werden sichtbar, bevor sie sich im Projekt verfestigen. |
| npm audit / Dependency-Checks | Bekannte Schwachstellen in Frontend-Abhängigkeiten | Sicherheitsrisiken durch Drittbibliotheken werden früh erkannt. |
| Docker Compose | Fehler durch unterschiedliche lokale Umgebungen | Das Projekt bleibt auf fremden Rechnern reproduzierbar startbar. |

## Verbindung zur Testpyramide

Die Testpyramide hilft dabei, Qualitätskosten niedrig zu halten. Viele schnelle
Tests auf niedriger Ebene finden Fehler früh und günstig. Wenige, aber wichtige
E2E-Tests prüfen zusätzlich, ob die zentralen Nutzerflüsse wirklich
funktionieren. Dadurch entsteht ein ausgewogenes Verhältnis zwischen schneller
Fehlererkennung und realitätsnaher Absicherung.

Für PalHabit ergibt sich daraus folgende Strategie:

```text
früh prüfen → Fehler schneller finden → weniger Nacharbeit → weniger technische Schulden
```
Die Qualitätsmaßnahmen sind daher nicht nur Nachweise für die Abgabe, sondern
reduzieren konkret das Risiko, dass Fehler erst spät im Projekt sichtbar werden.