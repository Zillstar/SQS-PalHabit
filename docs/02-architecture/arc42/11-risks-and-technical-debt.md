# Risiken und technische Schulden

Dieses Kapitel beschreibt bekannte technische Risiken und technische Schulden
des Projekts. Die Risiken werden priorisiert und jeweils mit Auswirkung,
Gegenmassnahme und aktuellem Status dokumentiert.

## Risikoliste

| Prioritaet | Risiko / Schuld | Auswirkung | Massnahme / Umgang |
| --- | --- | --- | --- |
| Hoch | Authentifizierung oder Autorisierung ist fehlerhaft. | Geschuetzte Nutzerdaten koennten ohne gueltige Session erreichbar sein. | Serverseitige Sessions, Passwort-Hashing, geschuetzte Endpunkte und Security-Tests. |
| Hoch | Frontend und Backend API driften auseinander. | UI ruft Endpunkte falsch auf oder verarbeitet Antworten fehlerhaft. | API-Zugriffe zentral in Services, TypeScript-Checks, Frontend-Tests und E2E-Tests. |
| Hoch | Zu wenig Testabdeckung. | Fehler in Kernfunktionen werden erst spaet erkannt. | Coverage-Grenze von mindestens 80 %, Quality Gate, JaCoCo und Vitest Coverage. |
| Mittel | Wetter-API ist nicht erreichbar. | Dashboard kann Wetterdaten nicht laden oder zeigt leere Zustaende. | Wetter-Fallback, Default-Hintergrund, Backend-Timeouts und manuelle Pruefung der Wetterintegration. |
| Mittel | Docker-Setup funktioniert nur auf einem einzelnen Rechner. | Abgabe oder Bewertung ist nicht reproduzierbar. | Docker Compose, konfigurierbare Ports und Test mit frischem Clone. |
| Mittel | Zu hohe Service-Komplexitaet. | Aenderungen werden riskanter und Tests schwerer wartbar. | Trennung von Controller, Service und Repository; Refactoring; ArchUnit; statische Analyse. |
| Mittel | `npm audit` oder Docker-Pulls benoetigen Netzwerk. | Quality-Checks sind offline nur eingeschraenkt ausfuehrbar. | Offline-Lockfile-Test ergaenzt Live-Audit; Netzwerkabhaengigkeit ist dokumentiert. |
| Niedrig | Tageshistorie ist noch vereinfacht. | Historische Auswertungen pro Tag sind nur begrenzt moeglich. | Als fachliche Erweiterung dokumentiert; aktueller Fokus liegt auf Tagesanzeige, Serverantworten und Kernfluss. |
| Niedrig | Oeffentliche Doku und interne Code-Namen weichen teilweise voneinander ab. | Pruefer koennten im Code noch technische Altbezeichnungen sehen, obwohl die Doku neutral formuliert ist. | Oeffentliche Doku nutzt neutrale Begriffe; interne Identifier bleiben stabil, damit keine unnötigen Code-Risiken entstehen. |
| Niedrig | PalAPI ist nicht erreichbar. | Neue oder aktualisierte Pal-Daten koennen nicht automatisch nachgeladen werden. Die Kernfunktionen bleiben nutzbar, da die benoetigten Daten bereits in der Datenbank liegen. | Pal-Daten werden vorab in die Datenbank geladen; externe API ist nicht fuer den normalen App-Betrieb erforderlich. Tests nutzen Mocks oder lokale Daten. |

## Wichtigste technische Schulden

| Technische Schuld | Begruendung | Geplanter Umgang |
| --- | --- | --- |
| Produkthaertung der Session-Cookies ist deploymentabhaengig. | Im lokalen Dev-Setup sind nicht alle produktiven Cookie-Flags sinnvoll nutzbar. | Fuer ein echtes Produktivdeployment muessten `Secure`, `SameSite`, HTTPS und CSRF-Policy final festgelegt werden. |
| Tageshistorie ist nur vereinfacht umgesetzt. | Fuer die Semesterarbeit reicht der aktuelle Tagesfortschritt, aber langfristige Auswertungen waeren fachlich sinnvoll. | Erweiterung um persistente Tageshistorie und Auswertungsansicht. |
| Externe API-Integration bleibt abhaengig von Drittanbietern. | PalAPI und Wetterdaten liegen ausserhalb des eigenen Systems. | Fallbacks, Timeouts und Tests beibehalten; bei Produktivbetrieb Monitoring ergaenzen. |
| Quality Hub ersetzt keine echte CI-Plattform. | Der Hub macht lokale Qualitaet sichtbar, ist aber kein Ersatz fuer GitHub Actions oder SonarQube. | Hub als lokaler Nachweis fuer die Abgabe nutzen; langfristig CI/CD-Pipeline ausbauen. |

## Bewertung

Die kritischsten Risiken betreffen Authentifizierung, API-Kompatibilitaet,
Testabdeckung und externe Dienste. Diese Risiken werden durch automatisierte
Tests, Fallbacks, statische Analyse und das Quality Gate aktiv reduziert.

Einige Punkte bleiben bewusst als technische Schulden dokumentiert, weil sie fuer
den aktuellen Abgabeumfang vertretbar sind, aber bei einem echten
Produktivbetrieb weiter ausgebaut werden muessten.
