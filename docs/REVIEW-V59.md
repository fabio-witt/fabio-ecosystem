# Offene Punkte, die nur du entscheiden kannst

1. **Impressum fehlt.** Alle drei Impressum-Seiten (`/impressum`, `/dachwerk/impressum`, `/sprachschule/impressum`) enthalten noch Platzhalter wie `[Anschrift]` und `[E-MAIL-ADRESSE]`. Die Seite ist öffentlich live und bietet kostenpflichtige Leistungen an. Bitte Name der Einzelfirma, Adresse, E-Mail und UID eintragen.
2. **Positionierung "Senior".** Die Startseite nennt dich "Senior SAP S/4HANA Supply Chain Consultant", dein CV nennt 3 Jahre SAP. Prüfen, ob du das so stehen lassen willst.
3. **"37 SAP-/Tech-Zertifizierungen"** auf der Startseite: Zahl mit LinkedIn abgleichen.
4. **E-Mail-Adressen uneinheitlich.** Formulare und Website nutzen `fabiowitt@gmx.de`, der CV `fabiowitt@gmx.ch`. Eine Adresse festlegen.
5. **Formulare über FormSubmit.** Funktioniert erst, wenn du die Aktivierungsmail von formsubmit.co an `fabiowitt@gmx.de` bestätigt hast. Einmal selbst testen.
6. **Netlify-Reste.** `data-netlify-honeypot` und `dachwerk/netlify.toml` haben auf Vercel keine Wirkung. Die Readiness-Formulare (`readiness-download.html`) senden ihre Daten deshalb nirgendwohin, sie leiten nur weiter.
7. **Ordner voller Audit-Dateien.** `V37...V51-*-AUDIT.txt`, `FILE-MANIFEST`, alte Release Notes und `dachwerk/START-WEBSITE.html` sind öffentlich abrufbar. Am besten in einen Ordner `docs/` verschieben oder löschen.
8. **CV öffentlich.** Der hinterlegte Lebenslauf enthält deine Telefonnummer. Wenn du das nicht willst, eine Version ohne Telefonnummer hochladen.
