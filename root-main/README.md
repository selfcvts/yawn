# ROT

A discipline / self-improvement forum. Dark, ember-toned, no fluff. Real shared
accounts, threads, replies, voting, and streaks — backed by a Supabase
Postgres database, so every visitor sees the same forum.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project (the free tier is enough to start).
2. Wait for it to finish provisioning (a couple of minutes).
3. In the left sidebar, go to **SQL Editor** -> **New query**.
4. Open `supabase/schema.sql` from this repo, paste its full contents into the editor, and click **Run**.
   This creates all the tables, the default categories, and the row-level security policies the app needs.
5. Go to **Settings -> API**. You'll need two values from this page in the next step:
   - **Project URL**
   - **anon public** key (NOT the `service_role` key — never put that key in frontend code)

## 2. Configure the app

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the two values from Supabase:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Sign up for an account, post a thread, and confirm it shows up — that confirms the database connection is working end to end.

## 4. Deploy it

This is a static Vite app, so it deploys anywhere that serves static files. The easiest options:

- **Vercel** or **Netlify**: import this GitHub repo, set the build command to `npm run build`, the output directory to `dist`, and add the two `VITE_SUPABASE_*` environment variables in the project's dashboard settings.
- **GitHub Pages**: build with `npm run build` and publish the `dist` folder, but you'll need to inject the env vars at build time via a GitHub Actions secret, since GitHub Pages has no runtime env var support.

Either way, the `.env` file itself should never be committed (it's already in `.gitignore`) — environment variables get set in your hosting provider's dashboard instead.

## How accounts work

This forum uses its own `rot_users` table with a username + password, not Supabase Auth. That keeps things simple, but it's worth knowing the limits:

- Passwords are hashed client-side before being sent, but this is a lightweight hash, not bcrypt/argon2. Fine for a casual community forum. Don't reuse a password you use anywhere important.
- Because the app talks to Supabase directly from the browser using the public anon key, the row-level security policies in `schema.sql` are what stop people from editing each other's data — review them if you plan to extend the schema.
- There's no email verification, password reset, or session expiry. Login state is just "remember this username in the browser" via `localStorage`.

If you want real security later (proper password hashing, sessions, email verification), the cleanest upgrade path is switching to Supabase Auth and moving writes behind Supabase Edge Functions instead of calling the database directly from the browser.

## What's included

- Sign up / sign in
- Categories: discipline & habits, training, mind & focus, money & work, the dispatch
- Threads and replies, all stored in Postgres
- Upvote / downvote on any post, with toggle-off on a second click
- Profiles with bio, post count, rep, and a daily check-in streak

## What's not included (yet)

- Moderator/admin tools (delete posts, ban users)
- Editing or deleting your own posts after submission
- Rep actually being awarded from votes (the `rep` column exists but nothing increments it yet — votes currently only affect post score, not user rep)
- Email verification or password reset
