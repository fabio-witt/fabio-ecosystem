# Lingora für App Review vorbereiten

## 1. Supabase

1. Die Migrationen in `supabase/migrations` chronologisch auf die Testinstanz anwenden. Der Checkout enthält Änderungen für eine bereits vorhandene Datenbank. Eine leere Instanz braucht zuerst das vollständige Basisschema.
2. Die Edge Function `delete-account` im Testprojekt bereitstellen. Im Projektordner `npx supabase functions deploy delete-account --project-ref DEIN_TESTPROJEKT --no-verify-jwt` ausführen. Die Funktion prüft das Benutzer-Token bei jedem Löschaufruf selbst mit Supabase Auth. Die privilegierten Schlüssel bleiben in der Edge Function.
3. Mit zwei Testkonten Registrierung, Profilsicht, Beiträge, Kommentare, Chat, Meldung und Blockierung in beide Richtungen testen. Mit einem separaten, entbehrlichen Konto samt alten Uploads die Kontolöschung prüfen. In **Authentication → Users**, **Table Editor** und **Storage** prüfen, dass das Testkonto und seine Daten entfernt wurden.
4. Vor dem Produktionsrelease dieselben Migrationen und die Funktion in der Produktionsinstanz bereitstellen. Auth-Weiterleitung für die iOS-App prüfen und den E-Mail-Versand für externe Empfänger testen.

## 2. Moderation betreiben

In Supabase **SQL Editor → New query** öffnen. Zugriff auf die Meldungen auf die mit der Moderation betrauten Personen beschränken.

```sql
select id, created_at, target_kind, target_id, subject_id, reason, evidence
from private.content_reports
where reviewed_at is null
order by created_at
limit 100;
```

Meldungen und die Support-Adresse `fabiowitt@gmx.de` täglich prüfen und dringende Meldungen priorisieren. Verstossende Inhalte entfernen, betroffene öffentliche Dateien in Storage löschen und bei Missbrauch das Konto unter **Authentication → Users** sperren. Den Abschluss mit einer kurzen Begründung festhalten.

```sql
update private.content_reports
set reviewed_at = now(), resolution = 'Action taken or reason for dismissal'
where id = 123 and reviewed_at is null;
```

Den Textfilter anhand der Meldungen pro Sprache pflegen. Er deckt zunächst einige eindeutige Gewaltandrohungen ab. Neue Bild-Uploads sind in der App und in Supabase pausiert. Vorhandene Profil- und Beitragsbilder vor Freigabe sichten. Texte können auch durch Umgehungen des Filters auffallen und gemeldet werden.

## 3. Öffentliche Seiten

- Die App stellt `/privacy`, `/support` und `/community-guidelines` ohne Login bereit. Unter einer öffentlich erreichbaren HTTPS-Adresse bereitstellen und im ausgeloggten Browser öffnen.
- Den Entwurf der Datenschutzerklärung vor Veröffentlichung anhand des tatsächlichen Betreibers, des Landes, des Supabase-Projekts und der Datenaufbewahrung vervollständigen. Das schliesst Backup-Fristen und den Umgang mit Moderationsmeldungen ein.
- In **App Store Connect → App Privacy** die veröffentlichte Datenschutz-URL und die tatsächlichen Datenkategorien angeben. Für **Support URL** die öffentliche Support-Seite verwenden.
- Rechte für die importierten GrammarFirst-Lerninhalte und die Distributionsbedingungen der Wortlisten prüfen.

## 4. iOS-Build und Einreichung

1. **Apple Developer** und **App Store Connect** einrichten. Die vorgesehene Bundle-ID `ch.lingora.app` vor dem ersten Upload auf Verfügbarkeit prüfen und mit dem App-Datensatz abgleichen.
2. In Expo das Projekt verbinden und in der EAS-Umgebung **production** `EXPO_PUBLIC_SUPABASE_URL` sowie `EXPO_PUBLIC_SUPABASE_ANON_KEY` hinterlegen. Nur den öffentlichen Supabase-Schlüssel verwenden.
3. Im Projektordner `npx eas-cli@latest build --platform ios --profile production` starten. Anschliessend `npx eas-cli@latest submit --platform ios --profile production` ausführen.
4. In **App Store Connect → Apps → Lingora → TestFlight** den Build auf einem echten iPhone prüfen. Der Upload stellt den Build für TestFlight bereit.
5. In App Store Connect die iPhone-Screenshots, Beschreibung, Altersfreigabe, Datenschutzangaben und Kontaktinformationen vervollständigen. Unter **App Review Information** Zugangsdaten für ein aktives Prüf-Konto und ein separates Konto zum Prüfen der Löschung hinterlegen. Das Backend muss während der Prüfung verfügbar sein.
6. Den geprüften Build auswählen, **Add for Review** klicken und anschliessend die Einreichung auslösen.

## English review notes

Lingora is a language-learning app with a community feed and one-to-one language exchange. Open **Learn**, choose a language and start a lesson. In **Discover**, choose **Connect**, then **Message** on the profile to open a chat.

Report a profile, post, comment or message using its **Report** button. **Block user** is available on profiles and in chats. Blocked users can be managed under **Profile → Settings → Blocked users**. Moderation reports are reviewed by the app operator. Contact information and rules are available under **Settings**.

To verify account deletion, use the separate deletion test account and go to **Profile → Settings → Delete account**. Type **DELETE** and select **Permanently delete account**.
