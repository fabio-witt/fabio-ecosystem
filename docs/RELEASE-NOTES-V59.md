# v59: Vercel, SEO und Aufräumen

## Behoben
- Vercel: `vercel.json` mit `cleanUrls` ergänzt. Vorher lieferten rund 30 interne Links ohne `.html` (z. B. `/datenschutz`, `/impressum`, `/dachwerk/sap-glossar`, `/sprachlernapp/pricing`, alle Sprachseiten und Downloads) auf Vercel einen 404. Die Weiterleitungen aus `_redirects` (Cloudflare/Netlify) sind für Vercel übernommen.
- CV-Download: `downloads/Fabio-Witt-CV.pdf` fehlte, der Link auf allen 61 Seiten lief ins Leere. Jetzt ist der aktuelle Lebenslauf hinterlegt.
- PayPal: Solange keine echte Button-ID eingetragen ist, wird der Spendenbereich ausgeblendet statt beim Klick eine technische Fehlermeldung zu zeigen.

## SEO
- `sitemap.xml` neu, `robots.txt` verweist darauf.
- Canonical-URL auf allen indexierbaren Seiten.
- Meta-Description auf 14 Seiten ergänzt, die keine hatten.
- OpenGraph-Tags (Titel, Beschreibung, Bild) auf 39 Seiten ergänzt, damit Links in LinkedIn und WhatsApp mit Vorschau erscheinen.
- `noindex` für Danke-Seiten, 404-Seiten, Lehrer-Dashboard, Download-Bestätigung und die lokale Vorschau.

## Sicherheit
- Security-Header über `vercel.json` (nosniff, Referrer-Policy, Frame-Schutz, Permissions-Policy).

## Hinweis Domain
Canonical, Sitemap und OpenGraph zeigen auf `https://fabio-ecosystem-ashy.vercel.app`. Bei einer eigenen Domain alle Vorkommen dieser Adresse ersetzen.

## v59.1 Hotfix
- `trailingSlash: false` aus `vercel.json` entfernt. Diese Einstellung leitete `/dachwerk/` auf `/dachwerk` um, dadurch fanden die Unterseiten ihre CSS- und Bilddateien nicht mehr.
- Alle internen Links, Bilder, Styles und Skripte auf absolute Pfade umgestellt (`/dachwerk/styles.css` statt `styles.css`). Die Seiten funktionieren jetzt mit und ohne Schrägstrich am Ende.
