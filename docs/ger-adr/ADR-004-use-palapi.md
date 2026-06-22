# ADR-004: PalAPI als externer Backend-Service

## Status
Akzeptiert

## Kontext
Die App braucht Pal-Daten für den Starter-Partner. Die PDF-Checkliste
verlangt außerdem, dass das Backend selbst mit mindestens einem externen
Service spricht. PalAPI passt dazu gut, weil die Starter-Pal dort ohne API
Key abrufbar sind und die Daten fachlich wirklich zur App gehören.

## Alternativen
- Nur lokale Starter-Daten pflegen.
- Pal-Daten ausschließlich im Frontend laden.
- Einen kommerziellen Pal-Service anbinden.

## Entscheidung
Das Backend nutzt PalAPI (`https://example.com/pal-api`) beim Anlegen eines
Users, um fehlende Starter-Pal in der Datenbank zu befüllen. Bereits
vorhandene Pal werden wiederverwendet, damit Registrierungen nicht
unnötig externe Requests auslösen und vorhandene Namen/Bilder nicht
überschrieben werden. Lokale Evolutions-Metadaten dürfen ergänzt werden, weil
die App nur die drei Starter-Ketten braucht.

Abgerufene Daten:

- Pal ID
- Name
- Official artwork

Der Zugriff läuft mit kurzen Timeouts. Wenn PalAPI nicht erreichbar ist, einen
Fehlerstatus liefert oder unvollständige Daten zurückgibt, nutzt das Backend den
lokalen Starter-Katalog als Fallback. Im Testprofil sind externe Aufrufe
deaktiviert; der Service selbst wird mit einem lokalen HTTP-Stub getestet.

## Konsequenzen
- Die App startet auch ohne Internet oder bei PalAPI-Ausfall weiter.
- Der externe Service ist im Backend nachweisbar und nicht nur im Frontend.
- Tests bleiben stabil, weil sie nicht von echter Netzverfügbarkeit abhängen.
- Bei produktiver Nutzung wäre Caching sinnvoll, damit Registrierungen nicht
  unnötig viele externe Requests auslösen.

## Nachteile
- Es gibt eine zusätzliche externe Abhängigkeit.
- Die Pal-Daten sind nur so aktuell und verfügbar wie PalAPI.
