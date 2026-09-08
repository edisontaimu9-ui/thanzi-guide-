# Thanzi Guide 🇲🇼

Learn about your health. Understand your food. Make better choices.

A Malawi-focused health and nutrition education platform — courses, articles,
a local food database, health tools, and an admin console for content review.
Separate from the existing Thanzi tracker app.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- Appwrite (Auth, Databases, Storage) as the backend
- react-router-dom
- vite-plugin-pwa for installability/offline support

## 1. Install dependencies (Termux)

```bash
pkg install nodejs-lts   # if not already installed
cd thanzi-guide
npm install
```

## 2. Set up Appwrite

1. Create a project in the Appwrite Console (or self-hosted instance).
2. Install the Appwrite CLI if you don't have it:
   ```bash
   npm install -g appwrite-cli
   appwrite login
   ```
3. From this folder, push the schema in `appwrite.json`:
   ```bash
   appwrite deploy collection
   appwrite deploy bucket
   ```
   `appwrite.json` defines the `thanzi_guide` database with 13 collections
   (profiles, categories, foods, articles, courses, lessons, quizzes,
   questions, answers, user_progress, bookmarks, favorites, references) and
   3 storage buckets. Review the generated resources in the console —
   Appwrite CLI schema syntax shifts between versions, so double-check
   attribute types landed as expected before moving on.
4. **Roles**: collection permissions reference labels (`label:editor`,
   `label:nutrition_expert`, `label:admin`). Appwrite doesn't create these
   automatically — assign labels to users via the console (Auth → user →
   Labels) or a server-side function using the Users API. A profile
   document's `role` attribute is the source of truth for what the *app*
   shows; the label is what Appwrite's permission engine actually checks.
   Keep the two in sync when you build the admin user-management screen.

## 3. Configure environment

```bash
cp .env.example .env
```

Fill in `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, and
`VITE_APPWRITE_DATABASE_ID` (`thanzi_guide` if you kept the default).

## 4. Run it

```bash
npm run dev
```

Visit the printed local URL. Signup, login, logout, and a protected
`/dashboard` route are wired up against Appwrite Auth already — that's
what to test first.

## Project structure

```
src/
  lib/            Appwrite client, auth context, shared config
  components/     Reusable UI (layout/, ui/)
  routes/         Page-level components
  hooks/          Shared React hooks (empty for now)
  types/          Shared TypeScript types (empty for now)
appwrite.json     Appwrite CLI schema: database, collections, buckets
```

## Build order

This is being built step by step:

1. **Foundation** (this step) — scaffold, Appwrite schema, env config
2. Auth — done at the wiring level (signup/login/logout/protected routes);
   password reset and email verification UI still to build
3. Layout/nav + homepage design
4. User dashboard (real data)
5. Food database
6. Articles/knowledge base
7. Search
8. Learning system (courses/quizzes)
9. Health tools (BMI, energy estimator)
10. Admin dashboard
11. Polish, empty/error states, SEO

## Push notifications

Web Push, designed to stay within the Appwrite Student plan's 2-Function
limit by doing all server-side work in a Cloudflare Worker instead of an
Appwrite Function. See `PUSH_NOTIFICATIONS.md` for the architecture and
`cloudflare-worker/` for the Worker itself and deploy steps.

## Notes

- No AI features are wired up yet. The plan is a swappable AI service
  interface once the knowledge base (foods + articles) has real content to
  ground answers in — not before.
- Health tools will carry an explicit "estimate, not diagnosis" disclaimer;
  no unsupported medical claims anywhere in copy.
- Nutrition values in `foods` are meant to be filled in by an editor/expert
  with real sources — nothing is pre-seeded with invented numbers.
