import { useRef, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  fontSize: 11,
};

export function ProfileCustomize({ username, onUpdate, showToast }) {
  const [uploading, setUploading] = useState(false);
  const pictureInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const musicInputRef = useRef(null);

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
      onUpdate();
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
      onUpdate();
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
      onUpdate();
    } catch (error) {
      showToast("Failed to upload music", "error");
    }
    setUploading(false);
  };

  return (
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
          style={mediaBtn}
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
          style={mediaBtn}
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
          style={mediaBtn}
        >
          Upload Music
        </button>
      </div>
    </div>
  );
}
