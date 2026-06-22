# Präsentations-Sprechzettel

Kurzfassung für die Präsentation. Nicht alles auswendig lernen. Lieber die
Reihenfolge sicher können und die Begriffe sauber treffen.

## Einstieg

"Wir zeigen PalHabit. Das ist eine kleine Self-Care-App, in der Nutzer
tägliche Aufgaben erledigen, Wasser tracken und dadurch einen Pal-Partner
begleiten. Wichtig war uns, dass das Projekt nicht nur hübsch aussieht,
sondern auch technisch nachweisbar funktioniert."

## Demo-Reihenfolge

1. App öffnen: `http://localhost:3000`
2. Mit `demo / password123` einloggen.
3. Dashboard zeigen.
4. Eine Quest erledigen.
5. Wasser trinken.
6. Level-Up-Test zeigen.
7. Logout zeigen.
8. Kurz `/api/tasks` öffnen und sagen: "Das ist ein öffentlicher Endpunkt."

## API und Security

"Die Task-Liste ist öffentlich. Alles, was zum Nutzerzustand gehört, ist über
die Session geschützt. Passwörter werden gehasht gespeichert. Beim Login gibt es
außerdem Schutz gegen wiederholte Fehlversuche."

## Externer Service

"Als externen Service nutzen wir Open-Meteo für die Wetter-Szene im Dashboard.
Das Frontend ruft `/api/weather/location` und `/api/weather/current` auf. Der Backend-`WeatherService` ruft serverseitig zuerst die
Geocoding-API für die eingegebene Stadt auf und lädt danach aktuelle
Wetterdaten. Daraus entstehen Wettercode, Temperatur und Tag/Nacht-Status für
die visuelle Szene. Wenn Open-Meteo nicht erreichbar ist, bleibt die App
nutzbar und zeigt eine verständliche Fehlermeldung beziehungsweise den lokalen
Standardzustand."

## Architektur

"Im C4-Diagramm sieht man die Trennung: Angular-Frontend, Spring-Boot-Backend,
PostgreSQL, externe Dienste und der Quality Hub. Im Backend sind die Pakete nach
Features getrennt. Controller greifen nicht direkt auf Repositories zu; das
prüfen wir mit ArchUnit."

## Warum Angular statt React?

"React wäre natürlich auch möglich gewesen. Der Vorteil von React ist die hohe
Flexibilität und das große Ökosystem. Genau diese Offenheit hätte für uns aber
mehr eigene Entscheidungen bedeutet: Routing, State-Struktur, Guards,
Formularansatz und Projektkonventionen müssten stärker selbst kombiniert
werden.

Angular war für diese Arbeit passender, weil das Framework Routing, Services,
Dependency Injection, Guards und TypeScript-Struktur direkt mitbringt. Das passt
gut zum SQS-Fokus: klare Zuständigkeiten, testbare Services und ein einheitlicher
Projektaufbau. Der Nachteil ist, dass Angular schwergewichtiger ist und Updates
mehr Anpassungsaufwand haben können. Für uns war die feste Struktur aber ein
bewusster Vorteil."

## Quality Hub

"Qualitätssicherung sollte bei uns nicht nur als Liste in der Doku stehen.
Darum gibt es den Quality Hub. Er startet über Docker, führt die Checks aus,
sammelt Reports und zeigt direkt, ob das Gate grün oder rot ist."

Vorher kurz die Testpyramide nennen:

"Die Zuordnung steht in `docs/04-quality/test-pyramid.md`: unten viele Unit-Tests, darüber
Controller-, Integrations-, Security- und Architekturtests, und oben wenige
Playwright-Flows."

Checks nennen, nicht alle erklären:

- Backend-Tests und JaCoCo
- Checkstyle und SpotBugs
- Typecheck
- Frontend-Unit-Tests und Coverage
- ESLint
- npm Security
- Playwright E2E

## Doku

"Die Architektur ist in arc42 dokumentiert. Entscheidungen stehen in ADRs. Für
C4 gibt es eine Structurizr-DSL-Datei. ReadTheDocs ist im Repository vorbereitet
und kann nach dem Verbinden des öffentlichen Repos gebaut werden."

## Risiken ehrlich sagen

"Wir haben bewusst dokumentiert, was noch nicht produktionsfertig ist:
Deployment-Hardening, Caching für externe API-Daten und eine ausführlichere
Tageshistorie. Für die Abgabe liegt der Fokus auf lokalem Docker-Start,
funktionierender App und reproduzierbaren Quality Checks."

## Wenn eine Frage kommt und du kurz blockierst

1. Kurz auf den konkreten Nachweis zeigen.
2. Nicht anfangen zu raten.
3. Lieber sagen: "Das ist bei uns so umgesetzt: ..." und dann Code, Doku oder
   Quality Hub zeigen.

## Sätze, die gut funktionieren

- "Das ist nicht nur Doku, das läuft im Quality Hub wirklich durch."
- "Der externe Service ist Open-Meteo: Geocoding plus Forecast-Daten für die Wetter-Szene."
- "React wäre flexibler gewesen, Angular war für Struktur, Tests und Teamkonventionen passender."
- "Wenn die Wetter-API ausfällt, bleibt die App nutzbar und zeigt einen lokalen Standardzustand."
- "Die App ist per Docker startbar; der Quality Hub läuft im gleichen Profil."
- "Wir haben bekannte Grenzen dokumentiert, statt sie in der Präsentation zu verstecken."
