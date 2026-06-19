import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { LoginPage, RegisterPage } from "./pages/Auth";
import CategoryPage from "./pages/CategoryPage";
import ThreadPage from "./pages/ThreadPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPanel from "./pages/AdminPanel";
import Leaderboard from "./pages/Leaderboard";
import ThreadsList from "./pages/ThreadsList";
import CategoriesPage from "./pages/CategoriesPage";
import "./index.css";

// Google Fonts preload
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap";
if (!document.querySelector(`link[href="${FONT_LINK}"]`)) {
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = FONT_LINK;
  document.head.appendChild(l);
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/threads" element={<ThreadsList />} />
          <Route path="/c/:slug" element={<CategoryPage />} />
          <Route path="/t/:id" element={<ThreadPage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<div style={{padding:60,textAlign:"center",color:"#444",fontSize:14}}>404 — Page not found. <a href="/">Go home</a></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
