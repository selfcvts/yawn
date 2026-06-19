import { useState } from "react";
import { API, useAuth } from "../context/AuthContext";

const REACTIONS = [
  { key:"agree", label:"Agree", emoji:"✅", value:1, color:"#27ae60" },
  { key:"disagree", label:"Disagree", emoji:"❌", value:-1, color:"#e74c3c" },
  { key:"funny", label:"Funny", emoji:"😂", value:1, color:"#f39c12" },
  { key:"informative", label:"Informative", emoji:"📚", value:2, color:"#2980b9" },
  { key:"winner", label:"Winner", emoji:"🏆", value:3, color:"#f1c40f" },
  { key:"creative", label:"Creative", emoji:"🎨", value:1, color:"#9b59b6" },
  { key:"late", label:"Late", emoji:"⏰", value:0, color:"#7f8c8d" },
  { key:"autistic", label:"Autistic", emoji:"🧩", value:-1, color:"#7f8c8d" },
  { key:"retarded", label:"Retarded", emoji:"💀", value:-1, color:"#555" },
  { key:"cope", label:"Cope", emoji:"🤡", value:-1, color:"#e67e22" },
  { key:"like", label:"Like", emoji:"👍", value:1, color:"#3498db" },
  { key:"dislike", label:"Dislike", emoji:"👎", value:-1, color:"#e74c3c" },
  { key:"mega-rep", label:"MEGA REP", emoji:"⚡+10", value:10, color:"#f39c12", mega:true },
  { key:"mega-dislike", label:"MEGA DISLIKE", emoji:"💀-10", value:-10, color:"#8b0000", mega:true },
];

export default function ReactionBar({ post, myUserId, onUpdate }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || []);
  const [expanded, setExpanded] = useState(false);

  // Group reactions by type
  const grouped = {};
  reactions.forEach(r => {
    if (!grouped[r.reaction]) grouped[r.reaction] = [];
    grouped[r.reaction].push(r.user_id);
  });

  const myReactions = new Set(reactions.filter(r=>r.user_id===myUserId).map(r=>r.reaction));

  const react = async (key) => {
    if (!token) return alert("Login to react");
    if (post.user_id === myUserId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/posts/${post.id}/react`, {
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body: JSON.stringify({ reaction: key })
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error); return; }
      if (data.toggled) {
        setReactions(prev => [...prev, { post_id:post.id, user_id:myUserId, reaction:key }]);
      } else {
        setReactions(prev => prev.filter(r => !(r.user_id===myUserId && r.reaction===key)));
      }
      if (onUpdate) onUpdate();
    } finally { setLoading(false); }
  };

  const totalRep = post.rep_score || 0;
  const isAdmin = user && ["admin","owner"].includes(user.role);
  const visible = expanded ? REACTIONS : REACTIONS.filter(r => !r.mega || isAdmin);

  return (
    <div style={{marginTop:8}}>
      {/* Rep score badge */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:totalRep>0?"#27ae60":totalRep<0?"#e74c3c":"#555",background:"#0f0f0f",border:`1px solid ${totalRep>0?"#27ae60":totalRep<0?"#e74c3c":"#222"}`,padding:"2px 8px",borderRadius:3}}>
          {totalRep > 0 ? "+" : ""}{totalRep} rep
        </span>
        <button type="button" onClick={()=>setExpanded(!expanded)} style={{background:"none",border:"none",color:"#444",fontSize:11,cursor:"pointer",padding:0}}>
          {expanded ? "▲ less" : "▼ more reactions"}
        </button>
      </div>

      {/* Reaction buttons */}
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        {visible.map(r => {
          const count = grouped[r.key]?.length || 0;
          const mine = myReactions.has(r.key);
          return (
            <button key={r.key} type="button" onClick={()=>react(r.key)} disabled={loading}
              title={`${r.label} (${r.value > 0 ? "+" : ""}${r.value} rep)`}
              style={{
                display:"flex",alignItems:"center",gap:4,padding: r.mega ? "4px 10px" : "3px 8px",
                borderRadius:4,border:`1px solid ${mine ? r.color : "#222"}`,
                background: mine ? r.color+"22" : "#111",
                color: mine ? r.color : "#555",
                fontSize: r.mega ? 11 : 12,cursor:"pointer",fontWeight: mine ? 700 : 400,
                transition:"all .15s",
                boxShadow: r.mega && mine ? `0 0 8px ${r.color}44` : "none",
              }}>
              <span style={{fontSize: r.mega ? 11 : 14}}>{r.emoji}</span>
              {count > 0 && <span style={{fontSize:11,fontWeight:700}}>{count}</span>}
              {r.mega && <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{r.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Reaction summary row - looksmaxxing style */}
      {Object.keys(grouped).length > 0 && (
        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:6}}>
          {Object.entries(grouped).map(([key, users]) => {
            const meta = REACTIONS.find(r=>r.key===key);
            if (!meta) return null;
            return (
              <div key={key} style={{fontSize:11,color:"#555",display:"flex",alignItems:"center",gap:3}}>
                <span>{meta.emoji}</span>
                <span style={{color:meta.color,fontWeight:700}}>{users.length}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
