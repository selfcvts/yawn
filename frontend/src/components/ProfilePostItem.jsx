import { useState } from "react";
import { EMOJI_GG_REACTIONS, getEmojiUrl } from "../utils/emojis";

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

function Avatar({ name, size = 40 }) {
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

const cardStyle = {
  background: "#171411",
  border: "1px solid #2e2722",
  borderRadius: 4,
  padding: 18,
  marginBottom: 16,
};

export default function ProfilePostItem({ post, currentUser, profileOwner, onDelete, onReact }) {
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
          
          <div style={{ 
            color: post.rich_content?.color?.type === "solid" ? post.rich_content.color.color : "#e8d9c0",
            background: post.rich_content?.color?.type === "gradient" ? post.rich_content.color.gradient : "transparent",
            fontFamily: post.rich_content?.font || "inherit",
            fontWeight: post.rich_content?.bold ? "bold" : "normal",
            fontStyle: post.rich_content?.italic ? "italic" : "normal",
            lineHeight: 1.6, 
            whiteSpace: "pre-wrap", 
            marginBottom: 12,
            padding: post.rich_content?.color?.type === "gradient" ? "8px" : "0",
            borderRadius: post.rich_content?.color?.type === "gradient" ? "4px" : "0",
            textShadow: post.rich_content?.color?.type === "gradient" ? "0 0 2px rgba(0,0,0,0.8)" : "none"
          }}>
            {post.body}
          </div>

          {post.image_url && (
            <div style={{ marginBottom: 12 }}>
              <img 
                src={post.image_url} 
                alt="Post" 
                style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4, border: "1px solid #2e2722" }} 
              />
            </div>
          )}

          {post.video_url && (
            <div style={{ marginBottom: 12 }}>
              <video 
                src={post.video_url} 
                controls 
                style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4, border: "1px solid #2e2722" }} 
              />
            </div>
          )}

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
                          onReact(emoji.name);
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
