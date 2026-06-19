import { createContext, useContext, useState, useEffect } from "react";
export const API = "/api";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("root_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => setLoading(false));
    } else setLoading(false);
  }, [token]);

  const login = async (u, p) => {
    const r = await fetch(`${API}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({username:u,password:p}) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    localStorage.setItem("root_token", data.token);
    setToken(data.token); setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const r = await fetch(`${API}/auth/register`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({username,email,password}) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    localStorage.setItem("root_token", data.token);
    setToken(data.token); setUser(data.user);
    return data;
  };

  const logout = () => { localStorage.removeItem("root_token"); setToken(null); setUser(null); };

  const refreshUser = async () => {
    if (!token) return;
    const r = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setUser(await r.json());
  };

  const authFetch = (url, opts={}) => fetch(url, { ...opts, headers: { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}), ...(opts.headers||{}) } });

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
