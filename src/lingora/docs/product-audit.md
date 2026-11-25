# Lingora – Bewertung, Lückenanalyse und Roadmap

Stand: 12. November 2026. Grundlage: Code-Durchsicht, automatische Prüfungen (TypeScript, ESLint, Inhalts- und Übersetzungsprüfung), Supabase-Sicherheits- und Performance-Berater, Server-Logs der letzten 24 Stunden.

## 1. Bewertung des aktuellen Stands

### Was vorhanden ist und funktioniert

| Bereich | Stand |
|---|---|
| Technik | Expo SDK 58, Expo Router, TypeScript, TanStack Query, Supabase. 169 Quelldateien, rund 23 000 Zeilen. TypeScript ohne Fehler. |
| Konten | Registrierung mit Prüfung, Login, Passwort vergessen, E-Mail-Bestätigung, Gastmodus mit späterer Konto-Erstellung, Konto löschen (Edge Function). |
| Lernen | 11 Kurse, 527 Lektionen und Lesetexte, 2223 Übungen, CEFR-Stufen, Alphabet-Lektion, Einstufungstest, Lernpfad, Grammatik-Bibliothek, Geschichten. |
| Wortschatz | Themenlisten, 2000 häufigste Wörter, Trainer, Karteikarten, Hör- und Sprechmodus, Sprint, „Meine Wörter“, Wiederholung nach Zeitplan. |
| Motivation | XP, Serie mit Freezes, Tagesziel, Quests, Truhen, Abzeichen, Liga, Duelle, Medved-Outfits. XP und Serie rechnet der Server. |
| Community | Partnersuche, Profile, Folgen, Chats mit Korrekturen, Beiträge, Fragen, Clubs, Bewertungen. |
| Sicherheit | Zeilenschutz (RLS) auf allen Tabellen, Blockieren, Melden, Sperren, Admin-Ansicht, Gäste serverseitig von der Community getrennt. |
| Sprache der Oberfläche | Englisch und Deutsch (1243 deutsche Texte, automatisch geprüft). |
| Geld | Spenden per PayPal, Plus-Abo vorbereitet (siehe `docs/monetization.md`). |

### Gefundene Probleme und was damit geschehen ist

| Befund | Schwere | Status |
|---|---|---|
| App blieb mit ungültiger Sitzung „angemeldet“ (60 fehlgeschlagene Aufrufe mit Status 401 in den Logs, z. B. nach gelöschtem Konto). | hoch | behoben: Sitzung wird geprüft und sauber abgemeldet |
| 29 Zugriffsregeln werteten `auth.uid()` pro Zeile aus (langsam bei vielen Daten). | mittel | behoben (Migration `performance_hardening`) |
| 16 Fremdschlüssel ohne Index. | mittel | behoben (gleiche Migration) |
| Kein Auffangen von Abstürzen: weiße Seite bei Fehlern. | mittel | behoben: Fehlerseite mit „Erneut versuchen“ |
| Keine Seite für unbekannte Adressen. | niedrig | behoben: 404-Seite |
| Datenschutzerklärung nur Englisch und veraltet (kein Gastmodus, keine Zahlungen, keine Sprachfunktionen). | hoch für den Verkauf | behoben und übersetzt |
| Keine Nutzungsbedingungen. | hoch für den Verkauf | neu: `/terms` |
| Plus-Seite versprach Vorteile, die es nicht gab. | hoch für den Verkauf | behoben: nur echte Vorteile, echte Sperren |
| Kein Seitentitel, keine Beschreibung für Suchmaschinen und Link-Vorschauen, nicht installierbar. | mittel | behoben: Meta-Angaben und Web-App-Manifest |
| Schutz vor geleakten Passwörtern in Supabase aus. | mittel | offen: Schalter im Supabase-Dashboard (Authentication → Passwords) |
| Gastmodus in Supabase nicht eingeschaltet. | mittel | offen: Schalter „Allow anonymous sign-ins“ |
| E-Mail-Versand auf 2 Mails pro Stunde begrenzt. | hoch für den Start | offen: eigene Domain + E-Mail-Dienst |
| Keine automatischen Tests. | mittel | offen (Roadmap Phase 1) |
| Edelsteine, Quests, Abzeichen, gespeicherte Wörter nur auf dem Gerät. | mittel | offen (Roadmap Phase 2) |
| Alte, leere Tabellen `lessons`, `lesson_exercises`, `user_lesson_progress`, `notifications`. | niedrig | offen: nach Prüfung entfernen |

Nicht geprüft: alles, wofür man angemeldet sein muss, in einem echten Browser-Durchlauf (Chat, Posten, Duell, Liga, Konto-Umwandlung). Geprüft wurden dort Code, Typen und einzelne Bildschirme.

## 2. Lückenanalyse zur Produktvision

| Vision | Heute | Lücke |
|---|---|---|
| KI-Tutor, Rollenspiele | nicht vorhanden | braucht KI-Schlüssel und eine Server-Funktion; laufende Kosten |
| KI-Sprechtraining mit Aussprache-Feedback | Vorlesen und Browser-Spracherkennung | echte Aussprache-Analyse braucht einen Sprachdienst |
| Übungstypen (10 gefordert) | Auswahl, Satzbau, Zuordnen, Hören, Lesen, Sprechen, Schreiben mit Musterlösung | Übersetzen und Fehlerkorrektur fehlen als eigene Typen |
| Wortschatz mit FSRS | einfacher Stufenplan, nur auf dem Gerät | FSRS und Speicherung auf dem Server |
| Partnersuche mit Begründung | Suche und Filter vorhanden | „Warum passt ihr“ und Zeitzonen fehlen |
| Chat: Sprachnachrichten, Bilder, Übersetzung, Lesebestätigung | Text und Korrekturen | bewusst eingeschränkt (Moderation); Ausbau schrittweise |
| 7 Oberflächensprachen | 2 | Spanisch, Französisch, Italienisch, Portugiesisch, Russisch fehlen |
| Datenexport | nur Löschen | Export-Funktion fehlt |
| Tests | Typen, Lint, Inhaltsprüfungen | Unit-, Sicherheits- und End-to-End-Tests fehlen |
| Abo | Stripe-Anbindung fertig, nicht aktiviert | Stripe-Konto und Links nötig |
| Statistik für Lernende | Wochenrückblick | Diagramme und Schwächen-Analyse fehlen |

## 3. Roadmap

### Phase 1 – Fundament (jetzt)

Erledigt in diesem Durchgang: Sitzungs-Fehler, Datenbank-Performance, Fehler- und 404-Seite, Rechtstexte, Plus-Fundament, Web-Metadaten.

Als Nächstes:
1. Schalter in Supabase setzen (Gastmodus, Passwort-Schutz).
2. Eigene Domain und E-Mail-Dienst, damit Registrierungen zuverlässig ankommen.
3. Impressum mit Name und Adresse.
4. Automatische Tests für die kritischen Abläufe (Registrieren, Lektion abschließen, Nachricht senden, Melden, Konto löschen) und für die Zugriffsregeln.

Abnahme: ein neuer Besucher kommt ohne Fehlermeldung vom ersten Klick bis zur ersten abgeschlossenen Lektion, auf Handy und Desktop.

### Phase 2 – Lernen vertiefen

1. Spielstand (Edelsteine, Quests, Abzeichen, Wörter, Wiederholungen) auf den Server, damit er Geräte übersteht.
2. FSRS für die Wiederholung.
3. Neue Übungstypen: Übersetzen, Fehler korrigieren.
4. Tägliche Wiederholungs-Lektion aus eigenen Fehlern.
5. Lernstatistik.

### Phase 3 – Community

1. Begründete Partner-Vorschläge („Ihr könnt euch gegenseitig helfen“).
2. Lesebestätigung und Tipp-Anzeige.
3. Benachrichtigungen per E-Mail (z. B. neue Nachricht).
4. Datenexport.

### Phase 4 – KI (braucht Schlüssel und Budget)

1. „Medved erklärt“: Fehler in einem Satz erklären.
2. Rollenspiele als Chat.
3. Schreib-Feedback.
Alles über eine Server-Funktion mit Tageslimit pro Person; kostenlos wenige Anfragen, Plus mehr. Das wäre der stärkste Plus-Vorteil.

### Phase 5 – Reife

Weitere Oberflächensprachen, Offline-Pakete, Barrierefreiheit, Leistungsmessung.

### Phase 6 – Start

Stripe live, juristische Prüfung der Texte, App-Store-Versionen mit Apple-/Google-Käufen, Überwachung von Fehlern im Betrieb.

## 4. Architektur

- **Inhalte bleiben im Code** (geprüft beim Build), der Server kennt nur die Lektions-IDs. Das ist schnell und günstig. Erst bei Inhalten von Dritten lohnt sich eine Verwaltungsoberfläche.
- **Der Server ist die Wahrheit für alles, was Wert hat:** XP, Serie, Liga, Mitgliedschaften. Der Spielstand auf dem Gerät sollte in Phase 2 folgen.
- **Schreibzugriffe mit Regeln laufen über Server-Funktionen**, die App schreibt nur eigene, einfache Daten direkt.
- **Geheime Schlüssel nur in Edge Functions** (Stripe, später KI). In der App steht nur der öffentliche Supabase-Schlüssel.
- **Neue Tabellen in Phase 2:** `game_state` (ein Datensatz pro Person), `vocabulary_items`, `vocabulary_reviews`. Keine Duplikate zu `learn_progress`.

## 5. Was du selbst tun musst (Zugänge und Kosten)

| Aufgabe | Kosten |
|---|---|
| Supabase: Gastmodus und Passwort-Schutz einschalten | keine |
| Eigene Domain + E-Mail-Dienst (z. B. Resend) | ca. 10–15 CHF pro Jahr für die Domain, E-Mail anfangs gratis |
| Stripe-Konto, Produkt, Payment Links (`docs/monetization.md`) | keine Fixkosten, Gebühr pro Zahlung |
| Impressum-Angaben liefern | keine |
| KI-Schlüssel für Phase 4 | nutzungsabhängig |
| Supabase Pro, sobald echte Nutzer kommen (Backups, keine Pausierung) | ca. 25 USD pro Monat |
