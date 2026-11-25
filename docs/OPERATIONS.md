# Ecosystem operations

## Active architecture

- `/`: portfolio and audience selection.
- `/dachwerk/`: SAP consulting.
- `/sprachschule/`: language teaching.
- `/lingora/`: language-app marketing.
- `/grammarfirst/`: React learning application; source in `src/grammarfirst`.
- `/grammarfirst/lingora/`: committed Expo web export from the editable source in `src/lingora`.
- `/sprachlernapp/*`: legacy implementation, redirected to GrammarFirst on Vercel. Its payment functions are not evidence of the current Lingora payment implementation.
- Forms use FormSubmit. Delivery must be tested with the recipient account.
- GrammarFirst learning uses Lingora's public Supabase configuration; analytics/waitlist use a separate project (see cloud.js). Public keys are intentional; authorization must be enforced by RLS.

## Supported deployment

Use Vercel with the repository root and existing committed static exports. No root build command is required to deploy these exports. Routing depends on vercel.json; other hosts require equivalent configuration. .vercelignore excludes development files and generated personal documents.

To rebuild GrammarFirst: follow src/grammarfirst/BUILD.md. To rebuild Lingora use `src/lingora` with its dependencies installed. Do not overwrite the committed export unless that build succeeds. Pin and record the source commit when releasing; the source is now included in this repository; public environment configuration is still required.

## Local release checks

    python3 scripts/check-site.py
    node --test tests/reliability.test.cjs
    node --check grammarfirst/app.js
    node --check src/grammarfirst/build-lingora.cjs

## Production acceptance gates (not yet verified)

1. Test the contact form and confirm actual inbox delivery.
2. Register a new account, confirm email, reset password, sign out and back in.
3. Complete a lesson; verify progress after reload and on a second device.
4. With two test accounts, verify private profile/progress/chat data cannot cross accounts, including direct database requests.
5. In Stripe test mode, verify purchase, renewal, duplicate webhook, failed payment, cancellation and entitlement expiry. Confirm which backend the active app uses before deploying legacy functions.
6. Export/delete a test account and verify expected server data handling.
7. Test keyboard navigation, mobile layout, audio/microphone permission denial and offline recovery.
8. Test direct links to app lessons and auth callbacks through Vercel rewrites.

## Domain launch

Choose the domain before changing canonical URLs. Configure hosting DNS and HTTPS, then update sitemap/canonical/social URLs together. Set exact Supabase auth redirect URLs and site URL. Authenticate the SMTP sender domain and test password-reset delivery. Configure payment return URLs and webhook secrets server-side.

## Monitoring and recovery

Choose an error-monitoring account and configure alerts without logging passwords, tokens or private messages. Monitor home, app shell, registration and payment webhook health. Confirm database backup coverage and perform a restore into a non-production project. Retain the last working deployment for rollback; never run destructive database changes without a recovery plan.

## Product priorities

Keep consulting, teaching and learning funnels distinct. Measure enquiry delivery, first lesson completion, next-day and weekly returns, and paid conversion before expanding courses or paid acquisition. Do not invent credentials, testimonials, language levels or learning outcomes. Archive legacy implementation only after verifying redirects, historical links and production backend dependencies.

## Current development source

Use `src/lingora`, not the external historical checkout. Run `scripts/check-release.sh` from the repository root. Full improvement status is tracked in `docs/IMPROVEMENT-TRACKER.md`.
