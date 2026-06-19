import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API } from "../context/AuthContext";

const ROLE_COLORS = { owner:"#f39c12", admin:"#e74c3c", mod:"#27ae60", member:"#555" };
const MEDALS = ["🥇","🥈","🥉"];

export default function Leaderboard() {
  const [users, setUsers] = useState([]);

  useEffect(()=>{ fetch(`${API}/leaderboard`).then(r=>r.json()).then(setUsers); },[]);

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"32px 20px"}}>
      <h1 style={{fontFamily:"var(--mono)",fontSize:26,fontWeight:700,color:"#e8e8e8",letterSpacing:2,marginBottom:6}}>LEADERBOARD</h1>
      <div style={{fontSize:12,color:"#444",marginBottom:24}}>Ranked by reputation</div>
      {users.map((u,i)=>(
        <Link to={`/u/${u.username}`} key={u.id} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 18px",background:"#111",border:"1px solid #1a1a1a",borderRadius:6,marginBottom:2,textDecoration:"none",transition:"border-color .15s"}}>
          <div style={{width:32,textAlign:"center",fontFamily:"var(--mono)",fontSize:i<3?22:16,fontWeight:700,color:i===0?"#f39c12":i===1?"#aaa":i===2?"#cd7f32":"#333"}}>
            {i<3 ? MEDALS[i] : i+1}
          </div>
          {u.avatar_url
            ? <img src={u.avatar_url} alt="" style={{width:40,height:40,borderRadius:"50%",objectFit:"cover"}} />
            : <div className="avatar" style={{width:40,height:40,fontSize:16,background:u.avatar_color||"#c0392b"}}>{u.username[0].toUpperCase()}</div>
          }
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:14,fontWeight:700,color:"#e0e0e0"}}>{u.username}</span>
              {u.custom_badge && <span style={{fontSize:10,background:u.custom_badge_color||"#c0392b",color:"#fff",padding:"1px 6px",borderRadius:2,fontWeight:700}}>{u.custom_badge}</span>}
              <span style={{fontSize:10,color:ROLE_COLORS[u.role]||"#555",fontWeight:700,textTransform:"uppercase"}}>{u.role}</span>
            </div>
            <div style={{fontSize:11,color:"#444",marginTop:2}}>{u.post_count} posts</div>
          </div>
          <div style={{fontFamily:"var(--mono)",fontSize:18,fontWeight:700,color:u.rep>0?"#27ae60":u.rep<0?"#e74c3c":"#555"}}>
            {u.rep>0?"+":""}{u.rep}
          </div>
        </Link>
      ))}
    </div>
  );
}
