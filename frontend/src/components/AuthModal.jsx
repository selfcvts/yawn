import { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ICONS = {
  close: "M6 6l12 12M18 6L6 18",
  lock: "M6 11V8a6 6 0 0112 0v3M5 11h14v9H5z",
};

function Icon({ name, size = 16, style = {} }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

export function AuthModal({ onClose, onLogin, showToast }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    const uname = username.trim();
    if (!uname || !password) { setErr("Username and password required."); return; }
    if (mode === "signup" && (uname.length < 3 || uname.length > 20 || !/^[a-zA-Z0-9_]+$/.test(uname))) {
      setErr("Username must be 3-20 chars: letters, numbers, underscore."); return;
    }
    if (mode === "signup" && password.length < 6) { setErr("Password must be at least 6 characters."); return; }

    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const { data } = await axios.post(`${API}${endpoint}`, { username: uname, password });
      showToast(mode === "signup" ? `Welcome, ${uname}.` : `Welcome back, ${uname}.`);
      onLogin(data);
    } catch (error) {
      setErr(error.response?.data?.detail || "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div
      data-testid=\"auth-modal\"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 5, padding: 28, width: 360, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#5a5450", cursor: "pointer" }}>
          <Icon name="close" size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="lock" size={16} style={{ color: "#c4401f" }} />
          <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 600 }}>{mode === "login" ? "sign in" : "create account"}</span>
        </div>
        <p style={{ color: "#5a5450", fontSize: 12.5, marginTop: 4, marginBottom: 20 }}>
          Join the looksmax community forum.
        </p>

        <label style={labelStyle}>username</label>
        <input 
          data-testid=\"auth-username\"
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          style={inputStyle} 
          onKeyDown={(e) => e.key === "Enter" && submit()} 
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>password</label>
        <input 
          data-testid=\"auth-password\"
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={inputStyle} 
          onKeyDown={(e) => e.key === "Enter" && submit()} 
        />

        {err && <div style={{ color: "#e2725a", fontSize: 12.5, marginTop: 10 }}>{err}</div>}

        <button 
          data-testid=\"auth-submit\"
          onClick={submit} 
          disabled={busy} 
          style={{ ...primaryBtn, width: "100%", marginTop: 18, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "..." : mode === "login" ? "sign in" : "create account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#5a5450" }}>
          {mode === "login" ? (
            <>no account? <span onClick={() => { setMode("signup"); setErr(""); }} style={{ color: "#c4401f", cursor: "pointer" }}>sign up</span></>
          ) : (
            <>have an account? <span onClick={() => { setMode("login"); setErr(""); }} style={{ color: "#c4401f", cursor: "pointer" }}>sign in</span></>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, color: "#5a5450", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 };
const inputStyle = { width: "100%", background: "#0d0c0b", border: "1px solid #2e2722", borderRadius: 3, padding: "10px 12px", color: "#e8d9c0", fontSize: 14, outline: "none" };
const primaryBtn = {
  background: "#c4401f", color: "#0d0c0b", border: "none", borderRadius: 3,
  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "Oswald, sans-serif", letterSpacing: 0.5, textTransform: "uppercase",
};
