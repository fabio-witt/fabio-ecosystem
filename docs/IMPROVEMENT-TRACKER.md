# Ecosystem improvement tracker

This is an implementation tracker, not a claim that the product is production-ready.

## Completed in this batch

- Editable Lingora source consolidated under `src/lingora` without private environment files or Git history.
- Export builder defaults to the included source and supports public build environment variables.
- Root release-check script and GitHub workflow for typing, lint, tests, content, translations and links.
- Guided conversation steps emphasizing turn-taking, consent for corrections and useful expressions.
- Previously implemented review choices, combo counters and social mission drafts preserved in the included source.

## Remaining priorities from the top 50

1. Consolidation: implemented; verify the first clean CI run.
2. Release automation: implemented; production deployment automation still pending.
3. Real-browser critical journey tests: pending.
4. Deployed account-isolation tests: pending; use dedicated test accounts.
5. Active payment lifecycle verification: pending; use test-mode payment credentials.
6. First-five-minutes usability improvements: pending observation and implementation.
7. Product naming and relationship: pending editorial changes.
8. Recommended next action: existing home hero; expanded prioritization pending.
9. Operational monitoring and alerts: pending provider/account configuration.
10. Domain migration: pending chosen domain and DNS access.
11. Weekly learning plan: pending.
12. Answer-specific explanations: existing content; systematic review pending.
13. Lesson-to-conversation connection: existing task links; broader coverage pending.
14. Correction learning loop: existing saved review; outcome tracking pending.
15. Weakness dashboard: pending refinement.
16. Explainable placement: pending.
17. Goal-specific paths: existing goal ordering; curated paths pending.
18. Speaking feedback: pending assessment and UX improvements.
19. Offline availability indicators: pending.
20. Accessible exercise alternatives: pending browser/device audit.
21. Mastery reward balance: pending.
22. Weekly journey: pending.
23. Comeback sessions: pending.
24. Cooperative challenges: existing team quests; balance verification pending.
25. Challenge variety: existing games; rotation improvements pending.
26. Personal bests: pending.
27. Milestone cosmetics: pending.
28. Reward transparency: pending.
29. Untimed practice preference: pending.
30. Reward exploitation tests: pending.
31. Partner matching: reciprocal explanations and filters exist; expanded preferences pending.
32. Structured invitation states: pending server-backed model; current invitations are text drafts.
33. Mutual conversation preferences: pending.
34. Guided exchanges: basic shared steps implemented; per-mission roles and progress pending.
35. Practice circles: existing clubs; discovery improvements pending.
36. Correction explanation UI: pending review.
37. Helpfulness recognition: pending abuse-resistant design.
38. Visibility/contact controls: pending complete access-model review.
39. Moderation consistency: pending browser/database acceptance checks.
40. Meaningful social analytics: pending consent and server event design.
41. Focused business landing pages: existing sections; copy/navigation refinement pending.
42. Inbox delivery verification: pending recipient confirmation.
43. Teaching integration: pending.
44. Verifiable Plus benefits: pending live entitlement review.
45. Content-to-exercise links: pending.
46. Mobile performance measurement: pending live baseline.
47. Shared design foundation: existing assets; standardization pending.
48. Legacy archival: pending dependency verification; do not remove legacy endpoints blindly.
49. Documentation: updated build and operations guidance; historical cleanup pending.
50. Feedback routine: pending process and reporting integration.

## Release constraints

No domain purchase, DNS change, production database migration, deployment or live payment has been performed. Do not treat static SQL assertions as proof of deployed RLS. Never use real users for destructive account-deletion tests. The separate `/Users/fabiowitt/Lingora` copy is now historical for this ecosystem; develop the included source instead.
