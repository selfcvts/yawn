import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API } from "../context/AuthContext";

export default function CategoriesPage() {
  const [cats, setCats] = useState([]);
  useEffect(()=>{ fetch(`${API}/categories`).then(r=>r.json()).then(setCats); },[]);
  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 20px"}}>
      <h1 style={{fontSize:22,fontWeight:700,color:"#e8e8e8",marginBottom:24}}>All Categories</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {cats.map(c=>(
          <Link to={`/c/${c.slug}`} key={c.slug} style={{display:"block",padding:"16px",background:"#111",border:`1px solid #1a1a1a`,borderRadius:8,textDecoration:"none",borderLeft:`3px solid ${c.color}`}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:22}}>{c.icon}</span>
              <span style={{fontSize:14,fontWeight:700,color:"#e0e0e0"}}>{c.name}</span>
            </div>
            <div style={{fontSize:12,color:"#555",marginBottom:10,lineHeight:1.4}}>{c.description}</div>
            <div style={{display:"flex",gap:16}}>
              <span style={{fontSize:11,color:"#444"}}><span style={{color:"#666",fontWeight:700}}>{c.thread_count}</span> threads</span>
              <span style={{fontSize:11,color:"#444"}}><span style={{color:"#666",fontWeight:700}}>{c.post_count}</span> posts</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
