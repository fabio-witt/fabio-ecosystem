# GrammarFirst neu bauen

Dateien:

* App.jsx: App, Lektionen, Gamification (XP, Serie, Herzen, Edelsteine, Liga, Aufgaben, Erfolge)
* Mascot.jsx: Maskottchen Mila (SVG)
* courses1.js: Deutsch, Englisch, Spanisch, Französisch
* courses2.js: Russisch, Polnisch, Züridütsch, Italienisch, Irisch
* styles.js: CSS, läuft im Shadow DOM
* entry.jsx: Einstieg

Bauen (im Ordner src/grammarfirst):

    npm i react@18.3.1 react-dom@18.3.1 esbuild@0.23.1
    npx esbuild entry.jsx --bundle --minify --format=iife --jsx=automatic --define:process.env.NODE_ENV='"production"' --target=es2019 --outfile=../../grammarfirst/app.js

Neue Lektion: in courses1.js oder courses2.js eine Lektion mit eindeutiger id, rule, structure, examples, tip und ex (Aufgaben mit ch, bu, ty, ma) ergänzen.
