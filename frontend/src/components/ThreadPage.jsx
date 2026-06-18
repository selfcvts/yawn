import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";
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
  image: "M4 16l4-4 4 4 6-6 4 4M4 4h16v16H4z",
  video: "M15 10l5-3v12l-5-3M5 6h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  close: "M6 6l12 12M18 6L6 18",
  fire: "M12 2c.5 3-2 5-3.5 7C7 11 6 13 6 15a6 6 0 0012 0c0-2-1-3.5-2-5 .5 1.5 0 3-1 3.5.5-2-.5-4-2-5.5C13.5 6.5 13 4 12 2z",
  skull: "M12 4a7 7 0 00-7 7c0 2 1 3.5 2 4.5v1.5h10v-1.5c1-1 2-2.5 2-4.5a7 7 0 00-7-7z",
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

function Avatar({ name, size = 32, imageUrl = null, onClick }) {
  if (imageUrl) {
    return (
      <div onClick={onClick} style={{ width: size, height: size, borderRadius: 3, overflow: "hidden", border: "1px solid #2e2722", flexShrink: 0, cursor: onClick ? "pointer" : "default" }}>
        <img src={imageUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  
  const initial = (name || "?").charAt(0).toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {initial}
    </div>
  );
}

export function ThreadPage({ threadId, categoryId, categories, user, onBack, requireAuth, showToast, onOpenProfile }) {
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [richContent, setRichContent] = useState(null);
  const [replying, setReplying] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const loadThread = useCallback(async () => {
    try {
      const [threadRes, postsRes] = await Promise.all([
        axios.get(`${API}/threads/${threadId}`),
        axios.get(`${API}/threads/${threadId}/posts`)
      ]);
      setThread(threadRes.data);
      setPosts(postsRes.data);
      setLoading(false);
    } catch (error) {
      showToast("Could not load thread", "error");
      setLoading(false);
    }
  }, [threadId, showToast]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleImageUpload = async (e) => {
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
      const { data } = await axios.post(`${API}/upload/image`, formData);
      setImageUrl(data.url);
      showToast("Image uploaded");
    } catch (error) {
      showToast("Failed to upload image", "error");
    }
    setUploading(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

  const handleReplySubmit = async () => {
    if (!user) {
      requireAuth();
      return;
    }

    if (!replyBody.trim() && !imageUrl && !videoUrl) {
      showToast("Reply cannot be empty", "error");
      return;
    }

    setReplying(true);
    try {
      const formData = new FormData();
      formData.append("thread_id", threadId);
      formData.append("author", user.username);
      formData.append("body", replyBody.trim() || " ");
      if (richContent) {
        formData.append("rich_content", JSON.stringify(richContent));
      }
      if (imageUrl) {
        formData.append("image_url", imageUrl);
      }
      if (videoUrl) {
        formData.append("video_url", videoUrl);
      }

      await axios.post(`${API}/posts`, formData);
      setReplyBody("");
      setRichContent(null);
      setImageUrl(null);
      setVideoUrl(null);
      showToast("Reply posted");
      loadThread();
    } catch (error) {
      showToast(error.response?.data?.detail || "Could not post reply", "error");
    }
    setReplying(false);
  };

  const handleVote = async (postId, direction) => {
    if (!user) {
      requireAuth();
      return;
    }

    try {
      const formData = new FormData();
      formData.append("post_id", postId);
      formData.append("username", user.username);
      formData.append("direction", direction);

      await axios.post(`${API}/votes`, formData);
      loadThread();
    } catch (error) {
      showToast(error.response?.data?.detail || "Could not vote", "error");
    }
  };

  const handleReaction = async (postId, emojiName) => {
    if (!user) {
      requireAuth();
      return;
    }

    try {
      await axios.post(`${API}/posts/${postId}/react`, {
        emoji_name: emojiName,
        username: user.username
      });
      loadThread();
    } catch (error) {
      showToast("Could not add reaction", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#5a5450" }}>
        Loading thread...
      </div>
    );
  }

  if (!thread) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#7a7066" }}>
        Thread not found
      </div>
    );
  }

  const category = categories.find(c => c.id === categoryId);

  return (
    <div data-testid="thread-page">
      <BackRow onBack={onBack} label={category?.name || "back"} />

      {/* Thread Title */}
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 32, margin: 0, lineHeight: 1.2 }}>
          {thread.title}
        </h1>
        <div style={{ color: "#5a5450", fontSize: 13, marginTop: 8 }}>
          Started by {thread.author} · {timeAgo(thread.created_at)}
        </div>
      </div>

      {/* Posts */}
      {posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          isOP={post.is_op}
          index={index + 1}
          user={user}
          onVote={handleVote}
          onReact={handleReaction}
          onOpenProfile={onOpenProfile}
        />
      ))}

      {/* Reply Box */}
      {user && (
        <div style={{ ...cardStyle, marginTop: 24 }}>
          <h3 style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginTop: 0, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Post Reply
          </h3>
          <RichTextEditor
            value={replyBody}
            onChange={setReplyBody}
            onRichContentChange={setRichContent}
            placeholder="Write your reply..."
          />

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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
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
              onClick={handleReplySubmit}
              disabled={replying || uploading}
              style={{ ...primaryBtn, opacity: (replying || uploading) ? 0.6 : 1 }}
            >
              {uploading ? "Uploading..." : replying ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostItem({ post, isOP, index, user, onVote, onReact, onOpenProfile }) {
  const [showReactions, setShowReactions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

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

  const canMegaRep = user && (user.role === "admin" || user.role === "owner" || !user.last_mega_rep);
  const canMegaDislike = user && (user.role === "admin" || user.role === "owner" || !user.last_mega_dislike);

  return (
    <div style={{ ...postCardStyle, borderLeft: isOP ? "3px solid #c4401f" : "3px solid #2e2722" }}>
      <div style={{ display: "flex", gap: 16 }}>
        {/* Left Sidebar */}
        <div style={{ width: 140, flexShrink: 0 }}>
          <Avatar name={post.author} size={80} onClick={() => onOpenProfile(post.author)} />
          <div 
            onClick={() => onOpenProfile(post.author)} 
            style={{ fontWeight: 600, fontSize: 15, marginTop: 12, cursor: "pointer", color: "#e8d9c0" }}
          >
            {post.author}
          </div>
          {isOP && (
            <div style={{ fontSize: 11, color: "#c4401f", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Original Poster
            </div>
          )}
          <div style={{ fontSize: 12, color: "#5a5450", marginTop: 6 }}>
            #{index}
          </div>
        </div>

        {/* Post Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#5a5450", marginBottom: 12 }}>
            {timeAgo(post.created_at)}
          </div>

          <div style={{ color: "#e8d9c0", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 16 }}>
            {post.body}
          </div>

          {post.image_url && (
            <div style={{ marginBottom: 16 }}>
              <img 
                src={post.image_url} 
                alt="Post" 
                style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 4, border: "1px solid #2e2722" }} 
              />
            </div>
          )}

          {post.video_url && (
            <div style={{ marginBottom: 16 }}>
              <video 
                src={post.video_url} 
                controls 
                style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 4, border: "1px solid #2e2722" }} 
              />
            </div>
          )}

          {/* Voting & Reactions */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", paddingTop: 12, borderTop: "1px solid #2e2722" }}>
            {/* Mega Rep Button */}
            <button
              onClick={() => onVote(post.id, 10)}
              disabled={!canMegaRep}
              style={{
                ...voteBtn,
                background: "linear-gradient(135deg, #c4401f, #f39c12)",
                color: "#0d0c0b",
                opacity: canMegaRep ? 1 : 0.5,
                fontWeight: 700,
              }}
              title="Mega Rep +10"
            >
              <Icon name="fire" size={16} style={{ color: "#0d0c0b" }} />
              <span>+10</span>
            </button>

            {/* Mega Dislike Button */}
            <button
              onClick={() => onVote(post.id, -10)}
              disabled={!canMegaDislike}
              style={{
                ...voteBtn,
                background: "linear-gradient(135deg, #5a1e0e, #3a1408)",
                color: "#e8d9c0",
                opacity: canMegaDislike ? 1 : 0.5,
                fontWeight: 700,
              }}
              title="Mega Dislike -10"
            >
              <Icon name="skull" size={16} />
              <span>-10</span>
            </button>

            {/* React Button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                style={{
                  ...voteBtn,
                  background: "#2e2722",
                  color: "#a89a85",
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
                          onReact(post.id, emoji.name);
                          setShowReactions(false);
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid transparent",
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: 3,
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

            {/* Display reactions */}
            {Object.keys(reactions).length > 0 && (
              <>
                {Object.entries(reactions).map(([emojiName, users]) => {
                  if (users.length === 0) return null;
                  const emojiUrl = getEmojiUrl(emojiName);
                  const hasReacted = user && users.includes(user.username);

                  return (
                    <button
                      key={emojiName}
                      onClick={() => onReact(post.id, emojiName)}
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
              </>
            )}
          </div>
        </div>
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
};

const postCardStyle = {
  background: "#171411",
  border: "1px solid #2e2722",
  borderRadius: 4,
  padding: 20,
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

const voteBtn = {
  border: "1px solid #3a3530",
  borderRadius: 3,
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "Oswald, sans-serif",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 600,
};
