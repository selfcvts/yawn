import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "@/App.css";
import { CategoryPage } from "./components/ForumComponents";
import { AuthModal } from "./components/AuthModal";
import { ProfilePage } from "./components/ProfilePage";
import { useAuth } from "./hooks/useAuth";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============================================================
// HELPER FUNCTIONS & CONSTANTS
// ============================================================

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const ICONS = {
  flame: "M12 2c.5 3-2 5-3.5 7C7 11 6 13 6 15a6 6 0 0012 0c0-2-1-3.5-2-5 .5 1.5 0 3-1 3.5.5-2-.5-4-2-5.5C13.5 6.5 13 4 12 2z",
  star: "M12 2l2 6 6 2-5 4 1 6-6-3-6 3 1-6-5-4 6-2z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  arrow: "M5 12h14M13 6l6 6-6 6",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
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

function Avatar({ name, size = 32, imageUrl = null }) {
  if (imageUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: 3, overflow: "hidden", border: "1px solid #2e2722", flexShrink: 0 }}>
        <img src={imageUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  
  const initial = (name || "?").charAt(0).toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 3, flexShrink: 0,
        background: `hsl(${h}, 35%, 18%)`, border: "1px solid #2e2722",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Oswald, sans-serif", fontWeight: 500, fontSize: size * 0.45,
        color: `hsl(${h}, 45%, 70%)`, letterSpacing: 0.5,
      }}
    >
      {initial}
    </div>
  );
}

// ============================================================
// TOAST NOTIFICATION HOOK
// ============================================================

function useToast() {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, kind = "default") => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

// ============================================================
// MAIN APP COMPONENT
// ============================================================

export default function App() {
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState({ page: "home" });
  const [authOpen, setAuthOpen] = useState(false);
  
  const { user, login, logout, refreshUser, restoreSession } = useAuth();
  const { toast, showToast } = useToast();

  // Initialize app on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const { data } = await axios.get(`${API}/categories`);
        setCategories(data || []);
        await restoreSession();
        setBooted(true);
      } catch (error) {
        setBootError(error.message || "Could not reach the backend.");
        setBooted(true);
      }
    };
    
    initApp();
  }, [restoreSession]);

  const handleLogin = useCallback((userData) => {
    login(userData);
    setAuthOpen(false);
  }, [login]);

  const handleLogout = useCallback(() => {
    logout();
    showToast("Signed out.");
    setView({ page: "home" });
  }, [logout, showToast]);

  if (!booted) {
    return <LoadingScreen />;
  }

  if (bootError) {
    return <ErrorScreen error={bootError} />;
  }

  return (
    <div style={rootStyle}>
      <FontLoader />
      <Header
        user={user}
        onAuthOpen={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onHome={() => setView({ page: "home" })}
        onProfile={() => user && setView({ page: "profile", username: user.username })}
      />
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "0 20px 80px" }}>
        {view.page === "home" && (
          <Home categories={categories} onOpenCategory={(id) => setView({ page: "category", categoryId: id })} />
        )}
        {view.page === "category" && (
          <CategoryPage
            categories={categories}
            categoryId={view.categoryId}
            user={user}
            onBack={() => setView({ page: "home" })}
            onOpenThread={(id) => setView({ page: "thread", threadId: id, categoryId: view.categoryId })}
            requireAuth={() => setAuthOpen(true)}
            showToast={showToast}
          />
        )}
        {view.page === "thread" && <PlaceholderPage title="Thread page - Coming soon" />}
        {view.page === "profile" && (
          <ProfilePage
            username={view.username}
            currentUser={user}
            onBack={() => setView({ page: "home" })}
            showToast={showToast}
          />
        )}
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={handleLogin} showToast={showToast} />}
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

const rootStyle = {
  background: "#0d0c0b",
  color: "#e8d9c0",
  minHeight: "100vh",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  position: "relative",
};

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      input, textarea, button { font-family: Inter, sans-serif; }
      ::selection { background: #c4401f; color: #0d0c0b; }
      ::placeholder { color: #5a5450; }
      a { color: #c4401f; text-decoration: none; }
    `}</style>
  );
}

function LoadingScreen() {
  return (
    <div style={rootStyle}>
      <FontLoader />
      <div style={{ padding: 60, textAlign: "center", color: "#5a5450", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
        loading forum...
      </div>
    </div>
  );
}

function ErrorScreen({ error }) {
  return (
    <div style={rootStyle}>
      <FontLoader />
      <div style={{ maxWidth: 520, margin: "80px auto", padding: 24, border: "1px solid #3a2218", borderRadius: 4, background: "#171411" }}>
        <h2 style={{ fontFamily: "Oswald, sans-serif", color: "#c4401f", marginTop: 0 }}>Can't reach the backend</h2>
        <p style={{ color: "#a89a85", fontSize: 14, lineHeight: 1.6 }}>{error}</p>
      </div>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#7a7066" }}>
      {title}
    </div>
  );
}

function Toast({ msg, kind }) {
  return (
    <div
      data-testid="toast-message"
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: "#171411", border: `1px solid ${kind === "error" ? "#7a2412" : "#2e2722"}`,
        borderLeft: `3px solid ${kind === "error" ? "#c4401f" : "#9c8a6f"}`,
        color: "#e8d9c0", padding: "10px 18px", borderRadius: 3, fontSize: 13,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 1000, maxWidth: 360,
      }}
    >
      {msg}
    </div>
  );
}

function Header({ user, onAuthOpen, onLogout, onHome, onProfile }) {
  return (
    <header style={{ borderBottom: "1px solid #241f1a", background: "linear-gradient(180deg, #131110, #0d0c0b)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={onHome} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: 1, color: "#e8d9c0" }}>LOOKSMAX</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#5a5450", letterSpacing: 0.5 }}>community forum</span>
        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={onProfile} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={user.username} size={26} imageUrl={user.profile_picture} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{user.username}</span>
              {user.custom_badge && <span style={{ fontSize: 10, marginLeft: 4 }}>{user.custom_badge}</span>}
            </div>
            <button data-testid="logout-button" onClick={onLogout} style={ghostBtn}>sign out</button>
          </div>
        ) : (
          <button data-testid="login-button" onClick={onAuthOpen} style={primaryBtn}>enter</button>
        )}
      </div>
    </header>
  );
}

const primaryBtn = {
  background: "#c4401f", color: "#0d0c0b", border: "none", borderRadius: 3,
  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "Oswald, sans-serif", letterSpacing: 0.5, textTransform: "uppercase",
};
const ghostBtn = {
  background: "transparent", color: "#a89a85", border: "1px solid #2e2722", borderRadius: 3,
  padding: "7px 14px", fontSize: 12, cursor: "pointer",
};

function Home({ categories, onOpenCategory }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const fetchCounts = async () => {
      const countMap = {};
      for (const cat of categories) {
        try {
          const { data } = await axios.get(`${API}/categories/${cat.id}/thread-count`);
          countMap[cat.id] = data.count;
        } catch (error) {
          countMap[cat.id] = 0;
        }
      }
      setCounts(countMap);
    };
    
    if (categories.length > 0) {
      fetchCounts();
    }
  }, [categories]);

  return (
    <div data-testid="home-page">
      <HeroSection />
      <CategoriesList categories={categories} counts={counts} onOpenCategory={onOpenCategory} />
    </div>
  );
}

function HeroSection() {
  return (
    <div style={{ padding: "48px 0 36px", borderBottom: "1px solid #1c1814" }}>
      <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 38, margin: 0, letterSpacing: 0.5, lineHeight: 1.1 }}>
        Welcome to Looksmax Community
      </h1>
      <p style={{ color: "#7a7066", fontSize: 15, marginTop: 10, maxWidth: 540, lineHeight: 1.6 }}>
        Your go-to forum for looksmaxxing discussion, ratings, and community support.
      </p>
    </div>
  );
}

function CategoriesList({ categories, counts, onOpenCategory }) {
  return (
    <div style={{ marginTop: 28 }}>
      {categories.map((cat) => (
        <CategoryRow 
          key={cat.id} 
          category={cat} 
          count={counts[cat.id] ?? 0} 
          onClick={() => onOpenCategory(cat.id)} 
        />
      ))}
    </div>
  );
}

function CategoryRow({ category, count, onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <div
      onClick={onClick}
      data-testid={`category-${category.id}`}
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 16, 
        padding: "18px 4px", 
        borderBottom: "1px solid #1c1814", 
        cursor: "pointer",
        background: hover ? "#13110f" : "transparent"
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ width: 38, height: 38, borderRadius: 3, background: "#171411", border: "1px solid #2e2722", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={category.icon} size={18} style={{ color: "#c4401f" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 500, fontSize: 17, letterSpacing: 0.3 }}>{category.name}</div>
        <div style={{ color: "#5a5450", fontSize: 13, marginTop: 2 }}>{category.description}</div>
      </div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#5a5450", textAlign: "right", minWidth: 60 }}>
        {count} threads
      </div>
      <Icon name="arrow" size={16} style={{ color: "#3a3530" }} />
    </div>
  );
}
