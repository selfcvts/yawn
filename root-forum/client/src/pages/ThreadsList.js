import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API } from "../context/AuthContext";
import TimeAgo from "react-timeago";

export default function ThreadsList() {
  const [threads, setThreads] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sort, setSort] = useState("latest");

  useEffect(()=>{
    fetch(`${API}/threads?page=${page}&sort=${sort}&limit=25`)
      .then(r=>r.json()).then(d=>{ setThreads(d.threads||[]); setPages(d.pages||1); });
  },[page,sort]);

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"24px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:700,color:"#e8e8e8"}}>All Threads</h1>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{width:"auto",padding:"6px 10px",fontSize:12}}>
          <option value="latest">Latest</option>
          <option value="top">Most Replies</option>
        </select>
      </div>
      {threads.map(t=>(
        <Link to={`/t/${t.id}`} key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",background:"#111",border:"1px solid #1a1a1a",borderRadius:5,marginBottom:2,textDecoration:"none",gap:12}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1,minWidth:0}}>
            {t.avatar_url ? <img src={t.avatar_url} alt="" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",flexShrink:0}} />
              : <div className="avatar" style={{width:28,height:28,fontSize:11,background:t.avatar_color||"#c0392b"}}>{t.username?.[0]?.toUpperCase()}</div>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#e0e0e0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
              <div style={{fontSize:11,color:"#444",marginTop:2}}>
                <span style={{color:t.cat_color||"#555",fontWeight:700}}>{t.cat_name}</span> · {t.username} · <TimeAgo date={t.last_post_at*1000} />
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:16,flexShrink:0,textAlign:"right"}}>
            <div><div style={{fontFamily:"var(--mono)",fontSize:12,color:"#666"}}>{t.reply_count}</div><div style={{fontSize:9,color:"#333"}}>replies</div></div>
            <div><div style={{fontFamily:"var(--mono)",fontSize:12,color:"#444"}}>{t.views}</div><div style={{fontSize:9,color:"#333"}}>views</div></div>
          </div>
        </Link>
      ))}
      {pages>1&&(
        <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:16}}>
          {Array.from({length:pages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} className={`btn btn-sm ${p===page?"btn-primary":"btn-ghost"}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
