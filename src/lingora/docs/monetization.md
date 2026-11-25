# Lingora monetarisieren

Lingora verdient auf zwei Wegen Geld. Beide sind im Code fertig; aktiv wird Plus erst, wenn du die Schritte unten machst.

## 1. Spenden (aktiv)

Profil → ⭐ VIP öffnet die Spendenseite mit PayPal.me (`src/features/vip/donation.ts`, Name `fabbels`).

## 2. Lingora Plus (Abo über Stripe)

### Das Preismodell (Freemium)

| | Gratis | Plus |
|---|---|---|
| A1 in jeder Sprache | ✓ komplett | ✓ |
| Lektionen A2–C2 | 3 neue pro Tag (Wiederholen gratis) + max. 2 extra für je 40 💎 | unbegrenzt |
| Herzen | 5 (1 alle 30 Min., zurück durch Fehler korrigieren) | ∞ |
| KI-Gesprächspartner | 10 Nachrichten/Tag | 150/Tag |
| Wortstationen, Reviews, Niveautests, Community | ✓ | ✓ |
| Edelsteine & Saison-Belohnungen | ×1 | ×2 |
| Plus-Outfits & Abzeichen | – | ✓ |

**Preise** (`src/features/plus/config.ts`):
- Monatlich **CHF 9.90**
- Jährlich **CHF 59.90** (= CHF 4.99/Monat, −50 %) mit **7 Tagen gratis** → Standard-Plan, oben hervorgehoben
- Lebenslang **CHF 149** einmalig („Gründer-Angebot“, nur am Anfang; später entfernen oder teurer machen)

**Warum so:** A1 gratis ist der Köder (Nutzer erleben Lernkarten, Sounds, Streak, Community). Das Tageslimit ab A2 trifft genau die motivierten Nutzer, die bereit sind zu zahlen, ohne Gratis-Nutzer auszusperren (Wiederholen, Reviews und Edelstein-Freischaltung bleiben). Die Paywall erscheint an drei natürlichen Stellen: Tageslimit erreicht, Herzen leer, KI-Limit erreicht.

**Wichtig:** Das Tageslimit ist erst aktiv, sobald mindestens ein Payment Link eingetragen ist (`paywallActive`). Vorher bleibt alles gratis, damit niemand vor einer Bezahlwand ohne Bezahlmöglichkeit steht. Das Limit wird in der App geprüft; die Inhalte selbst sind nicht geheim.

### Einrichten (ca. 30 Minuten)

1. **Stripe-Konto** auf stripe.com anlegen und verifizieren.
2. **Produkt „Lingora Plus“** anlegen mit drei Preisen: CHF 9.90 monatlich (wiederkehrend), CHF 59.90 jährlich (wiederkehrend), CHF 149 einmalig (Lifetime).
3. Für jeden Preis einen **Payment Link** erstellen. Beim Jahres-Link **„Kostenlose Testphase: 7 Tage“** aktivieren. Als Weiterleitung nach der Zahlung die Lingora-Adresse eintragen (`…/grammarfirst/lingora/plus`).
4. Die drei Link-Adressen in `src/features/plus/config.ts` bei `monthly.url`, `yearly.url` und `lifetime.url` eintragen. Den Link zum Stripe-Kundenportal bei `manageUrl`. Für Lifetime zusätzlich die ID des Payment Links (`plink_…`) als Secret `STRIPE_LIFETIME_LINK` setzen (siehe Schritt 7).
5. **Webhook-Funktion deployen** (JWT-Prüfung aus, die Funktion prüft Stripes Signatur selbst):
   `supabase functions deploy stripe-webhook --no-verify-jwt`
6. In Stripe unter Entwickler → Webhooks einen Endpunkt anlegen:
   `https://<projekt>.supabase.co/functions/v1/stripe-webhook`
   Ereignisse: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`.
7. **Secrets setzen:**
   `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_… STRIPE_SECRET_KEY=rk_… STRIPE_LIFETIME_LINK=plink_…`
   (ein eingeschränkter Schlüssel mit Leserecht auf Subscriptions genügt).
8. Lingora Web neu bauen und hochladen. Zuerst mit Stripes Testmodus und Testkarte prüfen.

### So funktioniert es

- Die App hängt die Benutzer-ID als `client_reference_id` an den Payment Link.
- Nach der Zahlung ruft Stripe den Webhook auf. Der trägt die Mitgliedschaft in `plus_members` ein (Quelle `stripe`, Ablaufdatum = Ende des bezahlten Zeitraums + 2 Tage Kulanz).
- Verlängerungen (`invoice.paid`) schieben das Ablaufdatum weiter, eine Kündigung beendet Plus zum Periodenende.
- Die App kann `plus_members` nur lesen. Schreiben darf nur der Server.

### Plus von Hand vergeben (Tests, Freunde, Gewinnspiele)

```sql
insert into public.plus_members (user_id, tier, source, expires_at)
values ('<user-id>', 'plus', 'promo', now() + interval '1 year')
on conflict (user_id) do update set tier = excluded.tier, source = excluded.source, expires_at = excluded.expires_at;
```

### Rechtliches vor dem Start

- Impressum mit Name und Adresse (Pflicht in CH/DE bei kommerziellem Angebot).
- AGB und Datenschutz sind in der App (`/terms`, `/privacy`). Lass sie vor dem Verkaufsstart juristisch prüfen.
- Mehrwertsteuer: Stripe Tax kann das übernehmen.
- In den nativen iOS-/Android-Apps müssen digitale Abos über Apple/Google laufen. Der Stripe-Weg gilt für die Web-App.
