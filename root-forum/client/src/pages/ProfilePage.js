import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { API, useAuth } from "../context/AuthContext";
import TimeAgo from "react-timeago";

const ROLE_COLORS = { owner:"#f39c12", admin:"#e74c3c", mod:"#27ae60", member:"#555" };

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me, authFetch, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [threads, setThreads] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("#c0392b");
  const [donateAmt, setDonateAmt] = useState(10);
  const [donateReason, setDonateReason] = useState("");
  const [msg, setMsg] = useState("");
  const avatarRef = useRef();
  const bannerRef = useRef();
  const musicRef = useRef();
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);

  const isMe = me?.username === username;

  const load = async () => {
    const r = await fetch(`${API}/users/${username}`);
    if (!r.ok) return;
    const d = await r.json();
    setProfile(d.user);
    setThreads(d.threads||[]);
    setBio(d.user.profile_bio||"");
    setColor(d.user.profile_color||"#c0392b");
  };

  useEffect(()=>{ load(); }, [username]);

  const saveProfile = async () => {
    const r = await authFetch(`${API}/users/me`, { method:"PATCH", body: JSON.stringify({ profile_bio:bio, profile_color:color }) });
    if (r.ok) { await load(); await refreshUser(); setEditing(false); setMsg("Saved!"); setTimeout(()=>setMsg(""),2000); }
  };

  const uploadFile = async (file, endpoint, field) => {
    const fd = new FormData();
    fd.append("file", file);
    const token = localStorage.getItem("root_token");
    const r = await fetch(endpoint, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body:fd });
    if (r.ok) { await load(); await refreshUser(); }
    else { const d = await r.json(); alert(d.error); }
  };

  const donate = async () => {
    const r = await authFetch(`${API}/rep/donate`, { method:"POST", body: JSON.stringify({ username, amount:donateAmt, reason:donateReason }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error); } else { setMsg(`Donated ${donateAmt} rep!`); load(); }
    setTimeout(()=>setMsg(""),3000);
  };

  if (!profile) return <div className="spinner" />;

  const repColor = profile.rep > 100 ? "#f39c12" : profile.rep > 0 ? "#27ae60" : profile.rep < 0 ? "#e74c3c" : "#555";

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"0 20px 40px"}}>
      {/* Banner */}
      <div style={{position:"relative",height:200,background:profile.banner_url ? `url(${profile.banner_url}) center/cover` : `linear-gradient(135deg,${profile.profile_color||"#1a1a1a"},#0a0a0a)`,borderBottom:"1px solid #1a1a1a",borderRadius:"0 0 12px 12px"}}>
        {isMe && (
          <>
            <input ref={bannerRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],`${API}/users/me/banner`)} />
            <button onClick={()=>bannerRef.current.click()} style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.6)",border:"1px solid #333",color:"#ccc",borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Change Banner</button>
          </>
        )}
      </div>

      {/* Avatar + info */}
      <div style={{padding:"0 24px",marginTop:-36}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:16,marginBottom:20}}>
          <div style={{position:"relative",flexShrink:0}}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:`3px solid ${profile.profile_color||"#111"}`,background:"#111"}} />
              : <div className="avatar" style={{width:80,height:80,fontSize:30,background:profile.avatar_color||"#c0392b",border:`3px solid #111`}}>{profile.username[0].toUpperCase()}</div>
            }
            {isMe && (
              <>
                <input ref={avatarRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],`${API}/users/me/avatar`)} />
                <button onClick={()=>avatarRef.current.click()} style={{position:"absolute",bottom:0,right:0,width:24,height:24,borderRadius:"50%",background:"#c0392b",border:"2px solid #111",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </>
            )}
          </div>
          <div style={{flex:1,paddingBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <h1 style={{fontSize:22,fontWeight:700,color:"#e8e8e8"}}>{profile.username}</h1>
              {profile.custom_badge && <span style={{fontSize:11,background:profile.custom_badge_color||"#c0392b",color:"#fff",padding:"2px 8px",borderRadius:3,fontWeight:700}}>{profile.custom_badge}</span>}
              <span style={{fontSize:11,color:ROLE_COLORS[profile.role]||"#555",fontWeight:700,textTransform:"uppercase"}}>{profile.role}</span>
            </div>
            <div style={{display:"flex",gap:20,marginTop:8,flexWrap:"wrap"}}>
              {[[`${profile.rep > 0?"+":""}${profile.rep||0}`, "rep", repColor],[""+profile.post_count,"posts","#555"]].map(([v,l,c])=>(
                <div key={l}><span style={{fontFamily:"var(--mono)",fontWeight:700,color:c}}>{v}</span> <span style={{fontSize:11,color:"#444"}}>{l}</span></div>
              ))}
            </div>
          </div>
          {isMe && <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(!editing)}>{editing?"Cancel":"Edit Profile"}</button>}
        </div>

        {/* Profile music */}
        {profile.profile_music_url && (
          <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:8,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:14}}>🎵</span>
            <audio ref={audioRef} src={profile.profile_music_url} onEnded={()=>setPlaying(false)} />
            <button onClick={()=>{ if(playing){audioRef.current.pause();setPlaying(false);}else{audioRef.current.play();setPlaying(true);}}} style={{background:"#1a1a1a",border:"1px solid #2a2a2a",color:"#ccc",borderRadius:4,padding:"4px 12px",fontSize:12,cursor:"pointer"}}>{playing?"⏸ Pause":"▶ Play Music"}</button>
            <span style={{fontSize:11,color:"#444"}}>Profile track</span>
            {isMe && (
              <>
                <input ref={musicRef} type="file" accept="audio/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],`${API}/users/me/music`)} />
                <button onClick={()=>musicRef.current.click()} style={{marginLeft:"auto",background:"none",border:"1px solid #2a2a2a",color:"#555",borderRadius:4,padding:"3px 8px",fontSize:11,cursor:"pointer"}}>Change</button>
              </>
            )}
          </div>
        )}

        {!profile.profile_music_url && isMe && (
          <div style={{marginBottom:16}}>
            <input ref={musicRef} type="file" accept="audio/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],`${API}/users/me/music`)} />
            <button onClick={()=>musicRef.current.click()} className="btn btn-ghost btn-sm">🎵 Add Profile Music</button>
          </div>
        )}

        {/* Bio */}
        {profile.profile_bio && !editing && <p style={{color:"#888",fontSize:14,lineHeight:1.6,marginBottom:20,borderLeft:`3px solid ${profile.profile_color||"#c0392b"}`,paddingLeft:12}}>{profile.profile_bio}</p>}

        {/* Edit form */}
        {editing && (
          <div className="card" style={{padding:20,marginBottom:20}}>
            <h3 style={{fontSize:13,fontWeight:700,color:"#666",marginBottom:14,textTransform:"uppercase"}}>Edit Profile</h3>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:"#555",display:"block",marginBottom:4}}>Bio</label>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} style={{minHeight:80}} placeholder="Something about yourself…" />
            </div>
            <div style={{marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
              <label style={{fontSize:12,color:"#555"}}>Profile color:</label>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:40,height:32,padding:0,border:"none",cursor:"pointer"}} />
              <div style={{width:32,height:32,borderRadius:"50%",background:color}} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={saveProfile}>Save</button>
          </div>
        )}

        {msg && <div style={{marginBottom:12,fontSize:13,color:"#27ae60"}}>{msg}</div>}

        {/* Donate rep */}
        {me && me.username !== username && (
          <div className="card" style={{padding:16,marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:10,textTransform:"uppercase"}}>Donate Rep</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <input type="number" min="1" max="100" value={donateAmt} onChange={e=>setDonateAmt(+e.target.value)} style={{width:80}} />
              <input value={donateReason} onChange={e=>setDonateReason(e.target.value)} placeholder="Reason (optional)" style={{flex:1}} />
              <button className="btn btn-primary btn-sm" onClick={donate}>Donate</button>
            </div>
          </div>
        )}

        {/* Threads */}
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#555",marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Recent Threads</div>
          {threads.map(t=>(
            <Link to={`/t/${t.id}`} key={t.id} style={{display:"block",padding:"10px 0",borderBottom:"1px solid #1a1a1a",textDecoration:"none"}}>
              <div style={{fontSize:13,color:"#d0d0d0"}}>{t.title}</div>
              <div style={{fontSize:11,color:"#444",marginTop:3}}>in {t.cat_name} · <TimeAgo date={t.created_at*1000} /></div>
            </Link>
          ))}
          {threads.length===0 && <div style={{color:"#333",fontSize:13}}>No threads yet.</div>}
        </div>
      </div>
    </div>
  );
}
