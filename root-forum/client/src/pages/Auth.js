import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const { login } = useAuth(); const nav = useNavigate();
  const submit = async e => { e.preventDefault(); setLoading(true); setErr(""); try { await login(u,p); nav("/"); } catch(e){ setErr(e.message); } finally { setLoading(false); }};
  return (
    <div style={{maxWidth:380,margin:"80px auto",padding:"0 20px"}}>
      <div style={{fontFamily:"var(--mono)",fontSize:28,fontWeight:700,color:"#e8e8e8",letterSpacing:4,marginBottom:24}}>ROOT<span style={{color:"var(--red)"}}>●</span></div>
      <div className="card" style={{padding:28}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#888",marginBottom:20,textTransform:"uppercase",letterSpacing:.5}}>Login</h2>
        {err && <div className="error-msg" style={{marginBottom:14}}>{err}</div>}
        <form onSubmit={submit}>
          <input value={u} onChange={e=>setU(e.target.value)} placeholder="Username or email" style={{marginBottom:10}} autoFocus />
          <input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Password" style={{marginBottom:16}} />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{width:"100%"}}>{loading?"…":"Login"}</button>
        </form>
        <div style={{marginTop:16,fontSize:13,color:"#444",textAlign:"center"}}>No account? <Link to="/register">Register</Link></div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [u,setU]=useState(""); const [e,setE]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const { register } = useAuth(); const nav = useNavigate();
  const submit = async ev => { ev.preventDefault(); setLoading(true); setErr(""); try { await register(u,e,p); nav("/"); } catch(err){ setErr(err.message); } finally { setLoading(false); }};
  return (
    <div style={{maxWidth:380,margin:"80px auto",padding:"0 20px"}}>
      <div style={{fontFamily:"var(--mono)",fontSize:28,fontWeight:700,color:"#e8e8e8",letterSpacing:4,marginBottom:24}}>ROOT<span style={{color:"var(--red)"}}>●</span></div>
      <div className="card" style={{padding:28}}>
        <h2 style={{fontSize:16,fontWeight:700,color:"#888",marginBottom:20,textTransform:"uppercase",letterSpacing:.5}}>Create Account</h2>
        {err && <div className="error-msg" style={{marginBottom:14}}>{err}</div>}
        <form onSubmit={submit}>
          <input value={u} onChange={e=>setU(e.target.value)} placeholder="Username" style={{marginBottom:10}} autoFocus />
          <input type="email" value={e} onChange={ev=>setE(ev.target.value)} placeholder="Email" style={{marginBottom:10}} />
          <input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Password (min 6)" style={{marginBottom:16}} />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{width:"100%"}}>{loading?"…":"Create Account"}</button>
        </form>
        <div style={{marginTop:16,fontSize:13,color:"#444",textAlign:"center"}}>Have an account? <Link to="/login">Login</Link></div>
      </div>
    </div>
  );
}
