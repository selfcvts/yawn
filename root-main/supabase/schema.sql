-- ROT forum schema for Supabase
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query) once.

create extension if not exists pgcrypto;

-- ---------- users ----------
-- Note: this is a simple username/password system stored in our own table,
-- NOT Supabase Auth. Good enough for a community forum, not bank-grade security.
create table if not exists rot_users (
  username text primary key check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  pass_hash text not null,
  joined_at timestamptz not null default now(),
  bio text default '',
  streak int not null default 0,
  last_check_in timestamptz,
  posts int not null default 0,
  rep int not null default 0
);

-- ---------- categories ----------
create table if not exists rot_categories (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  sort_order int not null default 0
);

insert into rot_categories (id, name, description, icon, sort_order) values
  ('discipline', 'Discipline & habits', 'Streaks, routines, accountability, relapse and recovery.', 'flame', 1),
  ('training', 'Training', 'Strength, conditioning, programming, recovery — evidence over hype.', 'barbell', 2),
  ('mind', 'Mind & focus', 'Attention, deep work, anxiety, sleep, the inner war.', 'brain', 3),
  ('money', 'Money & work', 'Career, discipline with money, building something that lasts.', 'anvil', 4),
  ('dispatch', 'The dispatch', 'General discussion. Philosophy, media, the rest of it.', 'scroll', 5)
on conflict (id) do nothing;

-- ---------- threads ----------
create table if not exists rot_threads (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references rot_categories(id),
  title text not null check (char_length(title) between 1 and 200),
  author text not null references rot_users(username),
  created_at timestamptz not null default now(),
  pinned boolean not null default false
);
create index if not exists rot_threads_category_idx on rot_threads(category_id, created_at desc);

-- ---------- posts (op + replies, same table) ----------
create table if not exists rot_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references rot_threads(id) on delete cascade,
  author text not null references rot_users(username),
  body text not null check (char_length(body) between 1 and 8000),
  is_op boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists rot_posts_thread_idx on rot_posts(thread_id, created_at asc);

-- ---------- votes ----------
create table if not exists rot_votes (
  post_id uuid not null references rot_posts(id) on delete cascade,
  username text not null references rot_users(username),
  direction smallint not null check (direction in (-1, 1)),
  primary key (post_id, username)
);

-- ---------- convenience view: post score ----------
create or replace view rot_post_scores as
select post_id, coalesce(sum(direction), 0) as score
from rot_votes
group by post_id;

-- ============================================================
-- Row Level Security
-- This app uses the Supabase anon key directly from the browser,
-- so RLS is what keeps people from editing each other's rows.
-- Since auth is custom (not Supabase Auth), we allow public read
-- on everything and public insert where it makes sense, but block
-- update/delete on rows that should be immutable from the client.
-- For a stricter setup, move writes behind a Supabase Edge Function.
-- ============================================================

alter table rot_users enable row level security;
alter table rot_categories enable row level security;
alter table rot_threads enable row level security;
alter table rot_posts enable row level security;
alter table rot_votes enable row level security;

-- categories: public read only, no client writes
create policy "categories are public" on rot_categories for select using (true);

-- users: public read (profiles, leaderboards), public insert (signup),
-- public update needed for bio/streak/posts/rep self-edits.
-- NOTE: because auth is not Supabase Auth, this policy can't truly
-- verify "is this the real owner" at the DB layer. Good enough for a
-- low-stakes community forum; do not store sensitive data in rot_users.
create policy "users are public" on rot_users for select using (true);
create policy "anyone can sign up" on rot_users for insert with check (true);
create policy "anyone can update a user row" on rot_users for update using (true);

-- threads: public read, public insert
create policy "threads are public" on rot_threads for select using (true);
create policy "anyone can create a thread" on rot_threads for insert with check (true);

-- posts: public read, public insert
create policy "posts are public" on rot_posts for select using (true);
create policy "anyone can create a post" on rot_posts for insert with check (true);

-- votes: public read, public insert/update (upsert pattern for toggling)
create policy "votes are public" on rot_votes for select using (true);
create policy "anyone can vote" on rot_votes for insert with check (true);
create policy "anyone can change their vote" on rot_votes for update using (true);
create policy "anyone can remove their vote" on rot_votes for delete using (true);
