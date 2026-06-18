import { useState, useEffect } from "react";
import { useProfileData } from "../hooks/useProfileData";
import { ProfileStats } from "./ProfileStats";
import { ProfileCustomize } from "./ProfileCustomize";
import ProfilePostsList from "./ProfilePostsList";

const ICONS = {
  arrow: "M5 12h14M13 6l6 6-6 6",
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
        width: size,
        height: size,
        borderRadius: 3,
        flexShrink: 0,
        background: `hsl(${h}, 35%, 18%)`,
        border: "1px solid #2e2722",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Oswald, sans-serif",
        fontWeight: 500,
        fontSize: size * 0.45,
        color: `hsl(${h}, 45%, 70%)`,
        letterSpacing: 0.5,
      }}
    >
      {initial}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid #c4401f" : "2px solid transparent",
        color: active ? "#e8d9c0" : "#5a5450",
        padding: "12px 4px",
        fontSize: 14,
        fontFamily: "Oswald, sans-serif",
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </button>
  );
}

function BackRow({ onBack, label }) {
  return (
    <div onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7a7066", fontSize: 13, cursor: "pointer", marginTop: 20 }}>
      <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} /> {label}
    </div>
  );
}

export function ProfilePageSimple({ username, currentUser, onBack, showToast }) {
  const { user, profilePosts, loading, loadProfile } = useProfileData(username);
  const [activeTab, setActiveTab] = useState("profile_posts");
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    loadProfile().catch((error) => {
      showToast("Could not load profile", "error");
    });
  }, [loadProfile, showToast]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#5a5450", fontSize: 13 }}>
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#7a7066" }}>
        User not found
      </div>
    );
  }

  return (
    <div data-testid="profile-page">
      <BackRow onBack={onBack} label="back" />

      {user.profile_banner && (
        <div style={{ marginTop: 20, height: 200, borderRadius: 4, overflow: "hidden", border: "1px solid #2e2722" }}>
          <img src={user.profile_banner} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <div style={{ display: "flex", gap: 24, marginTop: user.profile_banner ? -60 : 24, padding: "24px 0", borderBottom: "1px solid #1c1814", position: "relative" }}>
        <Avatar name={user.username} size={140} imageUrl={user.profile_picture} />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 32, margin: 0 }}>
              {user.username}
            </h1>
            {user.custom_badge && (
              <span style={{ fontSize: 14, padding: "4px 10px", background: "#2e2722", borderRadius: 3, color: "#e8d9c0" }}>
                {user.custom_badge}
              </span>
            )}
            {currentUser && currentUser.username === username && (
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                style={{
                  background: "#2e2722",
                  border: "1px solid #3a3530",
                  borderRadius: 3,
                  padding: "6px 12px",
                  fontSize: 12,
                  color: "#a89a85",
                  cursor: "pointer",
                  fontFamily: "Oswald, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Customize
              </button>
            )}
          </div>

          {showCustomize && currentUser && currentUser.username === username && (
            <ProfileCustomize username={username} onUpdate={loadProfile} showToast={showToast} />
          )}

          <div style={{ color: "#7a7066", fontSize: 13, marginBottom: 16 }}>
            <div>Joined: {new Date(user.joined_at).toLocaleDateString()}</div>
            {user.bio && <div style={{ marginTop: 4 }}>{user.bio}</div>}
          </div>

          <ProfileStats user={user} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 24, borderBottom: "1px solid #1c1814" }}>
        <Tab 
          label="Profile posts" 
          active={activeTab === "profile_posts"} 
          onClick={() => setActiveTab("profile_posts")} 
        />
        <Tab 
          label="Latest activity" 
          active={activeTab === "activity"} 
          onClick={() => setActiveTab("activity")} 
        />
        <Tab 
          label="About" 
          active={activeTab === "about"} 
          onClick={() => setActiveTab("about")} 
        />
      </div>

      <div style={{ marginTop: 24 }}>
        {activeTab === "profile_posts" && (
          <ProfilePostsList 
            username={username}
            currentUser={currentUser}
            profilePosts={profilePosts}
            onUpdate={loadProfile}
            showToast={showToast}
          />
        )}
        
        {activeTab === "activity" && (
          <div style={{ padding: 40, textAlign: "center", color: "#5a5450" }}>
            Activity view - Coming soon
          </div>
        )}
        
        {activeTab === "about" && (
          <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 18 }}>
            <h3 style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, marginTop: 0 }}>About</h3>
            <div style={{ color: "#a89a85", lineHeight: 1.6 }}>
              {user.bio || "No bio provided"}
            </div>
            {user.profile_music && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "#5a5450", marginBottom: 8, textTransform: "uppercase" }}>Profile Music</div>
                <audio controls style={{ width: "100%" }}>
                  <source src={user.profile_music} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
