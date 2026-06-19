import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API } from "../context/AuthContext";
import TimeAgo from "react-timeago";

const SECTIONS = [
  { key:"pinned", label:"📌 Official", desc:"News & curated content", color:"#c0392b" },
  { key:"looksmaxxing", label:"💎 Looksmaxxing", desc:"Ascension, questions, rating", color:"#8e44ad" },
  { key:"general", label:"💬 General", desc:"Off-topic, languages, culture", color:"#2c3e50" },
];

export default function Home() {
  const [cats, setCats] = useState([]);
  const [threads, setThreads] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(()=>{
    fetch(`${API}/categories`).then(r=>r.json()).then(setCats);
    fetch(`${API}/threads?limit=10&sort=latest`).then(r=>r.json()).then(d=>setThreads(d.threads||[]));
    fetch(`${API}/stats`).then(r=>r.json()).then(setStats);
  },[]);

  const catsBySection = {};
  cats.forEach(c=>{ if(!catsBySection[c.section]) catsBySection[c.section]=[]; catsBySection[c.section].push(c); });

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
      {/* Hero */}
      <div style={{padding:"40px 0 32px",borderBottom:"1px solid #1a1a1a"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:40,flexWrap:"wrap"}}>
          <div>
            <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--red)",letterSpacing:3,marginBottom:10}}>rot.dpdns.org</div>
            <h1 style={{fontFamily:"var(--mono)",fontSize:58,fontWeight:700,lineHeight:.9,letterSpacing:6,color:"#e8e8e8"}}>
              ROOT<span style={{color:"var(--red)"}}>●</span>
            </h1>
            <p style={{color:"#555",marginTop:14,fontSize:14,maxWidth:360}}>An evidence-based, aesthetics-focused community. No cope, no delusion.</p>
          </div>
          {stats && (
            <div style={{display:"flex",gap:32,paddingTop:8}}>
              {[["Members",stats.users],["Threads",stats.threads],["Posts",stats.posts],["Online",stats.online]].map(([k,v])=>(
                <div key={k} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:30,fontWeight:700,color:"#e8e8e8",lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{k}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{display:"flex",gap:24,paddingTop:28,alignItems:"flex-start"}}>
        {/* Categories */}
        <div style={{flex:1}}>
          {SECTIONS.map(sec=>{
            const sectionCats = catsBySection[sec.key] || [];
            if (!sectionCats.length) return null;
            return (
              <div key={sec.key} style={{marginBottom:28}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:3,height:20,background:sec.color,borderRadius:2}}/>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#e8e8e8"}}>{sec.label}</div>
                    <div style={{fontSize:11,color:"#444"}}>{sec.desc}</div>
                  </div>
                </div>
                {sectionCats.map(cat=>(
                  <Link to={`/c/${cat.slug}`} key={cat.slug} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#111",border:"1px solid #1a1a1a",borderRadius:6,marginBottom:2,textDecoration:"none",transition:"border-color .15s",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:38,height:38,background:cat.color+"18",border:`1px solid ${cat.color}33`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.icon}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:"#e0e0e0"}}>{cat.name}</div>
                        <div style={{fontSize:11,color:"#444",marginTop:2}}>{cat.description}</div>
                        {cat.admin_only ? <span style={{fontSize:9,background:"#c0392b22",color:"#c0392b",border:"1px solid #c0392b44",padding:"1px 5px",borderRadius:2,fontWeight:700}}>ADMIN ONLY</span> : null}
                        {cat.mod_curated ? <span style={{fontSize:9,background:"#f39c1222",color:"#f39c12",border:"1px solid #f39c1244",padding:"1px 5px",borderRadius:2,fontWeight:700}}>MOD CURATED</span> : null}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:20,flexShrink:0}}>
                      {[["threads",cat.thread_count],["posts",cat.post_count]].map(([l,v])=>(
                        <div key={l} style={{textAlign:"right"}}>
                          <div style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:700,color:"#ccc"}}>{v}</div>
                          <div style={{fontSize:10,color:"#444"}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",gap:16}}>
          <div className="card" style={{overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a1a",fontSize:10,fontWeight:700,color:"#444",textTransform:"uppercase",letterSpacing:1}}>Recent Posts</div>
            {threads.map(t=>(
              <Link to={`/t/${t.id}`} key={t.id} style={{display:"block",padding:"10px 14px",borderBottom:"1px solid #111",textDecoration:"none"}}>
                <div style={{fontSize:12,color:"#d0d0d0",fontWeight:500,lineHeight:1.3,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{t.title}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:10,color:t.cat_color||"#555",fontWeight:700}}>{t.cat_slug}</span>
                  <span style={{fontSize:10,color:"#333"}}>·</span>
                  <span style={{fontSize:10,color:"#333"}}><TimeAgo date={t.last_post_at*1000} /></span>
                </div>
              </Link>
            ))}
            <Link to="/threads" style={{display:"block",padding:"8px 14px",fontSize:11,color:"#555",textAlign:"center"}}>View all →</Link>
          </div>
          <Link to="/leaderboard">
            <div className="card" style={{padding:"12px 14px",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:11,color:"#444",marginBottom:4}}>🏆 Top Members</div>
              <div style={{fontSize:12,color:"#888"}}>View leaderboard</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
