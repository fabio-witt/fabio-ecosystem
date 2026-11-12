# Lingora monetarisieren

Lingora verdient auf zwei Wegen Geld. Beide sind im Code fertig; aktiv wird Plus erst, wenn du die Schritte unten machst.

## 1. Spenden (aktiv)

Profil → ⭐ VIP öffnet die Spendenseite mit PayPal.me (`src/features/vip/donation.ts`, Name `fabbels`).

## 2. Lingora Plus (Abo über Stripe)

Vorteile, die heute funktionieren: unbegrenzte Herzen, doppelte Edelsteine, exklusive Medved-Outfits, Plus-Abzeichen. Die Liste steht in `src/features/plus/config.ts` (`PLUS_BENEFITS`). Trage dort nur Vorteile ein, die es wirklich gibt.

### Einrichten (ca. 30 Minuten)

1. **Stripe-Konto** auf stripe.com anlegen und verifizieren.
2. **Produkt „Lingora Plus“** anlegen mit zwei wiederkehrenden Preisen (monatlich, jährlich).
3. Für jeden Preis einen **Payment Link** erstellen. Als Weiterleitung nach der Zahlung die Lingora-Adresse eintragen (`…/grammarfirst/lingora/plus`).
4. Die beiden Link-Adressen in `src/features/plus/config.ts` bei `monthly.url` und `yearly.url` eintragen und die Preise dort anpassen. Optional den Link zum Stripe-Kundenportal bei `manageUrl`.
5. **Webhook-Funktion deployen** (JWT-Prüfung aus, die Funktion prüft Stripes Signatur selbst):
   `supabase functions deploy stripe-webhook --no-verify-jwt`
6. In Stripe unter Entwickler → Webhooks einen Endpunkt anlegen:
   `https://<projekt>.supabase.co/functions/v1/stripe-webhook`
   Ereignisse: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`.
7. **Secrets setzen:**
   `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_… STRIPE_SECRET_KEY=rk_…`
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
