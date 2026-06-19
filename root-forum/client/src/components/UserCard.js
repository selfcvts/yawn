import { Link } from "react-router-dom";

const ROLE_COLORS = { owner:"#f39c12", admin:"#e74c3c", mod:"#27ae60", member:"#555" };
const ROLE_LABELS = { owner:"👑 OWNER", admin:"⚡ ADMIN", mod:"🛡 MOD", member:"member" };

export default function UserCard({ user, compact = false }) {
  if (!user) return null;
  const role = user.role || "member";
  const repColor = user.rep > 100 ? "#f39c12" : user.rep > 0 ? "#27ae60" : user.rep < 0 ? "#e74c3c" : "#555";

  if (compact) return (
    <Link to={`/u/${user.username}`} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none"}}>
      {user.avatar_url
        ? <img src={user.avatar_url} alt="" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",border:`2px solid ${user.profile_color||"#222"}`}} />
        : <div className="avatar" style={{width:32,height:32,fontSize:13,background:user.avatar_color||"#c0392b"}}>{user.username[0].toUpperCase()}</div>
      }
      <div>
        <div style={{fontSize:13,fontWeight:700,color:"#e8e8e8"}}>{user.username}</div>
        {user.custom_badge && <span style={{fontSize:10,background:user.custom_badge_color||"#c0392b",color:"#fff",padding:"1px 5px",borderRadius:2,fontWeight:700}}>{user.custom_badge}</span>}
      </div>
    </Link>
  );

  return (
    <div style={{width:160,flexShrink:0,padding:"16px 12px",background:"#0d0d0d",borderRight:"1px solid #1a1a1a",display:"flex",flexDirection:"column",gap:8,alignItems:"center",textAlign:"center"}}>
      <Link to={`/u/${user.username}`}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:`2px solid ${user.profile_color||"#222"}`}} />
          : <div className="avatar" style={{width:56,height:56,fontSize:22,background:user.avatar_color||"#c0392b"}}>{user.username[0].toUpperCase()}</div>
        }
      </Link>
      <Link to={`/u/${user.username}`} style={{textDecoration:"none"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#e8e8e8",wordBreak:"break-all"}}>{user.username}</div>
      </Link>
      {user.custom_badge && <span style={{fontSize:10,background:user.custom_badge_color||"#c0392b",color:"#fff",padding:"2px 7px",borderRadius:3,fontWeight:700}}>{user.custom_badge}</span>}
      <div style={{fontSize:10,color:ROLE_COLORS[role],fontWeight:700}}>{ROLE_LABELS[role]}</div>
      <div style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:repColor}}>{user.rep > 0 ? "+" : ""}{user.rep || 0} rep</div>
      <div style={{fontSize:10,color:"#444"}}>{user.post_count||0} posts</div>
      {user.profile_bio && <div style={{fontSize:11,color:"#555",lineHeight:1.4,borderTop:"1px solid #1a1a1a",paddingTop:8,width:"100%",wordBreak:"break-word"}}>{user.profile_bio}</div>}
    </div>
  );
}
