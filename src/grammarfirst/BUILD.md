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
* cloud.js: Konto per E-Mail-Link, Synchronisation und anonyme Statistik (Supabase, Projekt grammarfirst, Region Zürich)
* flash.jsx: Wortschatz-Karteikarten mit Leitner-Boxen
* entry.jsx: Einstieg

Bauen (im Ordner src/grammarfirst):

    npm i react@18.3.1 react-dom@18.3.1 esbuild@0.23.1
    npx esbuild entry.jsx --bundle --minify --format=iife --jsx=automatic --define:process.env.NODE_ENV='"production"' --target=es2019 --outfile=../../grammarfirst/app.js

Neue Lektion: in courses1.js, courses2.js oder der passenden more_xx.js eine Lektion mit eindeutiger id, rule, structure, examples, tip und ex (Aufgaben mit ch, bu, ty, ma) ergänzen.
