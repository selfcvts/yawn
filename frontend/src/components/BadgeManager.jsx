import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function BadgeManager({ ownerUsername, onBack, showToast }) {
  const [badges, setBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    text: "",
    icon: "",
    background_color: "#DAA520",
    border_color: "#000000",
    text_color: "#ffffff",
    background_image: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [badgesRes, usersRes] = await Promise.all([
        axios.get(`${API}/badges`),
        axios.get(`${API}/owner/security-dashboard?owner_username=${ownerUsername}`)
      ]);
      setBadges(badgesRes.data || []);
      setUsers(usersRes.data.users || []);
      setLoading(false);
    } catch (error) {
      showToast("Failed to load badge data", "error");
      setLoading(false);
    }
  };

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("text", formData.text);
      data.append("icon", formData.icon);
      data.append("background_color", formData.background_color);
      data.append("border_color", formData.border_color);
      data.append("text_color", formData.text_color);
      data.append("owner_username", ownerUsername);
      
      if (formData.background_image) {
        data.append("background_image", formData.background_image);
      }

      const response = await axios.post(`${API}/owner/badges/create`, data);
      showToast(`Badge "${formData.name}" created!`);
      
      setBadges([...badges, response.data]);
      setShowCreateForm(false);
      setFormData({
        name: "",
        text: "",
        icon: "",
        background_color: "#DAA520",
        border_color: "#000000",
        text_color: "#ffffff",
        background_image: null
      });
    } catch (error) {
      showToast(error.response?.data?.detail || "Failed to create badge", "error");
    }
  };

  const handleAssignBadge = async (username, badgeId) => {
    try {
      const data = new FormData();
      data.append("target_username", username);
      data.append("badge_id", badgeId);
      data.append("owner_username", ownerUsername);

      await axios.post(`${API}/owner/badges/assign`, data);
      showToast(`Badge assigned to ${username}`);
      
      // Update local state
      setUsers(users.map(u => {
        if (u.username === username) {
          const badges = u.badges || [];
          if (!badges.includes(badgeId)) {
            return {...u, badges: [...badges, badgeId]};
          }
        }
        return u;
      }));
    } catch (error) {
      showToast(error.response?.data?.detail || "Failed to assign badge", "error");
    }
  };

  const handleRemoveBadge = async (username, badgeId) => {
    try {
      const data = new FormData();
      data.append("target_username", username);
      data.append("badge_id", badgeId);
      data.append("owner_username", ownerUsername);

      await axios.post(`${API}/owner/badges/remove`, data);
      showToast(`Badge removed from ${username}`);
      
      // Update local state
      setUsers(users.map(u => {
        if (u.username === username) {
          return {...u, badges: (u.badges || []).filter(id => id !== badgeId)};
        }
        return u;
      }));
    } catch (error) {
      showToast(error.response?.data?.detail || "Failed to remove badge", "error");
    }
  };

  const BadgePreview = ({ badge, size = "medium" }) => {
    const sizes = {
      small: { height: 24, fontSize: 11, padding: "4px 8px" },
      medium: { height: 36, fontSize: 13, padding: "8px 16px" },
      large: { height: 48, fontSize: 15, padding: "12px 20px" }
    };
    
    const style = {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: sizes[size].height,
      padding: sizes[size].padding,
      borderRadius: 4,
      fontSize: sizes[size].fontSize,
      fontWeight: 600,
      border: `2px solid ${badge.border_color || "#000"}`,
      color: badge.text_color,
      background: badge.background_image 
        ? `url(${BACKEND_URL}${badge.background_image}) center/cover`
        : badge.background_color || "#DAA520",
      textShadow: "0 1px 2px rgba(0,0,0,0.5)"
    };

    return (
      <div style={style}>
        {badge.icon && <span>{badge.icon}</span>}
        <span>{badge.text}</span>
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#5a5450" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
      <div onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7a7066", fontSize: 13, cursor: "pointer", marginBottom: 20 }}>
        ← back
      </div>

      <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 24, marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: 28, marginTop: 0, marginBottom: 8, color: "#c4401f" }}>
          🏅 Badge Manager
        </h1>
        <p style={{ color: "#7a7066", fontSize: 14, margin: 0 }}>
          Create custom badges and assign them to users
        </p>
      </div>

      {/* Create Badge Button */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: "#c4401f",
            color: "#0d0c0b",
            border: "none",
            borderRadius: 4,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Oswald, sans-serif",
            textTransform: "uppercase"
          }}
        >
          {showCreateForm ? "Cancel" : "+ Create New Badge"}
        </button>
      </div>

      {/* Create Badge Form */}
      {showCreateForm && (
        <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "Oswald", textTransform: "uppercase" }}>
            Create New Badge
          </h3>
          <form onSubmit={handleCreateBadge}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 4 }}>Badge Name (ID)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="vip"
                  style={{ width: "100%", background: "#0d0c0b", border: "1px solid #2e2722", color: "#e8d9c0", padding: "8px 12px", borderRadius: 3 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 4 }}>Display Text</label>
                <input
                  type="text"
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value})}
                  required
                  placeholder="VIP"
                  style={{ width: "100%", background: "#0d0c0b", border: "1px solid #2e2722", color: "#e8d9c0", padding: "8px 12px", borderRadius: 3 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 4 }}>Icon/Emoji (optional)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="⭐"
                  style={{ width: "100%", background: "#0d0c0b", border: "1px solid #2e2722", color: "#e8d9c0", padding: "8px 12px", borderRadius: 3 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 4 }}>Background Color</label>
                <input
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                  style={{ width: "100%", height: 40, cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 4 }}>Border Color</label>
                <input
                  type="color"
                  value={formData.border_color}
                  onChange={(e) => setFormData({...formData, border_color: e.target.value})}
                  style={{ width: "100%", height: 40, cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 4 }}>Text Color</label>
                <input
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                  style={{ width: "100%", height: 40, cursor: "pointer" }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 4 }}>Background Image (optional - overrides color)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, background_image: e.target.files[0]})}
                  style={{ width: "100%", color: "#e8d9c0" }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: "#7a7066", marginBottom: 8 }}>Preview:</label>
              <BadgePreview badge={{...formData, text: formData.text || "Preview"}} size="large" />
            </div>

            <button
              type="submit"
              style={{
                background: "#2ecc71",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Create Badge
            </button>
          </form>
        </div>
      )}

      {/* Existing Badges */}
      <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontFamily: "Oswald", textTransform: "uppercase" }}>
          Existing Badges ({badges.length})
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {badges.map(badge => (
            <div key={badge.id} style={{ background: "#0d0c0b", border: "1px solid #2e2722", borderRadius: 4, padding: 16 }}>
              <BadgePreview badge={badge} size="medium" />
              <div style={{ marginTop: 12, fontSize: 11, color: "#5a5450" }}>
                ID: {badge.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Badges to Users */}
      <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontFamily: "Oswald", textTransform: "uppercase" }}>
          Assign Badges to Users
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          {users.map(user => (
            <div key={user.username} style={{ background: "#0d0c0b", border: "1px solid #2e2722", borderRadius: 4, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#e8d9c0" }}>{user.username}</div>
                  <div style={{ fontSize: 11, color: "#5a5450" }}>{user.role}</div>
                </div>
                <button
                  onClick={() => setSelectedUser(selectedUser === user.username ? null : user.username)}
                  style={{
                    background: "#2e2722",
                    border: "1px solid #3a3530",
                    color: "#a89a85",
                    borderRadius: 3,
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  {selectedUser === user.username ? "Hide" : "Manage Badges"}
                </button>
              </div>
              
              {/* Current Badges */}
              {user.badges && user.badges.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {user.badges.map(badgeId => {
                    const badge = badges.find(b => b.id === badgeId);
                    if (!badge) return null;
                    return (
                      <div key={badgeId} style={{ position: "relative" }}>
                        <BadgePreview badge={badge} size="small" />
                        <button
                          onClick={() => handleRemoveBadge(user.username, badgeId)}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: "#e74c3c",
                            border: "none",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            fontSize: 10,
                            cursor: "pointer",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Badge Selection */}
              {selectedUser === user.username && (
                <div style={{ borderTop: "1px solid #2e2722", paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: "#7a7066", marginBottom: 8, textTransform: "uppercase" }}>
                    Add Badge:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {badges.map(badge => {
                      const hasIt = user.badges?.includes(badge.id);
                      return (
                        <button
                          key={badge.id}
                          onClick={() => !hasIt && handleAssignBadge(user.username, badge.id)}
                          disabled={hasIt}
                          style={{
                            opacity: hasIt ? 0.4 : 1,
                            cursor: hasIt ? "not-allowed" : "pointer",
                            background: "transparent",
                            border: "none",
                            padding: 0
                          }}
                        >
                          <BadgePreview badge={badge} size="small" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
