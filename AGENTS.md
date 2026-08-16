# Thanzi Guide — Project Status

_Last updated: 2026-08-16. Generated from the repository (commit `8bf1351`) and prior working sessions. Nothing below is claimed as done unless there is code, a config file, or a successful command output backing it up._

## What this project is

Thanzi Guide is a consumer nutrition/health PWA for Malawi (React + TypeScript + Vite, Appwrite backend, Tailwind styling). Development happens entirely from an Android device via Termux — no laptop. The app covers food data, health/fitness education content, life-stage guidance, recipes, provider directory + booking, and an admin Content Manager.

---

## Completed

Evidence: present in code, routed in `App.tsx`, and/or confirmed by a successful build or a successful Appwrite API response in this session.

**Core content browsing**
- Foods, Health topics/subtopics, Fitness topics/subtopics, Recipes, Kids stages, For Women/For Men/Seniors life-stage pages, Articles ("Learn"), Courses + Lessons — all have list/detail routes wired.
- Home page has Featured Articles and Explore More sections.
- Search route exists.
- Tools: BMI calculator, Energy estimator.

**Admin Content Manager**
- Schema-driven CRUD (`src/lib/contentSchemas.ts` + `ContentManager.tsx` / `ContentTypeList.tsx` / `ContentForm.tsx`) covering: articles, foods, courses, health-topics, health-subtopics, fitness-topics, fitness-subtopics, recipe-categories, recipes, kids-stages, providers, categories, lessons, quizzes, questions, answers, references, life-stage-pages.
- Draft/publish workflow for content types that use it; providers use their own active/inactive status instead.
- References content type now supports an admin-uploaded file attachment (PDF/DOCX/TXT/CSV) alongside the existing external-URL field, gated to `label:admin` only. Confirmed working end-to-end this session against the live Appwrite project (attributes added, permissions locked, bucket reachable).
- Public `/references` page lists published references with View/Download links, linked from the footer.

**Provider directory & booking**
- Providers listed under Care, with detail pages, self-service claim flow (Appwrite Function), self-service profile editing and photo upload after claiming.
- Provider availability slot management (add/delete).
- In-app messaging between patients and providers tied to appointments, with notifications for new messages/bookings/cancellations. Message read-permission bug (cross-user grants) was found and fixed.
- 4 fictional test providers seeded for QA.

**Auth & accounts**
- Login/Signup, protected routes, admin-only routes, provider-only routes, Dashboard, Settings, account page shows a Provider badge once claimed.

**Partner inquiries**
- Partner page + admin inbox to view submitted partner inquiries.

**Infrastructure**
- Chakudya API (separate Cloudflare Worker project) confirmed reachable and returning food data via `curl` this session.
- `npm ci` build failure (lockfile out of sync after `mammoth`/`pdfjs-dist` were added) — fixed and verified with a clean `npm run build`.
- Storage: the Appwrite plan on this project allows **exactly one bucket**. Confirmed by listing buckets live — only `food_images` actually exists; `avatars`, `article_images`, and `reference_files` were declared in code/config but were **never actually created**, meaning provider avatar uploads were silently broken until this was found and fixed this session. All uploads (provider avatars, admin reference documents) now consolidated onto the single `food_images` bucket, distinguished by allowed file extensions and per-role create permissions. This fix has been pushed but its live effect has not yet been confirmed by an actual test upload (see "In progress").

---

## In progress

- **Verifying the bucket consolidation actually works end-to-end.** The `consolidate-media-bucket.sh` migration script and the corresponding code changes are written and pushed (commit `8bf1351`), but no one has yet confirmed by testing that (a) a regular user can upload a profile picture, or (b) an admin can upload a reference document, against the reconfigured `food_images` bucket. This is the immediate next step.
- **Removal of the per-user "Further Reading & References" self-upload feature.** The UI (`ReferencesSection.tsx`), and its supporting libraries (`references.ts`, `referenceExtraction.ts`) have been deleted, and the `user_references` / `reference_chunks` Appwrite collections have been locked to `create("label:admin")` — confirmed via live API response. This feature is now fully decommissioned rather than "in progress," but is listed here as a flag: any data already sitting in `user_references` / `reference_chunks` from before the lockdown has not been reviewed or cleaned up.

---

## Blocked

- **Appwrite plan bucket limit.** The current plan allows only 1 storage bucket total. This blocks having separate buckets for different content types (images vs. documents vs. avatars) going forward; the current workaround is sharing one bucket by extension/permission. Per Edison, upgrading the plan is not affordable right now. Any future feature needing genuinely separate storage isolation (e.g. different retention/backup policies per content type) is blocked on this.

---

## Planned / not started

Evidence: routed to a `ComingSoon` placeholder, or referenced only as a stated future intent, not represented in code.

- **`/about` page** — currently renders `ComingSoon`. No content built yet.
- **AI-grounded "Ask" chat feature** — the `/ask` route exists but only shows a static "This is on the way — check back soon" message. Edison has stated intent to build his own RAG system for this (distinct from the removed per-user upload approach) — no implementation exists yet.
- **Premium features** — not implemented. Prior stated intent: reuse the PayChangu Cloudflare Worker payment gateway rather than building a separate payment integration, when this is eventually built.
- **Native device / Health Connect / Web Bluetooth sync** — explicitly deprioritized; stated intent is to revisit only once a Capacitor native build exists, since Health Connect integration is native-only.
- **Unused dependencies** — `mammoth` and `pdfjs-dist` remain in `package.json` after the self-upload feature that used them was removed. Left in place deliberately (unused weight only, not shipped to the bundle since nothing imports them anymore) — full removal from `package.json`/lockfile has not been done.

---

## Notes for whoever (human or agent) picks this up next

- Termux/Android-only workflow: no wrangler CLI, no local `appwrite deploy` — schema changes go live via one-off `curl`-based scripts in `scripts/`, and `appwrite.json` is meant to mirror actual backend state, but has been found to drift from reality before (see the bucket discovery above) — verify against a live `GET` before trusting it blindly.
- Two Appwrite API keys with broad scopes were generated and used in-chat this session for one-off migrations. Confirm they were rotated/revoked in Appwrite Settings → API Keys — this file does not verify that for you.
