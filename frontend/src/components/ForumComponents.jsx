import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Re-export helper functions
export function timeAgo(iso) {
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
  up: "M12 5l7 8h-5v6h-4v-6H5z",
  down: "M12 19l-7-8h5V5h4v6h5z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
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

function Avatar({ name, size = 32, imageUrl = null }) {
  if (imageUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: 3, overflow: "hidden", border: "1px solid #2e2722", flexShrink: 0 }}>
        <img src={imageUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  
  const initial = (name || "?").charAt(0).toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 3,
        flexShrink: 0,
        background: `hsl(${h}, 35%, 18%)`,
        border: "1px solid #2e2722",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Oswald, sans-serif",
        fontWeight: 500,
        fontSize: size * 0.45,
        color: `hsl(${h}, 45%, 70%)`,
        letterSpacing: 0.5,
      }}
    >
      {initial}
    </div>
  );
}

export function CategoryPage({ categories, categoryId, user, onBack, onOpenThread, requireAuth, showToast }) {
  const cat = categories.find((c) => c.id === categoryId);
  const [threads, setThreads] = useState(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [richContent, setRichContent] = useState(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/categories/${categoryId}/threads`);
      setThreads(data);
    } catch (error) {
      showToast("Could not load threads.", "error");
      setThreads([]);
    }
  }, [categoryId, showToast]);

  useEffect(() => { load(); }, [load]);

  if (!cat) return null;

  async function submitThread() {
    if (!user) { requireAuth(); return; }
    if (!title.trim() || !body.trim()) { showToast("Title and body required.", "error"); return; }
    
    const isAdminOnly = cat.admin_only;
    if (isAdminOnly && !["admin", "owner"].includes(user.role)) {
      showToast("Only admins can post in this category.", "error");
      return;
    }
    
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("category_id", categoryId);
      formData.append("title", title.trim());
      formData.append("author", user.username);
      formData.append("body", body.trim());
      if (richContent) {
        formData.append("rich_content", JSON.stringify(richContent));
      }
      
      await axios.post(`${API}/threads`, formData);
      setTitle("");
      setBody("");
      setRichContent(null);
      setComposing(false);
      showToast("Thread posted.");
      load();
    } catch (error) {
      showToast(error.response?.data?.detail || "Could not post thread.", "error");
    }
    setPosting(false);
  }

  return (
    <div data-testid="category-page">
      <BackRow onBack={onBack} label="all categories" />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 18, marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 28, margin: 0 }}>{cat.name}</h1>
          <p style={{ color: "#7a7066", fontSize: 14, marginTop: 6 }}>{cat.description}</p>
        </div>
        <button 
          data-testid="new-thread-button"
          onClick={() => (user ? setComposing(true) : requireAuth())} 
          style={primaryBtn}
        >
          + new thread
        </button>
      </div>

      {composing && (
        <div style={cardStyle}>
          <input 
            data-testid="thread-title-input"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Thread title" 
            style={inputStyle} 
            autoFocus 
          />
          <div style={{ marginTop: 10 }}>
            <RichTextEditor 
              value={body}
              onChange={setBody}
              onRichContentChange={setRichContent}
              placeholder="Write the opening post..."
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setComposing(false)} style={ghostBtn}>cancel</button>
            <button 
              data-testid="post-thread-button"
              onClick={submitThread} 
              disabled={posting} 
              style={{ ...primaryBtn, opacity: posting ? 0.6 : 1 }}
            >
              {posting ? "posting..." : "post thread"}
            </button>
          </div>
        </div>
      )}

      {threads === null && <EmptyNote text="loading threads..." />}
      {threads && threads.length === 0 && <EmptyNote text="No threads yet. Be the first!" />}
      {threads && threads.map((t) => <ThreadRow key={t.id} thread={t} onOpen={() => onOpenThread(t.id)} />)}
    </div>
  );
}

function ThreadRow({ thread, onOpen }) {
  const heat = Math.min(1, thread.replyCount / 20);
  return (
    <div
      onClick={onOpen}
      data-testid={`thread-row-${thread.id}`}
      style={{ display: "flex", gap: 14, padding: "16px 4px", borderBottom: "1px solid #1c1814", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#13110f")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: 3, borderRadius: 2, background: `rgba(196,64,31,${0.25 + heat * 0.75})`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 15, color: "#e8d9c0" }}>{thread.title}</div>
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
const primaryBtn = {
  background: "#c4401f",
  color: "#0d0c0b",
  border: "none",
  borderRadius: 3,
  padding: "8px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "Oswald, sans-serif",
  letterSpacing: 0.5,
  textTransform: "uppercase",
};
const ghostBtn = {
  background: "transparent",
  color: "#a89a85",
  border: "1px solid #2e2722",
  borderRadius: 3,
  padding: "7px 14px",
  fontSize: 12,
  cursor: "pointer",
};
