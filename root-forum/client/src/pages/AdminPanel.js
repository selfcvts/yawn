import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API, useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");
  const [targetUser, setTargetUser] = useState("");
  const [banReason, setBanReason] = useState("");
  const [muteHours, setMuteHours] = useState(24);
  const [badge, setBadge] = useState("");
  const [badgeColor, setBadgeColor] = useState("#c0392b");
  const [role, setRole] = useState("member");
  const [repAmt, setRepAmt] = useState(10);
  const [repReason, setRepReason] = useState("");
  const [msg, setMsg] = useState("");
  const [emojis, setEmojis] = useState([]);
  const [emojiName, setEmojiName] = useState("");
  const [emojiFile, setEmojiFile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const isOwner = ["admin","owner"].includes(user?.role);
  const isMod = ["mod","admin","owner"].includes(user?.role);

  useEffect(()=>{
    if (!isMod) { navigate("/"); return; }
    fetch(`${API}/emojis`).then(r=>r.json()).then(setEmojis);
    fetch(`${API}/leaderboard`).then(r=>r.json()).then(setLeaderboard);
  },[]);

  const action = async (endpoint, body, method="POST") => {
    const r = await authFetch(endpoint, { method, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) setMsg("❌ " + d.error);
    else setMsg("✅ Done");
    setTimeout(()=>setMsg(""),3000);
    return r.ok;
  };

  const uploadEmoji = async () => {
    if (!emojiName || !emojiFile) return;
    const fd = new FormData();
    fd.append("file", emojiFile);
    fd.append("name", emojiName);
    const token = localStorage.getItem("root_token");
    const r = await fetch(`${API}/emojis`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body:fd });
    const d = await r.json();
    if (r.ok) { setEmojis(prev=>[d,...prev]); setEmojiName(""); setEmojiFile(null); setMsg("✅ Emoji added"); }
    else setMsg("❌ " + d.error);
    setTimeout(()=>setMsg(""),3000);
  };

  const tabs = [["users","👥 Users"],["rep","⭐ Rep"],["emojis","😀 Emojis"],["leaderboard","🏆 Leaderboard"]];

  if (!isMod) return null;

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"24px 20px"}}>
      <h1 style={{fontSize:22,fontWeight:700,color:"#e8e8e8",marginBottom:6}}>Admin Panel</h1>
      <div style={{fontSize:12,color:"#555",marginBottom:20}}>Role: <span style={{color:"#e74c3c",fontWeight:700}}>{user?.role?.toUpperCase()}</span></div>

      {msg && <div style={{marginBottom:16,padding:"10px 14px",background:"#111",border:"1px solid #222",borderRadius:6,fontSize:13,color:msg.startsWith("✅")?"#27ae60":"#e74c3c"}}>{msg}</div>}

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:24,borderBottom:"1px solid #1a1a1a",paddingBottom:0}}>
        {tabs.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",borderBottom:`2px solid ${tab===k?"#c0392b":"transparent"}`,color:tab===k?"#e8e8e8":"#555",padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="users" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{marginBottom:8}}>
            <label style={{fontSize:12,color:"#555",display:"block",marginBottom:6}}>Target username</label>
            <input value={targetUser} onChange={e=>setTargetUser(e.target.value)} placeholder="Username…" style={{maxWidth:300}} />
          </div>

          <Section title="🔨 Ban / Unban">
            <input value={banReason} onChange={e=>setBanReason(e.target.value)} placeholder="Ban reason…" style={{marginBottom:8}} />
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-sm" style={{background:"#8b0000",color:"#fff"}} onClick={()=>action(`${API}/admin/ban`,{username:targetUser,reason:banReason})}>Ban</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>action(`${API}/admin/unban`,{username:targetUser})}>Unban</button>
            </div>
          </Section>

          <Section title="🔇 Mute / Unmute">
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
              <input type="number" min="1" value={muteHours} onChange={e=>setMuteHours(+e.target.value)} style={{width:80}} />
              <span style={{fontSize:12,color:"#555"}}>hours</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-sm" style={{background:"#555",color:"#fff"}} onClick={()=>action(`${API}/admin/mute`,{username:targetUser,hours:muteHours})}>Mute</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>action(`${API}/admin/unmute`,{username:targetUser})}>Unmute</button>
            </div>
          </Section>

          {isOwner && (
            <>
              <Section title="🎖 Custom Badge">
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={badge} onChange={e=>setBadge(e.target.value)} placeholder="Badge text (emoji ok)" style={{flex:1}} />
                  <input type="color" value={badgeColor} onChange={e=>setBadgeColor(e.target.value)} style={{width:40,padding:0,border:"none"}} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>action(`${API}/admin/set-badge`,{username:targetUser,badge,color:badgeColor})}>Set Badge</button>
              </Section>
              <Section title="🎭 Set Role">
                <div style={{display:"flex",gap:8}}>
                  <select value={role} onChange={e=>setRole(e.target.value)} style={{flex:1}}>
                    {["member","mod","admin","owner"].map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={()=>action(`${API}/admin/set-role`,{username:targetUser,role})}>Set Role</button>
                </div>
              </Section>
            </>
          )}
        </div>
      )}

      {tab==="rep" && (
        <div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,color:"#555",display:"block",marginBottom:6}}>Target username</label>
            <input value={targetUser} onChange={e=>setTargetUser(e.target.value)} placeholder="Username…" style={{maxWidth:300,marginBottom:12}} />
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div>
              <label style={{fontSize:12,color:"#555",display:"block",marginBottom:4}}>Amount</label>
              <input type="number" value={repAmt} onChange={e=>setRepAmt(+e.target.value)} style={{width:100}} />
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:12,color:"#555",display:"block",marginBottom:4}}>Reason</label>
              <input value={repReason} onChange={e=>setRepReason(e.target.value)} placeholder="Reason…" />
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button className="btn btn-primary btn-sm" onClick={()=>action(`${API}/admin/give-rep`,{username:targetUser,amount:repAmt,reason:repReason})}>+Give Rep</button>
            <button className="btn btn-sm" style={{background:"#8b0000",color:"#fff"}} onClick={()=>action(`${API}/admin/remove-rep`,{username:targetUser,amount:repAmt,reason:repReason})}>-Remove Rep</button>
          </div>
        </div>
      )}

      {tab==="emojis" && (
        <div>
          <div className="card" style={{padding:16,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#666",marginBottom:12}}>Add Custom Emoji</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <input value={emojiName} onChange={e=>setEmojiName(e.target.value)} placeholder=":emoji-name:" style={{flex:1}} />
              <input type="file" accept="image/*" onChange={e=>setEmojiFile(e.target.files[0])} style={{flex:1}} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={uploadEmoji}>Upload Emoji</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
            {emojis.map(e=>(
              <div key={e.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 12px",background:"#111",borderRadius:8,border:"1px solid #1a1a1a"}}>
                <img src={e.url} alt={e.name} style={{width:36,height:36,objectFit:"contain"}} />
                <span style={{fontSize:10,color:"#555"}}>{e.name}</span>
                <button onClick={()=>{ fetch(`${API}/emojis/${e.id}`,{method:"DELETE",headers:{Authorization:`Bearer ${localStorage.getItem("root_token")}`}}).then(()=>setEmojis(prev=>prev.filter(x=>x.id!==e.id))); }} style={{fontSize:10,color:"#e74c3c",background:"none",border:"none",cursor:"pointer"}}>remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="leaderboard" && (
        <div>
          {leaderboard.map((u,i)=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid #1a1a1a"}}>
              <span style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:700,color:i<3?"#f39c12":"#333",width:28}}>{i+1}</span>
              {u.avatar_url ? <img src={u.avatar_url} alt="" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover"}} /> : <div className="avatar" style={{width:32,height:32,fontSize:12,background:u.avatar_color||"#c0392b"}}>{u.username[0].toUpperCase()}</div>}
              <div style={{flex:1}}>
                <span style={{fontSize:13,fontWeight:700,color:"#d0d0d0"}}>{u.username}</span>
                {u.custom_badge && <span style={{marginLeft:8,fontSize:10,background:u.custom_badge_color||"#c0392b",color:"#fff",padding:"1px 5px",borderRadius:2,fontWeight:700}}>{u.custom_badge}</span>}
              </div>
              <span style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:700,color:u.rep>0?"#27ae60":u.rep<0?"#e74c3c":"#555"}}>{u.rep>0?"+":""}{u.rep}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:8,padding:"14px 16px"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>{title}</div>
      {children}
    </div>
  );
}
