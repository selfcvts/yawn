const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "root-forum-secret-rot-2024";

// ─── Directories ─────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");
["avatars","banners","audio","emojis"].forEach(d => {
  fs.mkdirSync(path.join(UPLOADS_DIR, d), { recursive: true });
});
fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Multer configs ───────────────────────────────────────────────────────────
const imgStorage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, subdir)),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const uploadAvatar = multer({ storage: imgStorage("avatars"), limits: { fileSize: 5*1024*1024 } });
const uploadBanner = multer({ storage: imgStorage("banners"), limits: { fileSize: 10*1024*1024 } });
const uploadAudio  = multer({ storage: multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, "audio")),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
}), limits: { fileSize: 20*1024*1024 } });
const uploadEmoji  = multer({ storage: imgStorage("emojis"), limits: { fileSize: 2*1024*1024 } });

// ─── Database ─────────────────────────────────────────────────────────────────
const db = new Database(path.join(DATA_DIR, "root.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    rep INTEGER DEFAULT 0,
    avatar_url TEXT,
    avatar_color TEXT DEFAULT '#c0392b',
    banner_url TEXT,
    profile_music_url TEXT,
    profile_bio TEXT DEFAULT '',
    profile_color TEXT DEFAULT '#c0392b',
    custom_badge TEXT,
    custom_badge_color TEXT,
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT,
    is_muted INTEGER DEFAULT 0,
    mute_until INTEGER,
    post_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    last_seen INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#c0392b',
    sort_order INTEGER DEFAULT 0,
    section TEXT DEFAULT 'general',
    admin_only INTEGER DEFAULT 0,
    mod_curated INTEGER DEFAULT 0,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    font_family TEXT,
    font_size TEXT,
    text_color TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    last_post_at INTEGER DEFAULT (strftime('%s','now')),
    last_post_user TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    body TEXT NOT NULL,
    font_family TEXT,
    font_size TEXT,
    text_color TEXT,
    rep_score INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    edited_at INTEGER,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS post_reactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reaction TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    UNIQUE(post_id, user_id, reaction),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS rep_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS custom_emojis (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    added_by TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS mod_featured_threads (
    thread_id TEXT PRIMARY KEY,
    added_by TEXT NOT NULL,
    added_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS ban_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    target_user_id TEXT NOT NULL,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// ─── Seed data ────────────────────────────────────────────────────────────────
const catCount = db.prepare("SELECT COUNT(*) as c FROM categories").get().c;
if (catCount === 0) {
  const cats = [
    // Pinned top section
    { id: uuidv4(), slug:"news", name:"📢 News", description:"Official announcements. Admin posts only.", icon:"📢", color:"#c0392b", sort_order:1, section:"pinned", admin_only:1 },
    { id: uuidv4(), slug:"best-of", name:"⭐ Best of the Best", description:"Curated top threads selected by moderators.", icon:"⭐", color:"#f39c12", sort_order:2, section:"pinned", mod_curated:1 },
    // Looksmaxxing section
    { id: uuidv4(), slug:"looksmaxxing-general", name:"Looksmaxxing", description:"General looksmaxxing discussion, theory, and advice.", icon:"💎", color:"#8e44ad", sort_order:10, section:"looksmaxxing" },
    { id: uuidv4(), slug:"looksmaxxing-questions", name:"Looksmaxxing Questions", description:"Ask anything about looksmaxxing.", icon:"❓", color:"#9b59b6", sort_order:11, section:"looksmaxxing" },
    { id: uuidv4(), slug:"rate-me", name:"Rate Me", description:"Post your photos and receive honest ratings.", icon:"📸", color:"#e74c3c", sort_order:12, section:"looksmaxxing" },
    // General section
    { id: uuidv4(), slug:"off-topic", name:"Off Topic", description:"Anything goes. Keep it real.", icon:"💬", color:"#2c3e50", sort_order:20, section:"general" },
    { id: uuidv4(), slug:"different-languages", name:"Different Languages", description:"Post in your native language. All welcome.", icon:"🌍", color:"#27ae60", sort_order:21, section:"general" },
  ];
  const ins = db.prepare("INSERT INTO categories (id,slug,name,description,icon,color,sort_order,section,admin_only,mod_curated) VALUES (@id,@slug,@name,@description,@icon,@color,@sort_order,@section,@admin_only,@mod_curated)");
  cats.forEach(c => ins.run({ admin_only:0, mod_curated:0, ...c }));
}

// Seed admin user
const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync("root_admin_2024", 10);
  db.prepare("INSERT OR IGNORE INTO users (id,username,email,password_hash,role,rep,custom_badge,custom_badge_color) VALUES (?,?,?,?,?,?,?,?)")
    .run(uuidv4(),"admin","admin@rot.dpdns.org",hash,"admin",9999,"👑 OWNER","#f39c12");
}

// Seed triste account
const tristeExists = db.prepare("SELECT id FROM users WHERE username = 'triste'").get();
if (!tristeExists) {
  const hash = bcrypt.hashSync("333...333", 10);
  db.prepare("INSERT OR IGNORE INTO users (id,username,email,password_hash,role,rep,custom_badge,custom_badge_color,profile_color) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(uuidv4(),"triste","triste@rot.dpdns.org",hash,"owner",9999,"👑 OWNER","#c0392b","#8e44ad");
} else {
  db.prepare("UPDATE users SET role='owner', rep=9999, custom_badge='👑 OWNER', custom_badge_color='#c0392b' WHERE username='triste'").run();
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
};
const optAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  next();
};
const isAdmin = (req, res, next) => {
  if (!["admin","owner","mod"].includes(req.user?.role)) return res.status(403).json({ error: "Insufficient permissions" });
  next();
};
const isOwner = (req, res, next) => {
  if (!["admin","owner"].includes(req.user?.role)) return res.status(403).json({ error: "Owner only" });
  next();
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });
  if (username.length < 3) return res.status(400).json({ error: "Username min 3 chars" });
  if (password.length < 6) return res.status(400).json({ error: "Password min 6 chars" });
  const colors = ["#c0392b","#8e44ad","#2980b9","#16a085","#e67e22","#27ae60","#d35400","#2c3e50"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    db.prepare("INSERT INTO users (id,username,email,password_hash,avatar_color,profile_color) VALUES (?,?,?,?,?,?)").run(id,username,email,hash,color,color);
    const user = safeUser(db.prepare("SELECT * FROM users WHERE id=?").get(id));
    const token = jwt.sign({ id:user.id, username:user.username, role:user.role }, JWT_SECRET, { expiresIn:"30d" });
    res.json({ token, user });
  } catch(e) {
    if (e.message.includes("UNIQUE")) res.status(409).json({ error: "Username or email taken" });
    else res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username=? OR email=?").get(username, username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: "Invalid credentials" });
  if (user.is_banned) return res.status(403).json({ error: `Banned: ${user.ban_reason || "No reason given"}` });
  db.prepare("UPDATE users SET last_seen=strftime('%s','now') WHERE id=?").run(user.id);
  const token = jwt.sign({ id:user.id, username:user.username, role:user.role }, JWT_SECRET, { expiresIn:"30d" });
  res.json({ token, user: safeUser(user) });
});

app.get("/api/auth/me", auth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
  res.json(safeUser(user));
});

function safeUser(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
app.patch("/api/users/me", auth, (req, res) => {
  const { profile_bio, profile_color, avatar_color } = req.body;
  db.prepare("UPDATE users SET profile_bio=COALESCE(?,profile_bio), profile_color=COALESCE(?,profile_color), avatar_color=COALESCE(?,avatar_color) WHERE id=?")
    .run(profile_bio, profile_color, avatar_color, req.user.id);
  res.json(safeUser(db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id)));
});

app.post("/api/users/me/avatar", auth, uploadAvatar.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const url = `/uploads/avatars/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar_url=? WHERE id=?").run(url, req.user.id);
  res.json({ url });
});

app.post("/api/users/me/banner", auth, uploadBanner.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const url = `/uploads/banners/${req.file.filename}`;
  db.prepare("UPDATE users SET banner_url=? WHERE id=?").run(url, req.user.id);
  res.json({ url });
});

app.post("/api/users/me/music", auth, uploadAudio.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const url = `/uploads/audio/${req.file.filename}`;
  db.prepare("UPDATE users SET profile_music_url=? WHERE id=?").run(url, req.user.id);
  res.json({ url });
});

app.get("/api/users/:username", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(req.params.username);
  if (!user) return res.status(404).json({ error: "Not found" });
  const threads = db.prepare("SELECT t.id,t.title,t.created_at,c.name as cat_name,c.slug as cat_slug FROM threads t JOIN categories c ON t.category_id=c.id WHERE t.user_id=? ORDER BY t.created_at DESC LIMIT 10").all(user.id);
  res.json({ user: safeUser(user), threads });
});

// ─── ADMIN ACTIONS ────────────────────────────────────────────────────────────
app.post("/api/admin/ban", auth, isAdmin, (req, res) => {
  const { username, reason } = req.body;
  const target = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (["owner","admin"].includes(target.role) && req.user.role !== "owner") return res.status(403).json({ error: "Cannot ban admins" });
  db.prepare("UPDATE users SET is_banned=1, ban_reason=? WHERE id=?").run(reason||"No reason", target.id);
  db.prepare("INSERT INTO ban_log (target_user_id,admin_id,action,reason) VALUES (?,?,?,?)").run(target.id, req.user.id, "ban", reason);
  res.json({ ok: true });
});

app.post("/api/admin/unban", auth, isAdmin, (req, res) => {
  const { username } = req.body;
  const target = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET is_banned=0, ban_reason=NULL WHERE id=?").run(target.id);
  db.prepare("INSERT INTO ban_log (target_user_id,admin_id,action) VALUES (?,?,?)").run(target.id, req.user.id, "unban");
  res.json({ ok: true });
});

app.post("/api/admin/mute", auth, isAdmin, (req, res) => {
  const { username, hours } = req.body;
  const target = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  const until = Math.floor(Date.now()/1000) + (hours||24)*3600;
  db.prepare("UPDATE users SET is_muted=1, mute_until=? WHERE id=?").run(until, target.id);
  res.json({ ok: true });
});

app.post("/api/admin/unmute", auth, isAdmin, (req, res) => {
  const { username } = req.body;
  const target = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET is_muted=0, mute_until=NULL WHERE id=?").run(target.id);
  res.json({ ok: true });
});

app.post("/api/admin/set-badge", auth, isOwner, (req, res) => {
  const { username, badge, color } = req.body;
  const target = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET custom_badge=?, custom_badge_color=? WHERE id=?").run(badge, color||"#c0392b", target.id);
  res.json({ ok: true });
});

app.post("/api/admin/set-role", auth, isOwner, (req, res) => {
  const { username, role } = req.body;
  const validRoles = ["member","mod","admin","owner"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
  const target = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET role=? WHERE id=?").run(role, target.id);
  res.json({ ok: true });
});

// Rep admin override
app.post("/api/admin/give-rep", auth, isAdmin, (req, res) => {
  const { username, amount, reason } = req.body;
  const target = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET rep=rep+? WHERE id=?").run(amount, target.id);
  db.prepare("INSERT INTO rep_transactions (from_user_id,to_user_id,amount,reason) VALUES (?,?,?,?)").run(req.user.id, target.id, amount, reason||"Admin grant");
  res.json({ ok: true });
});

app.post("/api/admin/remove-rep", auth, isAdmin, (req, res) => {
  const { username, amount, reason } = req.body;
  const target = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET rep=MAX(0,rep-?) WHERE id=?").run(Math.abs(amount), target.id);
  db.prepare("INSERT INTO rep_transactions (from_user_id,to_user_id,amount,reason) VALUES (?,?,?,?)").run(req.user.id, target.id, -Math.abs(amount), reason||"Admin removal");
  res.json({ ok: true });
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
app.get("/api/categories", (req, res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY sort_order").all());
});

// ─── THREADS ──────────────────────────────────────────────────────────────────
app.get("/api/threads", optAuth, (req, res) => {
  const { category, page=1, limit=20, sort="latest", featured } = req.query;
  const offset = (page-1)*limit;
  let where = "WHERE 1=1";
  const params = [];
  if (category) { where += " AND c.slug=?"; params.push(category); }
  if (featured==="1") { where += " AND t.is_featured=1"; }
  const order = sort==="top" ? "t.reply_count DESC, t.last_post_at DESC" : "t.is_pinned DESC, t.last_post_at DESC";
  const rows = db.prepare(`SELECT t.*,u.username,u.avatar_url,u.avatar_color,u.rep,u.role,u.custom_badge,u.custom_badge_color,c.name as cat_name,c.slug as cat_slug,c.color as cat_color,c.admin_only,c.mod_curated FROM threads t JOIN users u ON t.user_id=u.id JOIN categories c ON t.category_id=c.id ${where} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM threads t JOIN categories c ON t.category_id=c.id ${where}`).get(...params).c;
  res.json({ threads: rows, total, page: parseInt(page), pages: Math.ceil(total/limit) });
});

app.post("/api/threads", auth, (req, res) => {
  const { category_slug, title, body, font_family, font_size, text_color } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
  if (user.is_banned) return res.status(403).json({ error: "You are banned" });
  if (user.is_muted && user.mute_until > Date.now()/1000) return res.status(403).json({ error: "You are muted" });
  const cat = db.prepare("SELECT * FROM categories WHERE slug=?").get(category_slug);
  if (!cat) return res.status(404).json({ error: "Category not found" });
  if (cat.admin_only && !["admin","owner"].includes(req.user.role)) return res.status(403).json({ error: "News is admin-only" });
  if (!title || !body || title.length<3 || body.length<5) return res.status(400).json({ error: "Title/body too short" });
  const id = uuidv4();
  db.prepare("INSERT INTO threads (id,category_id,user_id,title,body,font_family,font_size,text_color) VALUES (?,?,?,?,?,?,?,?)").run(id,cat.id,req.user.id,title,body,font_family||null,font_size||null,text_color||null);
  db.prepare("UPDATE categories SET thread_count=thread_count+1 WHERE id=?").run(cat.id);
  db.prepare("UPDATE users SET post_count=post_count+1 WHERE id=?").run(req.user.id);
  res.json(db.prepare("SELECT t.*,u.username,u.avatar_color,u.avatar_url FROM threads t JOIN users u ON t.user_id=u.id WHERE t.id=?").get(id));
});

app.get("/api/threads/:id", optAuth, (req, res) => {
  const thread = db.prepare("SELECT t.*,u.username,u.avatar_url,u.avatar_color,u.rep,u.role,u.custom_badge,u.custom_badge_color,u.profile_bio,c.name as cat_name,c.slug as cat_slug,c.color as cat_color FROM threads t JOIN users u ON t.user_id=u.id JOIN categories c ON t.category_id=c.id WHERE t.id=?").get(req.params.id);
  if (!thread) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE threads SET views=views+1 WHERE id=?").run(req.params.id);
  const posts = db.prepare("SELECT p.*,u.username,u.avatar_url,u.avatar_color,u.rep,u.role,u.custom_badge,u.custom_badge_color,u.post_count,u.profile_bio FROM posts p JOIN users u ON p.user_id=u.id WHERE p.thread_id=? ORDER BY p.created_at ASC").all(req.params.id);
  // Reactions per post
  const postIds = posts.map(p=>p.id);
  const reactions = postIds.length ? db.prepare(`SELECT * FROM post_reactions WHERE post_id IN (${postIds.map(()=>'?').join(',')}) ORDER BY created_at`).all(...postIds) : [];
  const reactionMap = {};
  reactions.forEach(r => {
    if (!reactionMap[r.post_id]) reactionMap[r.post_id] = [];
    reactionMap[r.post_id].push(r);
  });
  const postsWithReactions = posts.map(p => ({ ...p, reactions: reactionMap[p.id]||[] }));
  // User liked?
  const myUserId = req.user?.id;
  res.json({ thread, posts: postsWithReactions, myUserId });
});

app.post("/api/threads/:id/feature", auth, isAdmin, (req, res) => {
  db.prepare("UPDATE threads SET is_featured=1 WHERE id=?").run(req.params.id);
  db.prepare("INSERT OR IGNORE INTO mod_featured_threads (thread_id,added_by) VALUES (?,?)").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.delete("/api/threads/:id/feature", auth, isAdmin, (req, res) => {
  db.prepare("UPDATE threads SET is_featured=0 WHERE id=?").run(req.params.id);
  db.prepare("DELETE FROM mod_featured_threads WHERE thread_id=?").run(req.params.id);
  res.json({ ok: true });
});

app.delete("/api/threads/:id", auth, (req, res) => {
  const t = db.prepare("SELECT * FROM threads WHERE id=?").get(req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  if (t.user_id !== req.user.id && !["admin","owner","mod"].includes(req.user.role)) return res.status(403).json({ error: "Not allowed" });
  db.prepare("DELETE FROM threads WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ─── POSTS ────────────────────────────────────────────────────────────────────
app.post("/api/posts", auth, (req, res) => {
  const { thread_id, body, font_family, font_size, text_color } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
  if (user.is_banned) return res.status(403).json({ error: "You are banned" });
  if (user.is_muted && user.mute_until > Date.now()/1000) return res.status(403).json({ error: "You are muted" });
  const thread = db.prepare("SELECT * FROM threads WHERE id=?").get(thread_id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (thread.is_locked && !["admin","owner","mod"].includes(req.user.role)) return res.status(403).json({ error: "Thread locked" });
  if (!body || body.length < 1) return res.status(400).json({ error: "Empty post" });
  const id = uuidv4();
  db.prepare("INSERT INTO posts (id,thread_id,user_id,body,font_family,font_size,text_color) VALUES (?,?,?,?,?,?,?)").run(id,thread_id,req.user.id,body,font_family||null,font_size||null,text_color||null);
  db.prepare("UPDATE threads SET reply_count=reply_count+1, last_post_at=strftime('%s','now'), last_post_user=? WHERE id=?").run(req.user.username, thread_id);
  db.prepare("UPDATE categories SET post_count=post_count+1 WHERE id=(SELECT category_id FROM threads WHERE id=?)").run(thread_id);
  db.prepare("UPDATE users SET post_count=post_count+1 WHERE id=?").run(req.user.id);
  const post = db.prepare("SELECT p.*,u.username,u.avatar_url,u.avatar_color,u.rep,u.role,u.custom_badge,u.custom_badge_color,u.post_count FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id=?").get(id);
  res.json({ ...post, reactions: [] });
});

app.delete("/api/posts/:id", auth, (req, res) => {
  const p = db.prepare("SELECT * FROM posts WHERE id=?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.user_id !== req.user.id && !["admin","owner","mod"].includes(req.user.role)) return res.status(403).json({ error: "Not allowed" });
  db.prepare("DELETE FROM posts WHERE id=?").run(req.params.id);
  db.prepare("UPDATE threads SET reply_count=MAX(0,reply_count-1) WHERE id=?").run(p.thread_id);
  res.json({ ok: true });
});

// ─── REACTIONS / REP ──────────────────────────────────────────────────────────
const REP_REACTIONS = {
  agree: 1, disagree: -1, funny: 1, informative: 2, winner: 3,
  creative: 1, late: 0, autistic: -1, retarded: -1, cope: -1,
  "mega-rep": 10, "mega-dislike": -10, like: 1, dislike: -1
};

app.post("/api/posts/:id/react", auth, (req, res) => {
  const { reaction } = req.body;
  if (!(reaction in REP_REACTIONS)) return res.status(400).json({ error: "Invalid reaction" });
  
  const post = db.prepare("SELECT * FROM posts WHERE id=?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.user_id === req.user.id) return res.status(400).json({ error: "Can't react to own post" });

  const isPrivileged = ["admin","owner"].includes(req.user.role);
  
  // Check daily limit for non-admin users (per reaction type - once per day per reaction per post)
  if (!isPrivileged) {
    const today = new Date().toISOString().split("T")[0];
    const dayStart = Math.floor(new Date(today).getTime()/1000);
    const todayCount = db.prepare("SELECT COUNT(*) as c FROM post_reactions WHERE user_id=? AND created_at>=?").get(req.user.id, dayStart).c;
    if (todayCount >= 20) return res.status(429).json({ error: "Daily reaction limit reached (20/day)" });
  }

  const value = REP_REACTIONS[reaction];
  const existing = db.prepare("SELECT * FROM post_reactions WHERE post_id=? AND user_id=? AND reaction=?").get(req.params.id, req.user.id, reaction);
  
  if (existing) {
    // Toggle off
    db.prepare("DELETE FROM post_reactions WHERE post_id=? AND user_id=? AND reaction=?").run(req.params.id, req.user.id, reaction);
    db.prepare("UPDATE posts SET rep_score=rep_score-? WHERE id=?").run(value, req.params.id);
    db.prepare("UPDATE users SET rep=MAX(-999,rep-?) WHERE id=?").run(value, post.user_id);
    res.json({ toggled: false, reaction });
  } else {
    db.prepare("INSERT OR IGNORE INTO post_reactions (post_id,user_id,reaction,value) VALUES (?,?,?,?)").run(req.params.id, req.user.id, reaction, value);
    db.prepare("UPDATE posts SET rep_score=rep_score+? WHERE id=?").run(value, req.params.id);
    db.prepare("UPDATE users SET rep=rep+? WHERE id=?").run(value, post.user_id);
    res.json({ toggled: true, reaction });
  }
});

// Donate rep
app.post("/api/rep/donate", auth, (req, res) => {
  const { username, amount, reason } = req.body;
  if (!amount || amount < 1 || amount > 100) return res.status(400).json({ error: "Amount must be 1-100" });
  const isPrivileged = ["admin","owner"].includes(req.user.role);
  if (!isPrivileged) {
    const today = new Date().toISOString().split("T")[0];
    const dayStart = Math.floor(new Date(today).getTime()/1000);
    const existing = db.prepare("SELECT COUNT(*) as c FROM rep_transactions WHERE from_user_id=? AND created_at>=?").get(req.user.id, dayStart).c;
    if (existing >= 1) return res.status(429).json({ error: "Rep donation limit: once per day" });
  }
  const donor = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
  if (donor.rep < amount && !isPrivileged) return res.status(400).json({ error: "Not enough rep" });
  const target = db.prepare("SELECT id,rep FROM users WHERE username=?").get(username);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (!isPrivileged) db.prepare("UPDATE users SET rep=rep-? WHERE id=?").run(amount, req.user.id);
  db.prepare("UPDATE users SET rep=rep+? WHERE id=?").run(amount, target.id);
  db.prepare("INSERT INTO rep_transactions (from_user_id,to_user_id,amount,reason) VALUES (?,?,?,?)").run(req.user.id, target.id, amount, reason||"Donation");
  res.json({ ok: true });
});

// ─── CUSTOM EMOJIS ────────────────────────────────────────────────────────────
app.get("/api/emojis", (req, res) => {
  res.json(db.prepare("SELECT * FROM custom_emojis ORDER BY created_at DESC").all());
});

app.post("/api/emojis", auth, isAdmin, uploadEmoji.single("file"), (req, res) => {
  const { name } = req.body;
  if (!name || !req.file) return res.status(400).json({ error: "Name and file required" });
  const url = `/uploads/emojis/${req.file.filename}`;
  const id = uuidv4();
  try {
    db.prepare("INSERT INTO custom_emojis (id,name,url,added_by) VALUES (?,?,?,?)").run(id, name.toLowerCase().replace(/\s+/g,"-"), url, req.user.id);
    res.json(db.prepare("SELECT * FROM custom_emojis WHERE id=?").get(id));
  } catch(e) {
    res.status(409).json({ error: "Emoji name already exists" });
  }
});

app.delete("/api/emojis/:id", auth, isAdmin, (req, res) => {
  db.prepare("DELETE FROM custom_emojis WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get("/api/stats", (req, res) => {
  res.json({
    users: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
    threads: db.prepare("SELECT COUNT(*) as c FROM threads").get().c,
    posts: db.prepare("SELECT COUNT(*) as c FROM posts").get().c,
    online: db.prepare("SELECT COUNT(*) as c FROM users WHERE last_seen>strftime('%s','now')-300").get().c,
  });
});

app.get("/api/leaderboard", (req, res) => {
  res.json(db.prepare("SELECT id,username,rep,role,avatar_url,avatar_color,custom_badge,custom_badge_color,post_count FROM users ORDER BY rep DESC LIMIT 20").all());
});

// ─── SERVE REACT ──────────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(path.join(publicDir, "index.html"))) {
  app.use(express.static(publicDir));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads"))
      res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(PORT, () => console.log(`\n  ROOT v2 → http://localhost:${PORT}\n`));
