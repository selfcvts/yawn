import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API, useAuth } from "../context/AuthContext";
import TimeAgo from "react-timeago";
import ReactionBar from "../components/ReactionBar";
import PostComposer from "../components/PostComposer";
import UserCard from "../components/UserCard";

export default function ThreadPage() {
  const { id } = useParams();
  const { user, authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const token = localStorage.getItem("root_token");
    const headers = token ? { Authorization:`Bearer ${token}` } : {};
    const r = await fetch(`${API}/threads/${id}`, { headers });
    if (!r.ok) { setError("Thread not found"); setLoading(false); return; }
    setData(await r.json());
    setLoading(false);
  };

  useEffect(()=>{ load(); }, [id]);

  const submitPost = async ({ body, fontFamily, fontSize, textColor }) => {
    const r = await authFetch(`${API}/posts`, { method:"POST", body: JSON.stringify({ thread_id:id, body, font_family:fontFamily, font_size:fontSize, text_color:textColor }) });
    const post = await r.json();
    if (!r.ok) throw new Error(post.error);
    setData(prev => ({ ...prev, posts: [...(prev.posts||[]), { ...post }] }));
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    await authFetch(`${API}/posts/${postId}`, { method:"DELETE" });
    setData(prev => ({ ...prev, posts: prev.posts.filter(p=>p.id!==postId) }));
  };

  const featureThread = async () => {
    await authFetch(`${API}/threads/${id}/feature`, { method:"POST" });
    setData(prev => ({ ...prev, thread: { ...prev.thread, is_featured:1 } }));
  };

  const deleteThread = async () => {
    if (!window.confirm("Delete thread?")) return;
    await authFetch(`${API}/threads/${id}`, { method:"DELETE" });
    window.location.href = "/";
  };

  if (loading) return <div className="spinner" />;
  if (error) return <div style={{padding:40,textAlign:"center",color:"#555"}}>{error}</div>;
  if (!data) return null;

  const { thread, posts, myUserId } = data;
  const isAdmin = user && ["admin","owner","mod"].includes(user.role);
  const isOwnerOrAdmin = user && ["admin","owner"].includes(user.role);

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>
      {/* Breadcrumb */}
      <div style={{fontSize:12,color:"#444",marginBottom:16}}>
        <Link to="/" style={{color:"#555"}}>Home</Link> / <Link to={`/c/${thread.cat_slug}`} style={{color:thread.cat_color||"#555"}}>{thread.cat_name}</Link> / <span style={{color:"#666"}}>{thread.title}</span>
      </div>

      {/* Thread header */}
      <div className="card" style={{marginBottom:2,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
          <div style={{flex:1}}>
            <h1 style={{fontSize:20,fontWeight:700,color:"#e8e8e8",marginBottom:8,fontFamily:thread.font_family||"inherit",color:thread.text_color||"#e8e8e8"}}>{thread.title}</h1>
            <div style={{fontSize:11,color:"#444",display:"flex",gap:12,flexWrap:"wrap"}}>
              <span>by <Link to={`/u/${thread.username}`} style={{color:"#666"}}>{thread.username}</Link></span>
              <span>in <Link to={`/c/${thread.cat_slug}`} style={{color:thread.cat_color}}>{thread.cat_name}</Link></span>
              <span><TimeAgo date={thread.created_at*1000} /></span>
              <span>{thread.views} views</span>
              <span>{thread.reply_count} replies</span>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            {thread.is_pinned && <span style={{fontSize:10,color:"#f39c12"}}>📌 Pinned</span>}
            {thread.is_locked && <span style={{fontSize:10,color:"#555"}}>🔒 Locked</span>}
            {thread.is_featured && <span style={{fontSize:10,color:"#f39c12"}}>⭐ Featured</span>}
            {isAdmin && !thread.is_featured && <button className="btn btn-ghost btn-xs" onClick={featureThread}>⭐ Feature</button>}
            {(user?.id===thread.user_id||isAdmin) && <button className="btn btn-ghost btn-xs" style={{color:"#e74c3c"}} onClick={deleteThread}>Delete</button>}
          </div>
        </div>

        {/* OP body */}
        <div style={{display:"flex"}}>
          <UserCard user={{username:thread.username,avatar_url:thread.avatar_url,avatar_color:thread.avatar_color,rep:thread.rep,role:thread.role,custom_badge:thread.custom_badge,custom_badge_color:thread.custom_badge_color,profile_bio:thread.profile_bio,post_count:thread.post_count}} />
          <div style={{flex:1,padding:"16px 20px"}}>
            <div style={{fontFamily:thread.font_family||"inherit",fontSize:thread.font_size||"14px",color:thread.text_color||"#d8d8d8",lineHeight:1.7,wordBreak:"break-word"}}
              dangerouslySetInnerHTML={{__html:thread.body.includes("<span")?thread.body:thread.body.replace(/\n/g,"<br/>")}} />
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post, i) => (
        <div key={post.id} className="card" style={{marginBottom:2,overflow:"hidden",borderLeft:`2px solid ${i%2===0?"#1a1a1a":"#141414"}`}}>
          <div style={{display:"flex"}}>
            <UserCard user={post} />
            <div style={{flex:1,padding:"14px 20px"}}>
              <div style={{fontFamily:post.font_family||"inherit",fontSize:post.font_size||"14px",color:post.text_color||"#d0d0d0",lineHeight:1.7,wordBreak:"break-word"}}
                dangerouslySetInnerHTML={{__html:post.body.includes("<span")?post.body:post.body.replace(/\n/g,"<br/>")}} />
              <div style={{marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <ReactionBar post={post} myUserId={myUserId} onUpdate={load} />
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#333"}}><TimeAgo date={post.created_at*1000} /></span>
                  {(user?.id===post.user_id||isAdmin) && (
                    <button onClick={()=>deletePost(post.id)} style={{background:"none",border:"none",color:"#333",fontSize:11,cursor:"pointer"}}>delete</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Reply box */}
      <div style={{marginTop:20}}>
        {user ? (
          thread.is_locked && !isAdmin ? (
            <div style={{padding:20,textAlign:"center",color:"#444",fontSize:13}}>🔒 Thread is locked</div>
          ) : (
            <PostComposer onSubmit={submitPost} placeholder="Write your reply…" submitLabel="Post Reply" />
          )
        ) : (
          <div style={{padding:20,textAlign:"center",color:"#555",fontSize:13}}>
            <Link to="/login">Login</Link> or <Link to="/register">register</Link> to reply
          </div>
        )}
      </div>
    </div>
  );
}
