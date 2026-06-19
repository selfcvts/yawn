import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const roleColor = { owner:"#f39c12", admin:"#e74c3c", mod:"#27ae60", member:"#7f8c8d" };

  return (
    <nav style={{background:"#0d0d0d",borderBottom:"1px solid #1a1a1a",position:"sticky",top:0,zIndex:200}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",height:54,display:"flex",alignItems:"center",gap:24}}>
        <Link to="/" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:20,color:"#e8e8e8",letterSpacing:5}}>ROOT</span>
          <span style={{color:"var(--red)",fontSize:10,marginTop:-8}}>●</span>
        </Link>
        <div style={{display:"flex",gap:20,flex:1}}>
          {[["Forum","/"],["Categories","/categories"],["Leaderboard","/leaderboard"]].map(([l,h])=>(
            <Link key={h} to={h} style={{color:"#777",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:.8,textDecoration:"none"}}>{l}</Link>
          ))}
        </div>
        {user ? (
          <div style={{position:"relative"}}>
            <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 8px",borderRadius:6}}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover"}} />
                : <div className="avatar" style={{width:28,height:28,fontSize:11,background:user.avatar_color||"#c0392b"}}>{user.username[0].toUpperCase()}</div>
              }
              <span style={{color:"#e8e8e8",fontSize:13,fontWeight:600}}>{user.username}</span>
              {user.custom_badge && <span style={{fontSize:10,background:user.custom_badge_color||"#c0392b",color:"#fff",padding:"1px 5px",borderRadius:3,fontWeight:700}}>{user.custom_badge}</span>}
              <span style={{color:"#444",fontSize:9}}>▼</span>
            </button>
            {open && (
              <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"#161616",border:"1px solid #222",borderRadius:8,width:180,overflow:"hidden",boxShadow:"0 12px 32px rgba(0,0,0,.6)",zIndex:300}}>
                <div style={{padding:"10px 14px",borderBottom:"1px solid #1e1e1e"}}>
                  <div style={{fontSize:11,color:roleColor[user.role]||"#888",fontWeight:700,textTransform:"uppercase"}}>{user.role}</div>
                  <div style={{fontSize:12,color:"#666",marginTop:2}}>{user.rep} rep</div>
                </div>
                {[["Profile",`/u/${user.username}`],["Settings","/settings"],...(["admin","owner","mod"].includes(user.role)?[["Admin Panel","/admin"]]:[])]
                  .map(([l,h])=><Link key={h} to={h} style={{display:"block",padding:"10px 14px",color:"#ccc",fontSize:13,textDecoration:"none"}} onClick={()=>setOpen(false)}>{l}</Link>)}
                <div style={{height:1,background:"#1e1e1e"}}/>
                <button onClick={()=>{logout();navigate("/");setOpen(false)}} style={{display:"block",width:"100%",padding:"10px 14px",background:"none",color:"#e74c3c",fontSize:13,textAlign:"left",cursor:"pointer",border:"none",fontFamily:"var(--font)"}}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{display:"flex",gap:8}}>
            <Link to="/login"><button className="btn btn-ghost btn-sm">Login</button></Link>
            <Link to="/register"><button className="btn btn-primary btn-sm">Join</button></Link>
          </div>
        )}
      </div>
    </nav>
  );
}
