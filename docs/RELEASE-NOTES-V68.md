# GrammarFirst v68

## Neu in der App
* Konto per E-Mail-Link (ohne Passwort) und Synchronisation des Fortschritts zwischen Geräten. Backend: Supabase, Projekt "grammarfirst", Region Zürich (eu-central-2). Daten werden nur mit Row Level Security pro Nutzer gespeichert.
* Anonyme Nutzungsstatistik (zufällige ID, keine Cookies, abschaltbar in den Einstellungen). Auswertung in den Views analytics.daily, analytics.retention (D1, D7, D30), analytics.dropoff und analytics.courses.
* Wortschatz-Karteikarten aus den fertigen Lektionen (Leitner-Boxen 0, 1, 3, 7, 21 Tage).
* Dunkelmodus (automatisch, hell oder dunkel) in den Einstellungen.
* Tabellenzellen werden in der englischen Erklärsprache übersetzt, ausser in Spalten mit Hochdeutsch, Züridütsch, Partizip, Infinitiv, Perfekt, Verkleinerung oder Grundwort.
* Deep Link /grammarfirst/?course=gsw wählt den Kurs beim Onboarding vor.

## Neu auf der Website
* AGB (/agb), Datenschutz um Konto (5a) und Statistik (5b) ergänzt.
* Englische Landingpage /grammarfirst/swiss-german ("Swiss German for Expats") und 26 Grammatikseiten /grammarfirst/swiss-german/<regel>, alle in der Sitemap.
* Neue Leseproben der Grammatikhefte.
* Mikrofon für die Spracherkennung erlaubt (Permissions-Policy microphone=(self)).

## Noch im Supabase-Dashboard zu tun
1. Authentication, URL Configuration: Site URL und Redirect URL auf https://fabio-ecosystem-ashy.vercel.app/grammarfirst/ setzen.
2. Authentication, SMTP: eigenen Mailversand einrichten (zum Beispiel Resend), sonst gehen Login-Links nur an Team-Mitglieder.

## Tests
* Alle 222 Lektionen in Englisch, Züridütsch und Deutsch in deutscher Erklärsprache automatisch durchgespielt, keine Fehler.
* Landingpage, Regelseite, AGB und Deep Link auf 390 px Breite ohne horizontales Scrollen.
