# GrammarFirst neu bauen

Dateien:

* App.jsx: App, Lektionen, Gamification (XP, Serie, Herzen, Edelsteine, Liga, Aufgaben, Erfolge)
* Mascot.jsx: Maskottchen Mila (SVG)
* courses1.js: Deutsch, Englisch, Spanisch, Französisch
* courses2.js: Russisch, Polnisch, Züridütsch, Italienisch, Irisch
* more_de.js … more_ga.js: Lektionen 7 bis 26 je Sprache (Einheiten 3 bis 6)
* deep_de.js, deep_gsw.js, deep_en.js, deep_es.js, deep_fr.js, deep_it.js, deep_ru.js, deep_pl.js: vertiefte Erklärungen (Mehr dazu), Grammatiktabellen und Lesetexte pro Einheit
* more_b2.js, reading7.js: Einheit 7 (B2) mit Lesetext für alle Kurse ausser Irisch
* en_extra.js: zusätzliche englische Übersetzungen
* extend.js: hängt die zusätzlichen Einheiten an die Kurse an
* lang.js, en_dict.js: Erklärsprache Englisch oder Deutsch für alle Kurse ausser Deutsch und Englisch
* styles.js: CSS, läuft im Shadow DOM (mit Dunkelmodus)
* cloud.js: Lingora-Login und Synchronisierung des Lernfortschritts. Die bestehende Warteliste und anonyme Statistik nutzen weiterhin ihr ursprüngliches Supabase-Projekt.
* flash.jsx: Wortschatz-Karteikarten mit Leitner-Boxen
* entry.jsx: Einstieg

Bauen (im Ordner src/grammarfirst, mit Node.js 22 oder neuer):

    npm ci
    npm run build:lingora -- /absoluter/pfad/zu/Lingora
    npm run build

Der Lingora-Ordner muss seine Expo-Abhängigkeiten installiert haben. Der Build liest
aus dessen .env nur die öffentliche Supabase-URL und den öffentlichen Schlüssel.
Er exportiert die Webansicht unter /grammarfirst/lingora/ und aktualisiert den
Lektionskatalog für den vorhandenen GrammarFirst-Lernpfad. Nach Änderungen an
GrammarFirst die Version von app.js in index.html und sw.js gemeinsam erhöhen.

Vercel und Netlify liefern die Webansicht auch für direkte Links zu Lektionen,
Unterhaltungen und zum E-Mail-Callback aus. Für neue Konten muss die exakte
öffentliche HTTPS-Adresse /grammarfirst/lingora/auth/callback in Supabase Auth
unter Redirect URLs eingetragen sein. Die Anmeldung mit einem bereits bestätigten
Lingora-Konto funktioniert unabhängig von dieser Weiterleitung.

Abschlüsse mit gemeinsamen Lektions-IDs verwenden dieselben XP-Regeln wie die App.
Gastfortschritt aus diesem Browser lässt sich im Profil ausdrücklich importieren.
Ältere Cloud-Konten und ihr Fortschritt bleiben im ursprünglichen Supabase-Projekt.

Neue Lektion: in courses1.js, courses2.js oder der passenden more_xx.js eine Lektion mit eindeutiger id, rule, structure, examples, tip und ex (Aufgaben mit ch, bu, ty, ma) ergänzen.
