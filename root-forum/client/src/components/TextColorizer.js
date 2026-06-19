import { useState } from "react";

const PRESETS = [
  { name:"Fire", colors:["#ff4500","#ff6b00","#ffaa00","#ffdd00"] },
  { name:"Ocean", colors:["#0066ff","#00aaff","#00ddff","#00ffee"] },
  { name:"Void", colors:["#8e44ad","#6c3483","#4a235a","#2c1654"] },
  { name:"Blood", colors:["#8b0000","#c0392b","#e74c3c","#ff6b6b"] },
  { name:"Matrix", colors:["#00ff41","#00cc33","#009922","#006611"] },
  { name:"Gold", colors:["#b8860b","#daa520","#ffd700","#fff8dc"] },
  { name:"Sunset", colors:["#ff6b35","#f7c59f","#efefd0","#004e89"] },
  { name:"Neon", colors:["#ff00ff","#00ffff","#ff00aa","#aa00ff"] },
  { name:"Arctic", colors:["#e0f7fa","#b2ebf2","#80deea","#4dd0e1"] },
  { name:"Lava", colors:["#1a0000","#5c0000","#b71c1c","#ff5722","#ffeb3b"] },
];

function lerp(a,b,t){return Math.round(a+(b-a)*t)}
function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return[r,g,b]}
function rgbToHex(r,g,b){return`#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`}

function colorizeText(text, colors) {
  if (!text || colors.length < 2) return text;
  return text.split("").map((char, i) => {
    if (char === " " || char === "\n") return char;
    const t = i / Math.max(text.length - 1, 1);
    const seg = Math.min(Math.floor(t * (colors.length - 1)), colors.length - 2);
    const localT = t * (colors.length - 1) - seg;
    const [r1,g1,b1] = hexToRgb(colors[seg]);
    const [r2,g2,b2] = hexToRgb(colors[seg+1]);
    const color = rgbToHex(lerp(r1,r2,localT),lerp(g1,g2,localT),lerp(b1,b2,localT));
    return `<span style="color:${color}">${char}</span>`;
  }).join("");
}

export function renderColorized(html) {
  return { __html: html };
}

export default function TextColorizer({ text, onApply }) {
  const [colors, setColors] = useState(["#e74c3c","#f39c12"]);
  const [activePreset, setActivePreset] = useState(null);

  const apply = () => {
    const colored = colorizeText(text, colors);
    onApply(colored);
  };

  const preview = colorizeText(text || "Preview text here", colors);

  return (
    <div style={{background:"#0f0f0f",border:"1px solid #222",borderRadius:8,padding:16,marginTop:8}}>
      <div style={{fontSize:12,fontWeight:700,color:"#666",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Text Colorizer</div>
      
      {/* Presets */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {PRESETS.map(p=>(
          <button key={p.name} type="button" onClick={()=>{setColors(p.colors);setActivePreset(p.name);}}
            style={{padding:"4px 10px",borderRadius:3,border:`1px solid ${activePreset===p.name?"#c0392b":"#2a2a2a"}`,background:"#1a1a1a",cursor:"pointer",fontSize:11,
              background:`linear-gradient(90deg,${p.colors.join(",")})`,color:"#fff",fontWeight:700,textShadow:"0 1px 2px rgba(0,0,0,.8)"}}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Custom color stops */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:11,color:"#555"}}>Colors:</span>
        {colors.map((c,i)=>(
          <input key={i} type="color" value={c} onChange={e=>{const nc=[...colors];nc[i]=e.target.value;setColors(nc);setActivePreset(null);}}
            style={{width:32,height:28,padding:0,border:"none",background:"none",cursor:"pointer",borderRadius:4}} />
        ))}
        <button type="button" onClick={()=>setColors([...colors,"#ffffff"])} style={{fontSize:11,color:"#666",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:3,padding:"3px 8px",cursor:"pointer"}}>+ color</button>
        {colors.length > 2 && <button type="button" onClick={()=>setColors(colors.slice(0,-1))} style={{fontSize:11,color:"#666",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:3,padding:"3px 8px",cursor:"pointer"}}>- color</button>}
      </div>

      {/* Preview */}
      <div style={{background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:6,padding:12,marginBottom:12,minHeight:40,fontSize:14,wordBreak:"break-word"}}
        dangerouslySetInnerHTML={{__html: preview || "<span style='color:#333'>Type something above...</span>"}} />

      <button type="button" onClick={apply} className="btn btn-primary btn-sm">Apply Gradient Text</button>
    </div>
  );
}
