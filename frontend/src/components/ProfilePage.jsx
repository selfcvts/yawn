import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  arrow: "M5 12h14M13 6l6 6-6 6",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6",
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

export function ProfilePage({ username, currentUser, onBack, showToast }) {
  const [user, setUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile_posts");
  const [postBody, setPostBody] = useState("");
  const [richContent, setRichContent] = useState(null);
  const [posting, setPosting] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { data: userData } = await axios.get(`${API}/users/${username}`);
      setUser(userData);
      
      const { data: posts } = await axios.get(`${API}/users/${username}/profile-posts`);
      setProfilePosts(posts);
      setLoading(false);
    } catch (error) {
      showToast("Could not load profile", "error");
      setLoading(false);
    }
  }, [username, showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handlePostSubmit = async () => {
    if (!currentUser) {
      showToast("You must be logged in to post", "error");
      return;
    }
    
    if (!postBody.trim()) {
      showToast("Post cannot be empty", "error");
      return;
    }

    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("author", currentUser.username);
      formData.append("body", postBody.trim());
      if (richContent) {
        formData.append("rich_content", JSON.stringify(richContent));
      }

      await axios.post(`${API}/users/${username}/profile-posts`, formData);
      setPostBody("");
      setRichContent(null);
      showToast("Posted to profile");
      loadProfile();
    } catch (error) {
      showToast(error.response?.data?.detail || "Could not post", "error");
    }
    setPosting(false);
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) return;
    
    try {
      const formData = new FormData();
      formData.append("username", currentUser.username);
      await axios.delete(`${API}/profile-posts/${postId}`, { data: formData });
      showToast("Post deleted");
      loadProfile();
    } catch (error) {
      showToast(error.response?.data?.detail || "Could not delete post", "error");
    }
  };

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

      {/* Profile Header */}
      <div style={{ display: "flex", gap: 24, marginTop: 24, padding: "24px 0", borderBottom: "1px solid #1c1814" }}>
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
          </div>

          <div style={{ color: "#7a7066", fontSize: 13, marginBottom: 16 }}>
            <div>Joined: {new Date(user.joined_at).toLocaleDateString()}</div>
            {user.bio && <div style={{ marginTop: 4 }}>{user.bio}</div>}
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 16 }}>
            <StatBox label="Posts" value={user.posts} />
            <StatBox label="Reputation" value={user.rep} highlight />
            <StatBox label="Streak" value={`${user.streak}d`} />
            <StatBox label="Points" value={user.rep} />
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content Area */}
      <div style={{ marginTop: 24 }}>
        {activeTab === "profile_posts" && (
          <>
            {/* Post Box */}
            {currentUser && (
              <div style={cardStyle}>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <Avatar name={currentUser.username} size={40} imageUrl={currentUser.profile_picture} />
                  <div style={{ flex: 1 }}>
                    <RichTextEditor
                      value={postBody}
                      onChange={setPostBody}
                      onRichContentChange={setRichContent}
                      placeholder="Write something..."
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        onClick={handlePostSubmit}
                        disabled={posting}
                        style={{ ...primaryBtn, opacity: posting ? 0.6 : 1 }}
                      >
                        {posting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Posts */}
            {profilePosts.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#5a5450", fontSize: 14 }}>
                No profile posts yet
              </div>
            ) : (
              profilePosts.map((post) => (
                <ProfilePostItem
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  profileOwner={user.username}
                  onDelete={() => handleDeletePost(post.id)}
                />
              ))
            )}
          </>
        )}

        {activeTab === "activity" && (
          <div style={{ padding: 40, textAlign: "center", color: "#5a5450" }}>
            Activity view - Coming soon
          </div>
        )}

        {activeTab === "about" && (
          <div style={cardStyle}>
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

function StatBox({ label, value, highlight = false }) {
  return (
    <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 20, fontWeight: 600, color: highlight ? "#c4401f" : "#e8d9c0" }}>
        {value}
      </div>
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

function ProfilePostItem({ post, currentUser, profileOwner, onDelete }) {
  const [hover, setHover] = useState(false);
  const canDelete = currentUser && (
    currentUser.username === post.author || 
    currentUser.username === profileOwner ||
    ["admin", "owner"].includes(currentUser.role)
  );

  return (
    <div
      style={{ ...cardStyle, position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar name={post.author} size={40} />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{post.author}</span>
            <span style={{ color: "#5a5450", fontSize: 12 }}>·</span>
            <span style={{ color: "#5a5450", fontSize: 12 }}>{timeAgo(post.created_at)}</span>
          </div>
          
          <div style={{ color: "#e8d9c0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {post.body}
          </div>
        </div>

        {canDelete && hover && (
          <button
            onClick={onDelete}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "#2e2722",
              border: "1px solid #3a3530",
              borderRadius: 3,
              padding: "6px 8px",
              cursor: "pointer",
              color: "#e2725a",
            }}
            title="Delete"
          >
            <Icon name="trash" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function BackRow({ onBack, label }) {
  return (
    <div onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7a7066", fontSize: 13, cursor: "pointer", marginTop: 20 }}>
      <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} /> {label}
    </div>
  );
}

const cardStyle = {
  background: "#171411",
  border: "1px solid #2e2722",
  borderRadius: 4,
  padding: 18,
  marginBottom: 16,
};

const primaryBtn = {
  background: "#c4401f",
  color: "#0d0c0b",
  border: "none",
  borderRadius: 3,
  padding: "8px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "Oswald, sans-serif",
  letterSpacing: 0.5,
  textTransform: "uppercase",
};
