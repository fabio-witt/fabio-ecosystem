# GrammarFirst neu bauen

Nach Änderungen an App.jsx:

    npm i react@18.3.1 react-dom@18.3.1 esbuild@0.23.1
    npx esbuild entry.jsx --bundle --minify --format=iife --jsx=automatic --define:process.env.NODE_ENV='"production"' --target=es2019 --outfile=../../grammarfirst/app.js
