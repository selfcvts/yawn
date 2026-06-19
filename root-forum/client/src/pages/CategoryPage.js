import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API, useAuth } from "../context/AuthContext";
import TimeAgo from "react-timeago";
import PostComposer from "../components/PostComposer";

export default function CategoryPage() {
  const { slug } = useParams();
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [cat, setCat] = useState(null);
  const [threads, setThreads] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sort, setSort] = useState("latest");
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [fontFamily, setFontFamily] = useState("");
  const [fontSize, setFontSize] = useState("14px");
  const [textColor, setTextColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const cats = await fetch(`${API}/categories`).then(r=>r.json());
      const found = cats.find(c=>c.slug===slug);
      setCat(found);
      const data = await fetch(`${API}/threads?category=${slug}&page=${page}&sort=${sort}`).then(r=>r.json());
      setThreads(data.threads||[]);
      setPages(data.pages||1);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [slug,page,sort]);

  const submitThread = async ({ body, fontFamily, fontSize, textColor }) => {
    if (!title.trim() || !body.trim()) { setError("Title and body required"); return; }
    const r = await authFetch(`${API}/threads`, { method:"POST", body: JSON.stringify({ category_slug:slug, title, body, font_family:fontFamily, font_size:fontSize, text_color:textColor }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    navigate(`/t/${data.id}`);
  };

  const canPost = user && (!cat?.admin_only || ["admin","owner"].includes(user.role));

  if (loading) return <div className="spinner" />;
  if (!cat) return <div style={{padding:40,color:"#555",textAlign:"center"}}>Category not found</div>;

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,background:cat.color+"18",border:`1px solid ${cat.color}33`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{cat.icon}</div>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#e8e8e8"}}>{cat.name}</h1>
            <div style={{fontSize:12,color:"#555"}}>{cat.description}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{width:"auto",padding:"6px 10px",fontSize:12}}>
            <option value="latest">Latest</option>
            <option value="top">Top</option>
          </select>
          {canPost && <button className="btn btn-primary" onClick={()=>setShowNew(!showNew)}>+ New Thread</button>}
        </div>
      </div>

      {/* New thread form */}
      {showNew && (
        <div className="card" style={{marginBottom:20,padding:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#888",marginBottom:14,textTransform:"uppercase",letterSpacing:.5}}>New Thread</h3>
          {error && <div className="error-msg" style={{marginBottom:10}}>{error}</div>}
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Thread title…" style={{marginBottom:12}} />
          <PostComposer onSubmit={submitThread} placeholder="Thread content…" submitLabel="Create Thread" />
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="empty"><span>🕸️</span>No threads yet. Start one.</div>
      ) : threads.map(t => <ThreadRow key={t.id} t={t} />)}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:20}}>
          {Array.from({length:pages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} className={`btn btn-sm ${p===page?"btn-primary":"btn-ghost"}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadRow({ t }) {
  const repColor = t.rep_score > 0 ? "#27ae60" : t.rep_score < 0 ? "#e74c3c" : "#333";
  return (
    <Link to={`/t/${t.id}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#111",border:"1px solid #1a1a1a",borderRadius:6,marginBottom:2,textDecoration:"none",gap:12}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1,minWidth:0}}>
        {t.avatar_url
          ? <img src={t.avatar_url} alt="" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0}} />
          : <div className="avatar" style={{width:32,height:32,fontSize:12,background:t.avatar_color||"#c0392b"}}>{t.username?.[0]?.toUpperCase()}</div>
        }
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
            {t.is_pinned ? <span style={{fontSize:10,color:"#f39c12"}}>📌</span> : null}
            {t.is_locked ? <span style={{fontSize:10,color:"#555"}}>🔒</span> : null}
            {t.is_featured ? <span style={{fontSize:10,color:"#f39c12"}}>⭐</span> : null}
            <span style={{fontSize:14,fontWeight:600,color:"#e0e0e0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
          </div>
          <div style={{fontSize:11,color:"#444"}}>
            by <span style={{color:"#666"}}>{t.username}</span> · <TimeAgo date={t.last_post_at*1000} />
            {t.last_post_user && ` · last: ${t.last_post_user}`}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:20,flexShrink:0,textAlign:"center"}}>
        <div>
          <div style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:"#888"}}>{t.reply_count}</div>
          <div style={{fontSize:10,color:"#333"}}>replies</div>
        </div>
        <div>
          <div style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:"#555"}}>{t.views}</div>
          <div style={{fontSize:10,color:"#333"}}>views</div>
        </div>
      </div>
    </Link>
  );
}
