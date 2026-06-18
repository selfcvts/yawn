import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function timeAgo(iso) {
  if (!iso) return "Never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function SecurityDashboard({ ownerUsername, onBack, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [changingRole, setChangingRole] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [ownerUsername]);

  const loadDashboard = async () => {
    try {
      const { data } = await axios.get(`${API}/owner/security-dashboard?owner_username=${ownerUsername}`);
      setUsers(data.users || []);
      setLoading(false);
    } catch (error) {
      showToast("Failed to load security dashboard", "error");
      setLoading(false);
    }
  };

  const handleChangeRole = async (targetUsername, newRole) => {
    setChangingRole(targetUsername);
    try {
      const formData = new FormData();
      formData.append("target_username", targetUsername);
      formData.append("new_role", newRole);
      formData.append("owner_username", ownerUsername);

      await axios.post(`${API}/owner/change-role`, formData);
      showToast(`Changed ${targetUsername}'s role to ${newRole}`);
      
      // Update local state
      setUsers(users.map(u => 
        u.username === targetUsername ? {...u, role: newRole} : u
      ));
    } catch (error) {
      showToast(error.response?.data?.detail || "Failed to change role", "error");
    } finally {
      setChangingRole(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#5a5450" }}>
        Loading security dashboard...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
      <div onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7a7066", fontSize: 13, cursor: "pointer", marginBottom: 20 }}>
        ← back to categories
      </div>

      <div style={{ 
        background: "#171411", 
        border: "1px solid #2e2722", 
        borderRadius: 4, 
        padding: 24,
        marginBottom: 24
      }}>
        <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: 28, marginTop: 0, marginBottom: 8, color: "#c4401f" }}>
          🔒 Security Dashboard
        </h1>
        <p style={{ color: "#7a7066", fontSize: 14, margin: 0 }}>
          Owner-only: Monitor all users, IPs, and manage roles
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#e8d9c0", fontFamily: "Oswald" }}>{users.length}</div>
          <div style={{ fontSize: 12, color: "#7a7066", textTransform: "uppercase" }}>Total Users</div>
        </div>
        <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#c4401f", fontFamily: "Oswald" }}>{users.filter(u => u.role === "admin").length}</div>
          <div style={{ fontSize: 12, color: "#7a7066", textTransform: "uppercase" }}>Admins</div>
        </div>
        <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f39c12", fontFamily: "Oswald" }}>{users.filter(u => u.role === "moderator").length}</div>
          <div style={{ fontSize: 12, color: "#7a7066", textTransform: "uppercase" }}>Moderators</div>
        </div>
        <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#e74c3c", fontFamily: "Oswald" }}>{users.filter(u => u.is_banned).length}</div>
          <div style={{ fontSize: 12, color: "#7a7066", textTransform: "uppercase" }}>Banned</div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0d0c0b", borderBottom: "1px solid #2e2722" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Username</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Rep</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Last Login IP</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Last Login</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Joined</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#7a7066", textTransform: "uppercase", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr 
                  key={user.id} 
                  style={{ 
                    borderBottom: idx < users.length - 1 ? "1px solid #2e2722" : "none",
                    background: selectedUser === user.username ? "#1a1714" : "transparent"
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ color: "#e8d9c0", fontWeight: 600, fontSize: 14 }}>{user.username}</div>
                    <div style={{ color: "#5a5450", fontSize: 11, marginTop: 2 }}>{user.id}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      display: "inline-block",
                      padding: "4px 8px", 
                      borderRadius: 3, 
                      fontSize: 11, 
                      fontWeight: 600,
                      textTransform: "uppercase",
                      background: user.role === "owner" ? "#7a1e0e" : user.role === "admin" ? "#c4401f" : user.role === "moderator" ? "#f39c12" : "#2e2722",
                      color: user.role === "owner" || user.role === "admin" ? "#0d0c0b" : "#e8d9c0"
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#e8d9c0", fontSize: 14 }}>{user.rep || 0}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ color: "#e8d9c0", fontSize: 13, fontFamily: "monospace" }}>
                      {user.last_login_ip || "N/A"}
                    </div>
                    {user.ip_history && user.ip_history.length > 1 && (
                      <button
                        onClick={() => setSelectedUser(selectedUser === user.username ? null : user.username)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#7a7066",
                          fontSize: 11,
                          cursor: "pointer",
                          padding: 0,
                          marginTop: 4,
                          textDecoration: "underline"
                        }}
                      >
                        {selectedUser === user.username ? "Hide" : "View"} history ({user.ip_history.length})
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#7a7066", fontSize: 13 }}>{timeAgo(user.last_login_at)}</td>
                  <td style={{ padding: "12px 16px", color: "#7a7066", fontSize: 13 }}>{timeAgo(user.joined_at)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {user.is_banned && <span style={{ color: "#e74c3c", fontSize: 11, fontWeight: 600 }}>BANNED</span>}
                    {user.is_muted && <span style={{ color: "#f39c12", fontSize: 11, fontWeight: 600 }}>MUTED</span>}
                    {!user.is_banned && !user.is_muted && <span style={{ color: "#2ecc71", fontSize: 11 }}>Active</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {user.role !== "owner" && (
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.username, e.target.value)}
                        disabled={changingRole === user.username}
                        style={{
                          background: "#0d0c0b",
                          border: "1px solid #2e2722",
                          color: "#e8d9c0",
                          padding: "4px 8px",
                          borderRadius: 3,
                          fontSize: 12,
                          cursor: "pointer"
                        }}
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* IP History Expansion */}
        {selectedUser && users.find(u => u.username === selectedUser)?.ip_history && (
          <div style={{ borderTop: "1px solid #2e2722", padding: 16, background: "#0d0c0b" }}>
            <h4 style={{ fontSize: 13, color: "#7a7066", textTransform: "uppercase", marginTop: 0, marginBottom: 12 }}>
              IP History for {selectedUser}
            </h4>
            <div style={{ display: "grid", gap: 8 }}>
              {users.find(u => u.username === selectedUser).ip_history.slice(-10).reverse().map((entry, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a89a85" }}>
                  <span style={{ fontFamily: "monospace" }}>{entry.ip}</span>
                  <span style={{ color: "#5a5450" }}>{timeAgo(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
