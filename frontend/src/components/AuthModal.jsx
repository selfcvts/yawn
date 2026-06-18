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

// Validation helpers
const validateUsername = (username) => {
  if (username.length < 3 || username.length > 20) {
    return "Username must be 3-20 characters";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username: letters, numbers, underscore only";
  }
  return null;
};

const validatePassword = (password, isSignup) => {
  if (isSignup && password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

// Login/Signup form component
function AuthForm({ mode, onSubmit, busy, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    onSubmit(username.trim(), password);
  };

  return (
    <>
      <label style={labelStyle}>username</label>
      <input 
        data-testid="auth-username"
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
        style={inputStyle} 
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()} 
        autoFocus
      />

      <label style={{ ...labelStyle, marginTop: 12 }}>password</label>
      <input 
        data-testid="auth-password"
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        style={inputStyle} 
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()} 
      />

      {error && <div style={{ color: "#e2725a", fontSize: 12.5, marginTop: 10 }}>{error}</div>}

      <button 
        data-testid="auth-submit"
        onClick={handleSubmit} 
        disabled={busy} 
        style={{ ...primaryBtn, width: "100%", marginTop: 18, opacity: busy ? 0.6 : 1 }}
      >
        {busy ? "..." : mode === "login" ? "sign in" : "create account"}
      </button>
    </>
  );
}

export function AuthModal({ onClose, onLogin, showToast }) {
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (username, password) => {
    setErr("");
    
    if (!username || !password) {
      setErr("Username and password required");
      return;
    }

    // Validate based on mode
    if (mode === "signup") {
      const usernameError = validateUsername(username);
      if (usernameError) {
        setErr(usernameError);
        return;
      }
      
      const passwordError = validatePassword(password, true);
      if (passwordError) {
        setErr(passwordError);
        return;
      }
    }

    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const { data } = await axios.post(`${API}${endpoint}`, { username, password });
      showToast(mode === "signup" ? `Welcome, ${username}.` : `Welcome back, ${username}.`);
      onLogin(data);
    } catch (error) {
      setErr(error.response?.data?.detail || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setErr("");
  };

  return (
    <div
      data-testid="auth-modal"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 5, padding: 28, width: 360, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#5a5450", cursor: "pointer" }}>
          <Icon name="close" size={18} />
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="lock" size={16} style={{ color: "#c4401f" }} />
          <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 600 }}>
            {mode === "login" ? "sign in" : "create account"}
          </span>
        </div>
        
        <p style={{ color: "#5a5450", fontSize: 12.5, marginTop: 4, marginBottom: 20 }}>
          Join the looksmax community forum.
        </p>

        <AuthForm mode={mode} onSubmit={handleSubmit} busy={busy} error={err} />

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#5a5450" }}>
          {mode === "login" ? (
            <>no account? <span onClick={switchMode} style={{ color: "#c4401f", cursor: "pointer" }}>sign up</span></>
          ) : (
            <>have an account? <span onClick={switchMode} style={{ color: "#c4401f", cursor: "pointer" }}>sign in</span></>
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
