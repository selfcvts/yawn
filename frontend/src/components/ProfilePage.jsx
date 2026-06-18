import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";
import { ImageEditor } from "./ImageEditor";
import { EMOJI_GG_REACTIONS, getEmojiUrl } from "../utils/emojis";

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
  image: "M4 16l4-4 4 4 6-6 4 4M4 4h16v16H4z",
  video: "M15 10l5-3v12l-5-3M5 6h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  close: "M6 6l12 12M18 6L6 18",
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
  const [imageUrl, setImageUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const pictureInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const musicInputRef = useRef(null);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(`${API}/upload/image`, formData);
      setEditingImage(data.url);
      showToast("Image uploaded - now resize/position it");
    } catch (error) {
      showToast("Failed to upload image", "error");
    }
    setUploading(false);
  };

  const handleImageSave = async (editedDataUrl) => {
    try {
      setUploading(true);
      const response = await fetch(editedDataUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append("file", blob, "edited-image.png");
      
      const { data } = await axios.post(`${API}/upload/image`, formData);
      setImageUrl(data.url);
      setEditingImage(null);
      showToast("Image edited successfully");
    } catch (error) {
      showToast("Failed to save edited image", "error");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast("Video must be less than 20MB", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(`${API}/upload/video`, formData);
      setVideoUrl(data.url);
      showToast("Video uploaded");
    } catch (error) {
      showToast("Failed to upload video", "error");
    }
    setUploading(false);
  };

  const handlePostSubmit = async () => {
    if (!currentUser) {
      showToast("You must be logged in to post", "error");
      return;
    }
    
    if (!postBody.trim() && !imageUrl && !videoUrl) {
      showToast("Post cannot be empty", "error");
      return;
    }

    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("author", currentUser.username);
      formData.append("body", postBody.trim() || " ");
      if (richContent) {
        formData.append("rich_content", JSON.stringify(richContent));
      }
      if (imageUrl) {
        formData.append("image_url", imageUrl);
      }
      if (videoUrl) {
        formData.append("video_url", videoUrl);
      }

      await axios.post(`${API}/users/${username}/profile-posts`, formData);
      setPostBody("");
      setRichContent(null);
      setImageUrl(null);
      setVideoUrl(null);
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

  const handleReaction = async (postId, emojiName) => {
    if (!currentUser) {
      showToast("You must be logged in to react", "error");
      return;
    }

    try {
      await axios.post(`${API}/profile-posts/${postId}/react`, {
        emoji_name: emojiName,
        username: currentUser.username
      });
      loadProfile();
    } catch (error) {
      showToast("Could not add reaction", "error");
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API}/users/${username}/upload-picture`, formData);
      showToast("Profile picture updated");
      loadProfile();
    } catch (error) {
      showToast("Failed to upload picture", "error");
    }
    setUploading(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API}/users/${username}/upload-banner`, formData);
      showToast("Banner updated");
      loadProfile();
    } catch (error) {
      showToast("Failed to upload banner", "error");
    }
    setUploading(false);
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("Audio must be less than 10MB", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API}/users/${username}/upload-music`, formData);
      showToast("Profile music updated");
      loadProfile();
    } catch (error) {
      showToast("Failed to upload music", "error");
    }
    setUploading(false);
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

      {/* Profile Banner */}
      {user.profile_banner && (
        <div style={{ marginTop: 20, height: 200, borderRadius: 4, overflow: "hidden", border: "1px solid #2e2722" }}>
          <img src={user.profile_banner} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* Profile Header */}
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
            <div style={{ background: "#2e2722", border: "1px solid #3a3530", borderRadius: 4, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  ref={pictureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => pictureInputRef.current?.click()}
                  disabled={uploading}
                  style={{ ...mediaBtn, fontSize: 11 }}
                >
                  Upload Picture
                </button>

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploading}
                  style={{ ...mediaBtn, fontSize: 11 }}
                >
                  Upload Banner
                </button>

                <input
                  ref={musicInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleMusicUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => musicInputRef.current?.click()}
                  disabled={uploading}
                  style={{ ...mediaBtn, fontSize: 11 }}
                >
                  Upload Music
                </button>
              </div>
            </div>
          )}

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
                <div style={{ display: "flex", gap: 12 }}>
                  <Avatar name={currentUser.username} size={40} imageUrl={currentUser.profile_picture} />
                  <div style={{ flex: 1 }}>
                    <RichTextEditor
                      value={postBody}
                      onChange={setPostBody}
                      onRichContentChange={setRichContent}
                      placeholder="Write something..."
                    />
                    
                    {/* Media Previews */}
                    {imageUrl && (
                      <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
                        <img src={imageUrl} alt="Upload preview" style={{ maxWidth: 300, maxHeight: 200, borderRadius: 4, border: "1px solid #2e2722" }} />
                        <button
                          onClick={() => setImageUrl(null)}
                          style={{ position: "absolute", top: 4, right: 4, background: "#171411", border: "1px solid #2e2722", borderRadius: 3, padding: 4, cursor: "pointer" }}
                        >
                          <Icon name="close" size={12} style={{ color: "#e2725a" }} />
                        </button>
                      </div>
                    )}
                    
                    {videoUrl && (
                      <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
                        <video src={videoUrl} controls style={{ maxWidth: 300, maxHeight: 200, borderRadius: 4, border: "1px solid #2e2722" }} />
                        <button
                          onClick={() => setVideoUrl(null)}
                          style={{ position: "absolute", top: 4, right: 4, background: "#171411", border: "1px solid #2e2722", borderRadius: 3, padding: 4, cursor: "pointer" }}
                        >
                          <Icon name="close" size={12} style={{ color: "#e2725a" }} />
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          style={mediaBtn}
                          title="Upload image"
                        >
                          <Icon name="image" size={16} />
                        </button>

                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploading}
                          style={mediaBtn}
                          title="Upload video"
                        >
                          <Icon name="video" size={16} />
                        </button>
                      </div>

                      <button
                        onClick={handlePostSubmit}
                        disabled={posting || uploading}
                        style={{ ...primaryBtn, opacity: (posting || uploading) ? 0.6 : 1 }}
                      >
                        {uploading ? "Uploading..." : posting ? "Posting..." : "Post"}
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
                  onReact={(emojiName) => handleReaction(post.id, emojiName)}
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

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage}
          onSave={handleImageSave}
          onCancel={() => setEditingImage(null)}
        />
      )}
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

function ProfilePostItem({ post, currentUser, profileOwner, onDelete, onReact }) {
  const [hover, setHover] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const canDelete = currentUser && (
    currentUser.username === post.author || 
    currentUser.username === profileOwner ||
    ["admin", "owner"].includes(currentUser.role)
  );

  const reactions = post.reactions || {};
  const totalReactions = Object.values(reactions).reduce((sum, users) => sum + users.length, 0);
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'pepe', label: 'Pepe' },
    { id: 'twitch', label: 'Twitch' },
    { id: 'reactions', label: 'Memes' },
    { id: 'positive', label: '+' },
    { id: 'negative', label: '-' },
  ];
  
  const displayEmojis = activeCategory === 'all' 
    ? EMOJI_GG_REACTIONS 
    : EMOJI_GG_REACTIONS.filter(e => {
        if (activeCategory === 'pepe') return e.name.includes('pepe');
        if (activeCategory === 'twitch') return ['pog', 'kek', 'lul', 'kappa', 'monka', 'sadge', 'peped'].some(t => e.name.includes(t));
        if (activeCategory === 'reactions') return ['chad', 'based', 'copium', 'hopium', 'despair', 'aware', 'bruh', 'clown', 'sus', 'simp'].includes(e.name);
        if (activeCategory === 'positive') return ['heart', 'fire', '100', 'star', 'clap', 'thumbsup', 'ok', 'party', 'hype'].some(t => e.name.includes(t));
        if (activeCategory === 'negative') return ['skull', 'rip', 'dead', 'cry', 'angry', 'thumbsdown', 'ban', 'cringe', 'yikes', 'rage'].includes(e.name);
        return true;
      });

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
          
          <div style={{ color: "#e8d9c0", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 12 }}>
            {post.body}
          </div>

          {/* Image */}
          {post.image_url && (
            <div style={{ marginBottom: 12 }}>
              <img 
                src={post.image_url} 
                alt="Post" 
                style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4, border: "1px solid #2e2722" }} 
              />
            </div>
          )}

          {/* Video */}
          {post.video_url && (
            <div style={{ marginBottom: 12 }}>
              <video 
                src={post.video_url} 
                controls 
                style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4, border: "1px solid #2e2722" }} 
              />
            </div>
          )}

          {/* Reactions Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                style={{
                  background: "#2e2722",
                  border: "1px solid #3a3530",
                  borderRadius: 3,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#a89a85",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "Oswald, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                😊 React {totalReactions > 0 && `(${totalReactions})`}
              </button>

              {showReactions && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: 8,
                  background: "#171411",
                  border: "1px solid #2e2722",
                  borderRadius: 4,
                  padding: 12,
                  zIndex: 100,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
                  minWidth: 320,
                  maxWidth: 400,
                }}>
                  {/* Category Tabs */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, borderBottom: "1px solid #2e2722", paddingBottom: 8 }}>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          background: activeCategory === cat.id ? "#2e2722" : "transparent",
                          border: "none",
                          color: activeCategory === cat.id ? "#c4401f" : "#5a5450",
                          padding: "4px 10px",
                          fontSize: 11,
                          cursor: "pointer",
                          borderRadius: 3,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontFamily: "Oswald, sans-serif",
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Emoji Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: 6,
                    maxHeight: 240,
                    overflowY: "auto",
                    padding: 4,
                  }}>
                    {displayEmojis.map(emoji => (
                      <button
                        key={emoji.name}
                        onClick={() => {
                          onReact(emoji.name);
                          setShowReactions(false);
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid transparent",
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#2e2722";
                          e.currentTarget.style.borderColor = "#3a3530";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor = "transparent";
                        }}
                        title={emoji.name}
                      >
                        <img src={emoji.url} alt={emoji.name} style={{ width: 28, height: 28 }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Display existing reactions */}
            {Object.keys(reactions).length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(reactions).map(([emojiName, users]) => {
                  if (users.length === 0) return null;
                  const emojiUrl = getEmojiUrl(emojiName);
                  const hasReacted = currentUser && users.includes(currentUser.username);
                  
                  return (
                    <button
                      key={emojiName}
                      onClick={() => onReact(emojiName)}
                      style={{
                        background: hasReacted ? "#2e2722" : "#1c1814",
                        border: `1px solid ${hasReacted ? "#c4401f" : "#2e2722"}`,
                        borderRadius: 3,
                        padding: "5px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#e8d9c0",
                        fontFamily: "Oswald, sans-serif",
                        fontWeight: 600,
                      }}
                      title={users.join(", ")}
                    >
                      {emojiUrl && <img src={emojiUrl} alt={emojiName} style={{ width: 18, height: 18 }} />}
                      <span>{users.length}</span>
                    </button>
                  );
                })}
              </div>
            )}
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

const mediaBtn = {
  background: "#2e2722",
  border: "1px solid #3a3530",
  borderRadius: 3,
  padding: "6px 10px",
  cursor: "pointer",
  color: "#a89a85",
  display: "flex",
  alignItems: "center",
  gap: 4,
};
