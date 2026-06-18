import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCategories,
  fetchThreadCounts,
  signUp,
  signIn,
  fetchUser,
  updateUser,
  fetchThreadsForCategory,
  fetchThread,
  createThread,
  fetchPostsForThread,
  createReply,
  castVote,
  checkIn,
  isSameDay,
} from "./rotApi";

const SESSION_KEY = "rot_session_username";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const ICONS = {
  flame: "M12 2c.5 3-2 5-3.5 7C7 11 6 13 6 15a6 6 0 0012 0c0-2-1-3.5-2-5 .5 1.5 0 3-1 3.5.5-2-.5-4-2-5.5C13.5 6.5 13 4 12 2z",
  barbell: "M4 9v6M2 10v4M6 8v8M9 11h6M18 8v8M22 10v4M20 9v6",
  brain: "M9 4a3 3 0 00-3 3v1a3 3 0 00-1 5.5A3 3 0 008 18a3 3 0 003-2v-9a3 3 0 00-2-3zM15 4a3 3 0 013 3v1a3 3 0 011 5.5A3 3 0 0116 18a3 3 0 01-3-2V7a3 3 0 012-3z",
  anvil: "M3 17h6l1-3h6l2 3h3M7 14l1-5h8l1 5M10 9V6h4v3",
  scroll: "M7 4h10a2 2 0 012 2v13a2 2 0 01-2-2H7a2 2 0 01-2-2V6a2 2 0 012-2zM7 4a2 2 0 00-2 2v11a2 2 0 002 2M9 9h6M9 13h4",
  up: "M12 5l7 8h-5v6h-4v-6H5z",
  down: "M12 19l-7-8h5V5h4v6h5z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  pin: "M12 2l2 6 6 2-5 4 1 6-6-3-6 3 1-6-5-4 6-2z",
  close: "M6 6l12 12M18 6L6 18",
  lock: "M6 11V8a6 6 0 0112 0v3M5 11h14v9H5z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

function Icon({ name, size = 16, style = {} }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

function EmberMeter({ streak }) {
  const pct = Math.min(100, (streak / 30) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon name="flame" size={14} style={{ color: streak > 0 ? "#c4401f" : "#5a5450" }} />
      <div style={{ flex: 1, height: 4, background: "#241f1a", borderRadius: 2, overflow: "hidden", minWidth: 40 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#7a2412,#c4401f)", transition: "width .4s" }} />
      </div>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#a89a85" }}>{streak}d</span>
    </div>
  );
}

function Avatar({ name, size = 32 }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 3, flexShrink: 0,
        background: `hsl(${h}, 35%, 18%)`, border: "1px solid #2e2722",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Oswald, sans-serif", fontWeight: 500, fontSize: size * 0.45,
        color: `hsl(${h}, 45%, 70%)`, letterSpacing: 0.5,
      }}
    >
      {initial}
    </div>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [view, setView] = useState({ page: "home" });
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, kind = "default") => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await fetchCategories();
      if (error) {
        setBootError(error.message || "Could not reach the database.");
      } else {
        setCategories(data || []);
      }

      const savedUsername = localStorage.getItem(SESSION_KEY);
      if (savedUsername) {
        const { data: u } = await fetchUser(savedUsername);
        if (u) setUser(u);
      }
      setBooted(true);
    })();
  }, []);

  const handleLogin = useCallback((u) => {
    setUser(u);
    localStorage.setItem(SESSION_KEY, u.username);
    setAuthOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    showToast("Signed out.");
  }, [showToast]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const { data } = await fetchUser(user.username);
    if (data) setUser(data);
  }, [user]);

  if (!booted) {
    return (
      <div style={rootStyle}>
        <FontLoader />
        <div style={{ padding: 60, textAlign: "center", color: "#5a5450", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
          loading rot...
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div style={rootStyle}>
        <FontLoader />
        <div style={{ maxWidth: 520, margin: "80px auto", padding: 24, border: "1px solid #3a2218", borderRadius: 4, background: "#171411" }}>
          <h2 style={{ fontFamily: "Oswald, sans-serif", color: "#c4401f", marginTop: 0 }}>Can't reach the database</h2>
          <p style={{ color: "#a89a85", fontSize: 14, lineHeight: 1.6 }}>{bootError}</p>
          <p style={{ color: "#5a5450", fontSize: 13, lineHeight: 1.6 }}>
            Check that <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are set in your <code>.env</code> file,
            and that the schema in <code>supabase/schema.sql</code> has been run on your Supabase project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <FontLoader />
      <Header
        user={user}
        onAuthOpen={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onHome={() => setView({ page: "home" })}
        onProfile={() => user && setView({ page: "profile", username: user.username })}
      />
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "0 20px 80px" }}>
        {view.page === "home" && (
          <Home categories={categories} onOpenCategory={(id) => setView({ page: "category", categoryId: id })} />
        )}
        {view.page === "category" && (
          <CategoryPage
            categories={categories}
            categoryId={view.categoryId}
            user={user}
            onBack={() => setView({ page: "home" })}
            onOpenThread={(id) => setView({ page: "thread", threadId: id, categoryId: view.categoryId })}
            requireAuth={() => setAuthOpen(true)}
            showToast={showToast}
          />
        )}
        {view.page === "thread" && (
          <ThreadPage
            threadId={view.threadId}
            categoryId={view.categoryId}
            categories={categories}
            user={user}
            onBack={() => setView({ page: "category", categoryId: view.categoryId })}
            requireAuth={() => setAuthOpen(true)}
            showToast={showToast}
            onOpenProfile={(uname) => setView({ page: "profile", username: uname })}
          />
        )}
        {view.page === "profile" && (
          <ProfilePage
            username={view.username}
            currentUser={user}
            onBack={() => setView({ page: "home" })}
            showToast={showToast}
            refreshUser={refreshUser}
          />
        )}
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={handleLogin} showToast={showToast} />}
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}
    </div>
  );
}

const rootStyle = {
  background: "#0d0c0b",
  color: "#e8d9c0",
  minHeight: "100vh",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  position: "relative",
};

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      input, textarea, button { font-family: Inter, sans-serif; }
      ::selection { background: #c4401f; color: #0d0c0b; }
      ::placeholder { color: #5a5450; }
      a { color: #c4401f; text-decoration: none; }
    `}</style>
  );
}

function Toast({ msg, kind }) {
  return (
    <div
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: "#171411", border: `1px solid ${kind === "error" ? "#7a2412" : "#2e2722"}`,
        borderLeft: `3px solid ${kind === "error" ? "#c4401f" : "#9c8a6f"}`,
        color: "#e8d9c0", padding: "10px 18px", borderRadius: 3, fontSize: 13,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 1000, maxWidth: 360,
      }}
    >
      {msg}
    </div>
  );
}

function Header({ user, onAuthOpen, onLogout, onHome, onProfile }) {
  return (
    <header style={{ borderBottom: "1px solid #241f1a", background: "linear-gradient(180deg, #131110, #0d0c0b)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={onHome} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: 1, color: "#e8d9c0" }}>ROT</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#5a5450", letterSpacing: 0.5 }}>burn what's weak</span>
        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={onProfile} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={user.username} size={26} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{user.username}</span>
            </div>
            <button onClick={onLogout} style={ghostBtn}>sign out</button>
          </div>
        ) : (
          <button onClick={onAuthOpen} style={primaryBtn}>enter</button>
        )}
      </div>
    </header>
  );
}

const primaryBtn = {
  background: "#c4401f", color: "#0d0c0b", border: "none", borderRadius: 3,
  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "Oswald, sans-serif", letterSpacing: 0.5, textTransform: "uppercase",
};
const ghostBtn = {
  background: "transparent", color: "#a89a85", border: "1px solid #2e2722", borderRadius: 3,
  padding: "7px 14px", fontSize: 12, cursor: "pointer",
};

function Home({ categories, onOpenCategory }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    (async () => {
      const { data } = await fetchThreadCounts();
      if (data) setCounts(data);
    })();
  }, []);

  return (
    <div>
      <div style={{ padding: "48px 0 36px", borderBottom: "1px solid #1c1814" }}>
        <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 38, margin: 0, letterSpacing: 0.5, lineHeight: 1.1 }}>
          Discipline is not motivation.
        </h1>
        <p style={{ color: "#7a7066", fontSize: 15, marginTop: 10, maxWidth: 540, lineHeight: 1.6 }}>
          A ledger for the people doing the unglamorous work — training, focus, money, the mind.
          No hype, no shortcuts sold here. Track your streak. Show your work.
        </p>
      </div>
      <div style={{ marginTop: 28 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onOpenCategory(cat.id)}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 4px", borderBottom: "1px solid #1c1814", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#13110f")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ width: 38, height: 38, borderRadius: 3, background: "#171411", border: "1px solid #2e2722", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={cat.icon} size={18} style={{ color: "#c4401f" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 500, fontSize: 17, letterSpacing: 0.3 }}>{cat.name}</div>
              <div style={{ color: "#5a5450", fontSize: 13, marginTop: 2 }}>{cat.description}</div>
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#5a5450", textAlign: "right", minWidth: 60 }}>
              {counts[cat.id] ?? 0} threads
            </div>
            <Icon name="arrow" size={16} style={{ color: "#3a3530" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryPage({ categories, categoryId, user, onBack, onOpenThread, requireAuth, showToast }) {
  const cat = categories.find((c) => c.id === categoryId);
  const [threads, setThreads] = useState(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await fetchThreadsForCategory(categoryId);
    if (error) { showToast("Could not load threads.", "error"); setThreads([]); return; }
    setThreads(data);
  }, [categoryId, showToast]);

  useEffect(() => { load(); }, [load]);

  if (!cat) return null;

  async function submitThread() {
    if (!user) { requireAuth(); return; }
    if (!title.trim() || !body.trim()) { showToast("Title and body required.", "error"); return; }
    setPosting(true);
    const { error } = await createThread({ categoryId, title: title.trim(), author: user.username, body: body.trim() });
    setPosting(false);
    if (error) { showToast("Could not post thread.", "error"); return; }
    setTitle(""); setBody(""); setComposing(false);
    showToast("Thread posted.");
    load();
  }

  return (
    <div>
      <BackRow onBack={onBack} label="all categories" />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 18, marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 28, margin: 0 }}>{cat.name}</h1>
          <p style={{ color: "#7a7066", fontSize: 14, marginTop: 6 }}>{cat.description}</p>
        </div>
        <button onClick={() => (user ? setComposing(true) : requireAuth())} style={primaryBtn}>+ new thread</button>
      </div>

      {composing && (
        <div style={cardStyle}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title" style={inputStyle} autoFocus />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the opening post..." style={{ ...inputStyle, minHeight: 110, marginTop: 10, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setComposing(false)} style={ghostBtn}>cancel</button>
            <button onClick={submitThread} disabled={posting} style={{ ...primaryBtn, opacity: posting ? 0.6 : 1 }}>
              {posting ? "posting..." : "post thread"}
            </button>
          </div>
        </div>
      )}

      {threads === null && <EmptyNote text="loading threads..." />}
      {threads && threads.length === 0 && <EmptyNote text="No threads yet. Be the first to put something on the record." />}
      {threads && threads.map((t) => <ThreadRow key={t.id} thread={t} onOpen={() => onOpenThread(t.id)} />)}
    </div>
  );
}

function ThreadRow({ thread, onOpen }) {
  const heat = Math.min(1, thread.replyCount / 20);
  return (
    <div
      onClick={onOpen}
      style={{ display: "flex", gap: 14, padding: "16px 4px", borderBottom: "1px solid #1c1814", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#13110f")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: 3, borderRadius: 2, background: `rgba(196,64,31,${0.25 + heat * 0.75})`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {thread.pinned && <Icon name="pin" size={13} style={{ color: "#c4401f" }} />}
          <div style={{ fontWeight: 500, fontSize: 15, color: "#e8d9c0" }}>{thread.title}</div>
        </div>
        <div style={{ color: "#5a5450", fontSize: 12.5, marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
          {thread.author} · {timeAgo(thread.created_at)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#7a7066", minWidth: 70 }}>
        <span>{thread.replyCount} replies</span>
        <span style={{ color: thread.score > 0 ? "#c4401f" : "#5a5450" }}>{thread.score > 0 ? "+" : ""}{thread.score}</span>
      </div>
    </div>
  );
}

function BackRow({ onBack, label }) {
  return (
    <div onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7a7066", fontSize: 13, cursor: "pointer", marginTop: 20 }}>
      <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} /> {label}
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ padding: "40px 0", textAlign: "center", color: "#5a5450", fontSize: 13.5, fontFamily: "JetBrains Mono, monospace" }}>{text}</div>;
}

const cardStyle = { background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 18, marginBottom: 20 };
const inputStyle = { width: "100%", background: "#0d0c0b", border: "1px solid #2e2722", borderRadius: 3, padding: "10px 12px", color: "#e8d9c0", fontSize: 14, outline: "none" };

function ThreadPage({ threadId, categoryId, categories, user, onBack, requireAuth, showToast, onOpenProfile }) {
  const cat = categories.find((c) => c.id === categoryId);
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data: t } = await fetchThread(threadId);
    const { data: p, error } = await fetchPostsForThread(threadId);
    setThread(t);
    if (error) { showToast("Could not load replies.", "error"); setPosts([]); return; }
    setPosts(p);
  }, [threadId, showToast]);

  useEffect(() => { load(); }, [load]);

  async function vote(postId, direction) {
    if (!user) { requireAuth(); return; }
    const { error } = await castVote(postId, user.username, direction);
    if (error) { showToast("Could not register vote.", "error"); return; }
    load();
  }

  async function submitReply() {
    if (!user) { requireAuth(); return; }
    if (!replyBody.trim()) return;
    setSending(true);
    const { error } = await createReply({ threadId, author: user.username, body: replyBody.trim() });
    setSending(false);
    if (error) { showToast("Could not post reply.", "error"); return; }
    setReplyBody("");
    showToast("Reply posted.");
    load();
  }

  if (!thread) return <EmptyNote text="loading thread..." />;

  const op = posts.find((p) => p.is_op);
  const rest = posts.filter((p) => !p.is_op);

  return (
    <div>
      <BackRow onBack={onBack} label={cat ? cat.name : "back"} />
      <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 26, margin: "16px 0 20px" }}>{thread.title}</h1>

      {op && (
        <PostBlock
          post={op}
          userVote={user && op.upvoters.includes(user.username) ? "up" : (user && op.downvoters.includes(user.username) ? "down" : null)}
          onVote={(d) => vote(op.id, d === "up" ? 1 : -1)}
          onOpenProfile={onOpenProfile}
          tag="original post"
        />
      )}

      {rest.map((p) => (
        <PostBlock
          key={p.id}
          post={p}
          userVote={user && p.upvoters.includes(user.username) ? "up" : (user && p.downvoters.includes(user.username) ? "down" : null)}
          onVote={(d) => vote(p.id, d === "up" ? 1 : -1)}
          onOpenProfile={onOpenProfile}
        />
      ))}

      <div style={{ ...cardStyle, marginTop: 28 }}>
        <div style={{ fontSize: 12.5, color: "#5a5450", marginBottom: 8, fontFamily: "JetBrains Mono, monospace" }}>
          {user ? `replying as ${user.username}` : "sign in to reply"}
        </div>
        <textarea
          value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
          placeholder={user ? "Add to the thread..." : "Sign in to post a reply"}
          disabled={!user}
          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => (user ? submitReply() : requireAuth())} disabled={sending} style={{ ...primaryBtn, opacity: sending ? 0.6 : 1 }}>
            {sending ? "posting..." : user ? "post reply" : "sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostBlock({ post, userVote, onVote, onOpenProfile, tag }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "18px 0", borderBottom: "1px solid #1c1814" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2, minWidth: 28 }}>
        <button onClick={() => onVote("up")} style={{ ...voteBtn, color: userVote === "up" ? "#c4401f" : "#5a5450" }} aria-label="upvote">
          <Icon name="up" size={15} />
        </button>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, color: post.score > 0 ? "#c4401f" : "#7a7066" }}>{post.score}</span>
        <button onClick={() => onVote("down")} style={{ ...voteBtn, color: userVote === "down" ? "#9c8a6f" : "#5a5450" }} aria-label="downvote">
          <Icon name="down" size={15} />
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div onClick={() => onOpenProfile(post.author)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Avatar name={post.author} size={24} />
            <span style={{ fontWeight: 500, fontSize: 13.5 }}>{post.author}</span>
          </div>
          {tag && (
            <span style={{ fontSize: 10.5, color: "#c4401f", border: "1px solid #3a2218", borderRadius: 2, padding: "1px 6px", fontFamily: "JetBrains Mono, monospace", letterSpacing: 0.4, textTransform: "uppercase" }}>{tag}</span>
          )}
          <span style={{ fontSize: 12, color: "#5a5450", fontFamily: "JetBrains Mono, monospace" }}>{timeAgo(post.created_at)}</span>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.7, color: "#d8c9b0", whiteSpace: "pre-wrap" }}>{post.body}</div>
      </div>
    </div>
  );
}

const voteBtn = { background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" };

function ProfilePage({ username, currentUser, onBack, showToast, refreshUser }) {
  const [profile, setProfile] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const isSelf = currentUser && currentUser.username === username;

  const load = useCallback(async () => {
    const { data } = await fetchUser(username);
    setProfile(data);
    setBioText(data?.bio || "");
  }, [username]);

  useEffect(() => { load(); }, [load]);

  async function handleCheckIn() {
    const result = await checkIn(username);
    if (result.error) { showToast("Could not check in.", "error"); return; }
    if (result.alreadyDone) { showToast("Already checked in today."); return; }
    setProfile(result.data);
    if (refreshUser) refreshUser();
    showToast(`Checked in. Streak: ${result.data.streak} day${result.data.streak === 1 ? "" : "s"}.`);
  }

  async function saveBio() {
    const { data, error } = await updateUser(username, { bio: bioText.trim() });
    if (error) { showToast("Could not save bio.", "error"); return; }
    setProfile(data);
    setEditingBio(false);
    showToast("Bio updated.");
  }

  if (!profile) return <EmptyNote text="loading profile..." />;
  const lastCheckInToday = isSameDay(profile.last_check_in, Date.now());

  return (
    <div>
      <BackRow onBack={onBack} label="back" />
      <div style={{ ...cardStyle, marginTop: 18, display: "flex", gap: 18, alignItems: "flex-start" }}>
        <Avatar name={profile.username} size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 22, margin: 0 }}>{profile.username}</h2>
            <span style={{ fontSize: 12, color: "#5a5450", fontFamily: "JetBrains Mono, monospace" }}>
              joined {new Date(profile.joined_at).toLocaleDateString()}
            </span>
          </div>

          {editingBio ? (
            <div style={{ marginTop: 10 }}>
              <textarea value={bioText} onChange={(e) => setBioText(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} placeholder="A line about your war." />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={saveBio} style={primaryBtn}>save</button>
                <button onClick={() => setEditingBio(false)} style={ghostBtn}>cancel</button>
              </div>
            </div>
          ) : (
            <p style={{ color: profile.bio ? "#a89a85" : "#5a5450", fontSize: 14, marginTop: 8, fontStyle: profile.bio ? "normal" : "italic" }}>
              {profile.bio || "No bio set."}
              {isSelf && <span onClick={() => setEditingBio(true)} style={{ marginLeft: 10, color: "#c4401f", cursor: "pointer", fontSize: 12.5 }}>edit</span>}
            </p>
          )}

          <div style={{ display: "flex", gap: 28, marginTop: 18 }}>
            <Stat label="posts" value={profile.posts || 0} />
            <Stat label="rep" value={profile.rep || 0} />
            <div>
              <div style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>streak</div>
              <EmberMeter streak={profile.streak || 0} />
            </div>
          </div>

          {isSelf && (
            <button
              onClick={handleCheckIn}
              disabled={lastCheckInToday}
              style={{ ...primaryBtn, marginTop: 18, background: lastCheckInToday ? "#2e2722" : "#c4401f", color: lastCheckInToday ? "#5a5450" : "#0d0c0b", cursor: lastCheckInToday ? "default" : "pointer" }}
            >
              {lastCheckInToday ? "checked in today" : "check in — keep the streak"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, color: "#e8d9c0" }}>{value}</div>
    </div>
  );
}

function AuthModal({ onClose, onLogin, showToast }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    const uname = username.trim();
    if (!uname || !password) { setErr("Username and password required."); return; }
    if (mode === "signup" && (uname.length < 3 || uname.length > 20 || !/^[a-zA-Z0-9_]+$/.test(uname))) {
      setErr("Username must be 3-20 chars: letters, numbers, underscore."); return;
    }
    if (mode === "signup" && password.length < 6) { setErr("Password must be at least 6 characters."); return; }

    setBusy(true);
    const result = mode === "signup" ? await signUp(uname, password) : await signIn(uname, password);
    setBusy(false);

    if (result.error) { setErr(result.error.message || "Something went wrong."); return; }
    showToast(mode === "signup" ? `Welcome, ${uname}.` : `Welcome back, ${uname}.`);
    onLogin(result.data);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 5, padding: 28, width: 360, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#5a5450", cursor: "pointer" }}>
          <Icon name="close" size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="lock" size={16} style={{ color: "#c4401f" }} />
          <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 600 }}>{mode === "login" ? "sign in" : "create account"}</span>
        </div>
        <p style={{ color: "#5a5450", fontSize: 12.5, marginTop: 4, marginBottom: 20 }}>
          Shared forum account. Don't reuse a password you care about elsewhere.
        </p>

        <label style={labelStyle}>username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} onKeyDown={(e) => e.key === "Enter" && submit()} />

        <label style={{ ...labelStyle, marginTop: 12 }}>password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} onKeyDown={(e) => e.key === "Enter" && submit()} />

        {err && <div style={{ color: "#e2725a", fontSize: 12.5, marginTop: 10 }}>{err}</div>}

        <button onClick={submit} disabled={busy} style={{ ...primaryBtn, width: "100%", marginTop: 18, opacity: busy ? 0.6 : 1 }}>
          {busy ? "..." : mode === "login" ? "sign in" : "create account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#5a5450" }}>
          {mode === "login" ? (
            <>no account? <span onClick={() => { setMode("signup"); setErr(""); }} style={{ color: "#c4401f", cursor: "pointer" }}>sign up</span></>
          ) : (
            <>have an account? <span onClick={() => { setMode("login"); setErr(""); }} style={{ color: "#c4401f", cursor: "pointer" }}>sign in</span></>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, color: "#5a5450", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 };
