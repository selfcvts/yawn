import { useState, useRef } from "react";
import FontPicker from "./FontPicker";
import TextColorizer from "./TextColorizer";
import EmojiPicker from "./EmojiPicker";

export default function PostComposer({ onSubmit, placeholder = "Write your reply…", submitLabel = "Post Reply", showFontTools = true }) {
  const [body, setBody] = useState("");
  const [fontFamily, setFontFamily] = useState("");
  const [fontSize, setFontSize] = useState("14px");
  const [textColor, setTextColor] = useState("");
  const [showColorizer, setShowColorizer] = useState(false);
  const [showGradient, setShowGradient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textRef = useRef();

  const insertAtCursor = (text) => {
    const el = textRef.current;
    if (!el) { setBody(b => b + text); return; }
    const start = el.selectionStart, end = el.selectionEnd;
    const newVal = body.slice(0,start) + text + body.slice(end);
    setBody(newVal);
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + text.length; el.focus(); }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true); setError("");
    try {
      await onSubmit({ body, fontFamily, fontSize, textColor });
      setBody(""); setFontFamily(""); setFontSize("14px"); setTextColor("");
    } catch(err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const applyGradient = (html) => {
    setBody(html);
    setShowGradient(false);
  };

  // Preview style
  const previewStyle = {
    fontFamily: fontFamily || "inherit",
    fontSize: fontSize || "14px",
    color: textColor || "inherit",
  };

  return (
    <form onSubmit={handleSubmit} style={{background:"#0f0f0f",border:"1px solid #1e1e1e",borderRadius:8,overflow:"hidden"}}>
      {/* Toolbar */}
      {showFontTools && (
        <div style={{padding:"10px 12px",borderBottom:"1px solid #1a1a1a",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",background:"#111"}}>
          <FontPicker value={fontFamily} size={fontSize} onChange={setFontFamily} onSizeChange={setFontSize} />
          <div style={{display:"flex",gap:6,alignItems:"center",marginLeft:"auto"}}>
            {/* Text color */}
            <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#555",cursor:"pointer"}}>
              <input type="color" value={textColor||"#e8e8e8"} onChange={e=>setTextColor(e.target.value)} style={{width:24,height:24,padding:0,border:"none",borderRadius:3,cursor:"pointer",background:"none"}} />
              <span>Color</span>
            </label>
            <button type="button" onClick={()=>setShowGradient(!showGradient)} style={{background:"linear-gradient(90deg,#e74c3c,#f39c12,#2ecc71)",border:"none",borderRadius:3,padding:"3px 8px",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>GRADIENT</button>
            <EmojiPicker onSelect={insertAtCursor} />
          </div>
        </div>
      )}

      {/* Gradient colorizer */}
      {showGradient && (
        <div style={{padding:"0 12px 12px",borderBottom:"1px solid #1a1a1a"}}>
          <TextColorizer text={body} onApply={applyGradient} />
        </div>
      )}

      {/* Textarea */}
      <div style={{padding:12}}>
        {/* Show if HTML mode (gradient applied) */}
        {body.includes("<span style=") ? (
          <div style={{marginBottom:8}}>
            <div style={{...previewStyle,background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:6,padding:10,minHeight:80,fontSize:14,wordBreak:"break-word"}} dangerouslySetInnerHTML={{__html:body}} />
            <button type="button" onClick={()=>setBody("")} style={{marginTop:4,fontSize:11,color:"#555",background:"none",border:"none",cursor:"pointer"}}>Clear gradient text</button>
          </div>
        ) : (
          <textarea ref={textRef} value={body} onChange={e=>setBody(e.target.value)} placeholder={placeholder}
            style={{...previewStyle,width:"100%",minHeight:100,resize:"vertical",padding:"10px",background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:6,color:textColor||"#e8e8e8",fontFamily:fontFamily||"inherit",fontSize:fontSize||"14px"}} />
        )}
        {error && <div className="error-msg" style={{marginTop:6}}>{error}</div>}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
          <button type="submit" disabled={loading||!body.trim()} className="btn btn-primary">
            {loading ? "Posting…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
