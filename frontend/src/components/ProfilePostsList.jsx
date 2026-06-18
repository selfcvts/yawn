import { useState, useRef } from "react";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";
import ProfilePostItem from "./ProfilePostItem";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ICONS = {
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

export default function ProfilePostsList({ username, currentUser, profilePosts, onUpdate, showToast }) {
  const [postBody, setPostBody] = useState("");
  const [richContent, setRichContent] = useState(null);
  const [posting, setPosting] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

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
      onUpdate();
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
      onUpdate();
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
      onUpdate();
    } catch (error) {
      showToast("Could not add reaction", "error");
    }
  };

  return (
    <>
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
            profileOwner={username}
            onDelete={() => handleDeletePost(post.id)}
            onReact={(emojiName) => handleReaction(post.id, emojiName)}
          />
        ))
      )}
    </>
  );
}
