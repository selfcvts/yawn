import { useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function useProfileData(username) {
  const [user, setUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    
    try {
      const [userData, posts] = await Promise.all([
        axios.get(`${API}/users/${username}`),
        axios.get(`${API}/users/${username}/profile-posts`)
      ]);
      setUser(userData.data);
      setProfilePosts(posts.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [username]);

  return {
    user,
    profilePosts,
    loading,
    loadProfile,
  };
}
