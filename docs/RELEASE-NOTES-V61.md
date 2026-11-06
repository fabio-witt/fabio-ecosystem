# v61

- CV ohne Telefonnummer (englische Version vom 03.11.2026).
- Neuer Navbar-Tab GrammarFirst auf allen Seiten, App unter /grammarfirst/ (React gebündelt, ohne Build-Schritt auf Vercel).
- Kontraste: 21 Grün- und Grautöne leicht abgedunkelt, alle Texte erreichen jetzt WCAG AA (4.5:1).
- Google Translate lädt nur noch, wenn Englisch oder Russisch gewählt ist (vorher auf jeder Seite, blockierte rund 0,4 s).
- Barrierefreiheit: Sprungmarke "Zum Inhalt springen" auf 20 weiteren Seiten, Logo-Link ohne irreführendes aria-label, Überschriften-Reihenfolge, Toolchain-Rail ohne falsche Tab-Rolle.
- 113 Bilder mit Breite und Höhe, damit beim Laden nichts springt.
- Favicon auf 21 Seiten ergänzt, defekter Favicon-Pfad im DACHWERK-Manifest korrigiert, Apple-Touch-Icon.
- Eigenes Vorschaubild für LinkedIn und WhatsApp (1200 x 630).
- Überschrift h1 auf Impressum und SPRACHWERK-Danke-Seite, defektes Hintergrundbild im SPRACHWERK-Blog ersetzt.
- Cache-Header: CSS und JS 1 Stunde, Bilder 7 Tage, jeweils mit Hintergrund-Aktualisierung.
- Datenschutz: Hinweis auf Google Fonts der Seite GrammarFirst.

Lighthouse lokal, vorher / nachher (mobil):
Startseite Performance 95/98, Barrierefreiheit 94/96, Best Practices 96/100
DACHWERK 78/84, 92/100, 93/100
SPRACHWERK 99/99, 96/100, 96/100
LERNWERK 93/98, 94/100, 100/100
