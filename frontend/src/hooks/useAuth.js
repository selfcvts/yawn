// Custom hook for authentication
import { useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const SESSION_KEY = "forum_session_username";

export function useAuth() {
  const [user, setUser] = useState(null);

  const login = useCallback((userData) => {
    setUser(userData);
    // Note: localStorage used for MVP simplicity. For production, use httpOnly cookies
    localStorage.setItem(SESSION_KEY, userData.username);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${API}/users/${user.username}`);
      if (data) setUser(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to refresh user", error);
      }
    }
  }, [user]);

  const restoreSession = useCallback(async () => {
    const savedUsername = localStorage.getItem(SESSION_KEY);
    if (savedUsername) {
      try {
        const { data } = await axios.get(`${API}/users/${savedUsername}`);
        if (data) setUser(data);
        return true;
      } catch (error) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
    }
    return false;
  }, []);

  return {
    user,
    login,
    logout,
    refreshUser,
    restoreSession,
  };
}
