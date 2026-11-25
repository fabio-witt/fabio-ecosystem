# Nächste Schritte für das Fabio Ecosystem

Alles Folgende trägst du in **`shared-assets/site-config.js`** ein. Leere Felder bleiben unsichtbar, es erscheint nichts Halbfertiges.

## 1. Online-Buchung (Cal.com, gratis)
1. Konto auf cal.com erstellen und zwei Termin-Typen anlegen:
   - „Probelektion Sprachkurs“ (30 oder 60 Min.)
   - „SAP-Erstgespräch“ (30 Min.)
2. Die beiden Links eintragen:
   ```js
   booking: { sprachkurse: "https://cal.com/DEIN-NAME/probelektion", sap: "https://cal.com/DEIN-NAME/sap-erstgespraech" }
   ```
3. Dann erscheinen automatisch die Knöpfe „📅 Probelektion im Kalender buchen“ (Sprachkurse) und „📅 30-Min-Erstgespräch buchen“ (SAP Services).

## 2. Kundenstimmen
Nur echte Stimmen, mit Einverständnis der Person:
```js
references: {
  sprachkurse: [{ quote: "…", name: "Anna M.", role: "Deutsch B2, Zürich" }],
  sap: [{ quote: "…", name: "Thomas K.", role: "Leiter Supply Chain, Maschinenbau" }],
  services: [{ quote: "…", name: "Hotel …", role: "Drohnenfilm" }]
}
```

## 3. Drohnen- und Video-Portfolio
YouTube-, Vimeo- oder .mp4-Links (z. B. „nicht gelistet“ auf YouTube hochladen):
```js
portfolio: [{ title: "Hotel am See – Drohnenfilm", url: "https://youtu.be/…" }]
```
Erscheint auf „Weitere Services“ bei „Drohne & Foto“.

## 4. Eigene Domain
1. Domain kaufen (z. B. fabio-witt.com bei Cloudflare oder Porkbun).
2. In Vercel: Projekt → Settings → Domains → Domain hinzufügen und die DNS-Einträge beim Anbieter setzen.
3. Im Repo-Ordner im Terminal: `python3 tools/set-domain.py https://fabio-witt.com`
4. Mit GitHub Desktop committen und pushen.

## 5. GrammarFirst
`/grammarfirst` und `/grammarfirst/premium` leiten jetzt auf `/lingora/` um. Die Swiss-German-Guides bleiben unter `/grammarfirst/swiss-german/` und werben für Lingora. Die App selbst bleibt unter `/grammarfirst/lingora/`.
