import { useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function useThreadData(threadId) {
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadThread = useCallback(async () => {
    if (!threadId) return;
    
    try {
      const [threadRes, postsRes] = await Promise.all([
        axios.get(`${API}/threads/${threadId}`),
        axios.get(`${API}/threads/${threadId}/posts`)
      ]);
      setThread(threadRes.data);
      setPosts(postsRes.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [threadId]);

  return {
    thread,
    posts,
    loading,
    loadThread,
  };
}
