import { supabase } from "./supabaseClient";

/* ============================================================
   Data layer — every Supabase call the forum makes lives here.
   Each function returns { data, error } so callers can decide
   how to surface failures instead of this layer swallowing them.
   ============================================================ */

function simpleHash(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
export function hashPassword(pw) {
  return simpleHash(pw + "::rot_salt_v1");
}

/* ---------- categories ---------- */

export async function fetchCategories() {
  return supabase.from("rot_categories").select("*").order("sort_order", { ascending: true });
}

export async function fetchThreadCounts() {
  const { data, error } = await supabase.from("rot_threads").select("category_id");
  if (error) return { data: null, error };
  const counts = {};
  for (const row of data) counts[row.category_id] = (counts[row.category_id] || 0) + 1;
  return { data: counts, error: null };
}

/* ---------- auth ---------- */

export async function signUp(username, password) {
  const { data: existing } = await supabase.from("rot_users").select("username").eq("username", username).maybeSingle();
  if (existing) return { data: null, error: { message: "That name is already taken." } };

  const newUser = {
    username,
    pass_hash: hashPassword(password),
    bio: "",
    streak: 0,
    last_check_in: null,
    posts: 0,
    rep: 0,
  };
  const { data, error } = await supabase.from("rot_users").insert(newUser).select().single();
  return { data, error };
}

export async function signIn(username, password) {
  const { data: user, error } = await supabase.from("rot_users").select("*").eq("username", username).maybeSingle();
  if (error) return { data: null, error };
  if (!user) return { data: null, error: { message: "No account with that name." } };
  if (user.pass_hash !== hashPassword(password)) return { data: null, error: { message: "Wrong password." } };
  return { data: user, error: null };
}

export async function fetchUser(username) {
  return supabase.from("rot_users").select("*").eq("username", username).maybeSingle();
}

export async function updateUser(username, patch) {
  return supabase.from("rot_users").update(patch).eq("username", username).select().single();
}

/* ---------- threads ---------- */

export async function fetchThreadsForCategory(categoryId) {
  const { data: threads, error } = await supabase
    .from("rot_threads")
    .select("*")
    .eq("category_id", categoryId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return { data: null, error };

  // attach reply counts + score in a couple of batched queries instead of N+1
  const threadIds = threads.map((t) => t.id);
  if (threadIds.length === 0) return { data: [], error: null };

  const { data: posts } = await supabase.from("rot_posts").select("id, thread_id, created_at, is_op").in("thread_id", threadIds);
  const { data: votes } = await supabase.from("rot_votes").select("post_id, direction").in(
    "post_id",
    (posts || []).map((p) => p.id)
  );

  const scoreByPost = {};
  for (const v of votes || []) scoreByPost[v.post_id] = (scoreByPost[v.post_id] || 0) + v.direction;

  const enriched = threads.map((t) => {
    const threadPosts = (posts || []).filter((p) => p.thread_id === t.id);
    const replyCount = threadPosts.filter((p) => !p.is_op).length;
    const lastActivity = threadPosts.length
      ? Math.max(...threadPosts.map((p) => new Date(p.created_at).getTime()))
      : new Date(t.created_at).getTime();
    const score = threadPosts.reduce((sum, p) => sum + (scoreByPost[p.id] || 0), 0);
    return { ...t, replyCount, lastActivity, score };
  });
  enriched.sort((a, b) => (b.pinned - a.pinned) || (b.lastActivity - a.lastActivity));

  return { data: enriched, error: null };
}

export async function fetchThread(threadId) {
  return supabase.from("rot_threads").select("*").eq("id", threadId).maybeSingle();
}

export async function createThread({ categoryId, title, author, body }) {
  const { data: thread, error: threadErr } = await supabase
    .from("rot_threads")
    .insert({ category_id: categoryId, title, author })
    .select()
    .single();
  if (threadErr) return { data: null, error: threadErr };

  const { error: postErr } = await supabase
    .from("rot_posts")
    .insert({ thread_id: thread.id, author, body, is_op: true });
  if (postErr) return { data: null, error: postErr };

  await incrementUserPosts(author);

  return { data: thread, error: null };
}

async function incrementUserPosts(username) {
  const { data: user } = await fetchUser(username);
  if (user) await updateUser(username, { posts: (user.posts || 0) + 1 });
}

/* ---------- posts (op + replies) ---------- */

export async function fetchPostsForThread(threadId) {
  const { data: posts, error } = await supabase
    .from("rot_posts")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) return { data: null, error };

  const postIds = posts.map((p) => p.id);
  const { data: votes } = postIds.length
    ? await supabase.from("rot_votes").select("*").in("post_id", postIds)
    : { data: [] };

  const enriched = posts.map((p) => {
    const postVotes = (votes || []).filter((v) => v.post_id === p.id);
    const score = postVotes.reduce((sum, v) => sum + v.direction, 0);
    const upvoters = postVotes.filter((v) => v.direction === 1).map((v) => v.username);
    const downvoters = postVotes.filter((v) => v.direction === -1).map((v) => v.username);
    return { ...p, score, upvoters, downvoters };
  });

  return { data: enriched, error: null };
}

export async function createReply({ threadId, author, body }) {
  const { data, error } = await supabase
    .from("rot_posts")
    .insert({ thread_id: threadId, author, body, is_op: false })
    .select()
    .single();
  if (!error) await incrementUserPosts(author);
  return { data, error };
}

/* ---------- voting ---------- */
// One row per (post, user). Re-clicking same direction deletes the vote (toggle off).
// Clicking the opposite direction updates the row.

export async function castVote(postId, username, direction) {
  const { data: existing } = await supabase
    .from("rot_votes")
    .select("*")
    .eq("post_id", postId)
    .eq("username", username)
    .maybeSingle();

  if (existing && existing.direction === direction) {
    return supabase.from("rot_votes").delete().eq("post_id", postId).eq("username", username);
  }
  if (existing) {
    return supabase.from("rot_votes").update({ direction }).eq("post_id", postId).eq("username", username);
  }
  return supabase.from("rot_votes").insert({ post_id: postId, username, direction });
}

/* ---------- check-in / streak ---------- */

export function isSameDay(aIso, bMs) {
  if (!aIso) return false;
  const da = new Date(aIso);
  const db = new Date(bMs);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}
export function isYesterday(aIso, bMs) {
  if (!aIso) return false;
  const ONE_DAY = 86400000;
  return isSameDay(aIso, bMs - ONE_DAY);
}

export async function checkIn(username) {
  const { data: user, error } = await fetchUser(username);
  if (error || !user) return { data: null, error: error || { message: "User not found." } };

  const now = Date.now();
  if (isSameDay(user.last_check_in, now)) {
    return { data: user, error: null, alreadyDone: true };
  }
  const newStreak = isYesterday(user.last_check_in, now) ? (user.streak || 0) + 1 : 1;
  return updateUser(username, { streak: newStreak, last_check_in: new Date(now).toISOString() });
}
