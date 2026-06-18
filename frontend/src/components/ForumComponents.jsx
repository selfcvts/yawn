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
    <svg width={size} height={size} viewBox="0 0 24 24\" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
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
      const { data } = await axios.get(`${API}/categories/${categoryId}/threads`);\n      setThreads(data);\n    } catch (error) {\n      showToast("Could not load threads.", "error");\n      setThreads([]);\n    }\n  }, [categoryId, showToast]);\n\n  useEffect(() => { load(); }, [load]);\n\n  if (!cat) return null;\n\n  async function submitThread() {\n    if (!user) { requireAuth(); return; }\n    if (!title.trim() || !body.trim()) { showToast("Title and body required.", "error"); return; }\n    \n    const isAdminOnly = cat.admin_only;\n    if (isAdminOnly && !["admin", "owner"].includes(user.role)) {\n      showToast("Only admins can post in this category.", "error");\n      return;\n    }\n    \n    setPosting(true);\n    try {\n      const formData = new FormData();\n      formData.append("category_id", categoryId);\n      formData.append("title", title.trim());\n      formData.append("author", user.username);\n      formData.append("body", body.trim());\n      if (richContent) {\n        formData.append("rich_content", JSON.stringify(richContent));\n      }\n      \n      await axios.post(`${API}/threads`, formData);\n      setTitle("");\n      setBody("");\n      setRichContent(null);\n      setComposing(false);\n      showToast("Thread posted.");\n      load();\n    } catch (error) {\n      showToast(error.response?.data?.detail || "Could not post thread.", "error");\n    }\n    setPosting(false);\n  }\n\n  return (\n    <div data-testid=\"category-page\">\n      <BackRow onBack={onBack} label=\"all categories\" />\n      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 18, marginBottom: 24, gap: 16 }}>\n        <div>\n          <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 28, margin: 0 }}>{cat.name}</h1>\n          <p style={{ color: "#7a7066", fontSize: 14, marginTop: 6 }}>{cat.description}</p>\n        </div>\n        <button \n          data-testid=\"new-thread-button\"\n          onClick={() => (user ? setComposing(true) : requireAuth())} \n          style={primaryBtn}\n        >\n          + new thread\n        </button>\n      </div>\n\n      {composing && (\n        <div style={cardStyle}>\n          <input \n            data-testid=\"thread-title-input\"\n            value={title} \n            onChange={(e) => setTitle(e.target.value)} \n            placeholder=\"Thread title\" \n            style={inputStyle} \n            autoFocus \n          />\n          <div style={{ marginTop: 10 }}>\n            <RichTextEditor \n              value={body}\n              onChange={setBody}\n              onRichContentChange={setRichContent}\n              placeholder=\"Write the opening post...\"\n            />\n          </div>\n          <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>\n            <button onClick={() => setComposing(false)} style={ghostBtn}>cancel</button>\n            <button \n              data-testid=\"post-thread-button\"\n              onClick={submitThread} \n              disabled={posting} \n              style={{ ...primaryBtn, opacity: posting ? 0.6 : 1 }}\n            >\n              {posting ? "posting..." : "post thread"}\n            </button>\n          </div>\n        </div>\n      )}\n\n      {threads === null && <EmptyNote text=\"loading threads...\" />}\n      {threads && threads.length === 0 && <EmptyNote text=\"No threads yet. Be the first!\" />}\n      {threads && threads.map((t) => <ThreadRow key={t.id} thread={t} onOpen={() => onOpenThread(t.id)} />)}\n    </div>\n  );\n}\n\nfunction ThreadRow({ thread, onOpen }) {\n  const heat = Math.min(1, thread.replyCount / 20);\n  return (\n    <div\n      onClick={onOpen}\n      data-testid={`thread-row-${thread.id}`}\n      style={{ display: "flex", gap: 14, padding: "16px 4px", borderBottom: "1px solid #1c1814", cursor: "pointer" }}\n      onMouseEnter={(e) => (e.currentTarget.style.background = "#13110f")}\n      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}\n    >\n      <div style={{ width: 3, borderRadius: 2, background: `rgba(196,64,31,${0.25 + heat * 0.75})`, flexShrink: 0 }} />\n      <div style={{ flex: 1, minWidth: 0 }}>\n        <div style={{ fontWeight: 500, fontSize: 15, color: "#e8d9c0" }}>{thread.title}</div>\n        <div style={{ color: "#5a5450", fontSize: 12.5, marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>\n          {thread.author} · {timeAgo(thread.created_at)}\n        </div>\n      </div>\n      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#7a7066", minWidth: 70 }}>\n        <span>{thread.replyCount} replies</span>\n        <span style={{ color: thread.score > 0 ? "#c4401f" : "#5a5450" }}>{thread.score > 0 ? "+" : ""}{thread.score}</span>\n      </div>\n    </div>\n  );\n}\n\nfunction BackRow({ onBack, label }) {\n  return (\n    <div onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7a7066", fontSize: 13, cursor: "pointer", marginTop: 20 }}>\n      <Icon name=\"arrow\" size={14} style={{ transform: \"rotate(180deg)\" }} /> {label}\n    </div>\n  );\n}\n\nfunction EmptyNote({ text }) {\n  return <div style={{ padding: \"40px 0\", textAlign: \"center\", color: \"#5a5450\", fontSize: 13.5, fontFamily: \"JetBrains Mono, monospace\" }}>{text}</div>;\n}\n\nconst cardStyle = { background: \"#171411\", border: \"1px solid #2e2722\", borderRadius: 4, padding: 18, marginBottom: 20 };\nconst inputStyle = { width: \"100%\", background: \"#0d0c0b\", border: \"1px solid #2e2722\", borderRadius: 3, padding: \"10px 12px\", color: \"#e8d9c0\", fontSize: 14, outline: \"none\" };\nconst primaryBtn = {\n  background: \"#c4401f\", color: \"#0d0c0b\", border: \"none\", borderRadius: 3,\n  padding: \"8px 18px\", fontSize: 13, fontWeight: 600, cursor: \"pointer\",\n  fontFamily: \"Oswald, sans-serif\", letterSpacing: 0.5, textTransform: \"uppercase\",\n};\nconst ghostBtn = {\n  background: \"transparent\", color: \"#a89a85\", border: \"1px solid #2e2722\", borderRadius: 3,\n  padding: \"7px 14px\", fontSize: 12, cursor: \"pointer\",\n};\n