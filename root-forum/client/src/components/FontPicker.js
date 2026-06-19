import { useState } from "react";

// 150 Google Fonts covering various styles
export const FONTS = [
  "Space Grotesk","JetBrains Mono","Roboto","Open Sans","Lato","Montserrat","Raleway","Poppins","Nunito","Oswald",
  "Merriweather","Playfair Display","Lora","Crimson Text","EB Garamond","Cormorant Garamond","Libre Baskerville","PT Serif","Bitter","Gentium Plus",
  "Dancing Script","Pacifico","Satisfy","Great Vibes","Kaushan Script","Caveat","Indie Flower","Shadows Into Light","Lobster","Righteous",
  "Bebas Neue","Anton","Black Han Sans","Lilita One","Titan One","Fredoka One","Baloo 2","Comfortaa","Varela Round","Quicksand",
  "Source Code Pro","Fira Code","Inconsolata","IBM Plex Mono","Courier Prime","Share Tech Mono","Cutive Mono","Nova Mono","VT323","Press Start 2P",
  "Cinzel","Trajan Pro","Cormorant","Spectral","Philosopher","GFS Didot","Sorts Mill Goudy","Uncial Antiqua","MedievalSharp","Almendra",
  "Noto Sans","Ubuntu","Rubik","Inter","DM Sans","Figtree","Plus Jakarta Sans","Outfit","Manrope","Syne",
  "Exo 2","Rajdhani","Orbitron","Audiowide","Quantico","Jura","Share Tech","Saira","Barlow","Karla",
  "Abril Fatface","Alfa Slab One","Black Ops One","Boogaloo","Bowlby One","Bungee","Calistoga","Changa One","Cherry Cream Soda","Chewy",
  "Permanent Marker","Architects Daughter","Patrick Hand","Handlee","Neucha","Rock Salt","Covered By Your Grace","Reenie Beanie","Itim","Sriracha",
  "Cinzel Decorative","Poiret One","Cormorant Unicase","Forum","Vidaloka","Rufina","Cardo","Arvo","Rokkitt","Zilla Slab",
  "Josefin Sans","Josefin Slab","Raleway Dots","Questrial","Jost","Asap","Asap Condensed","Barlow Condensed","Encode Sans","Encode Sans Condensed",
  "Noto Serif","Source Serif Pro","Tinos","Arimo","Cousine","PT Sans","PT Mono","PT Sans Narrow","PT Sans Caption","Cuprum",
  "Yanone Kaffeesatz","Syncopate","Russo One","Teko","Saira Condensed","Barlow Semi Condensed","DM Serif Display","DM Serif Text","Fraunces","Libre Franklin",
  "Yeseva One","Rozha One","Rasa","Vollkorn","Noticia Text","Neuton","Cambo","Aleo","Martel","Martel Sans",
  "Chivo","Chivo Mono","BioRhyme","Crete Round","Domine","Fanwood Text","Lustria","Scope One","Trocchi","Volkhov"
];

const FONT_SIZES = ["10px","11px","12px","13px","14px","16px","18px","20px","24px","28px","32px","36px","42px","48px","56px","64px"];

export default function FontPicker({ value, size, onChange, onSizeChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      {/* Font selector */}
      <div style={{position:"relative"}}>
        <button type="button" onClick={()=>setOpen(!open)} style={{background:"#1a1a1a",border:"1px solid #2a2a2a",color:"#ccc",padding:"6px 12px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:value||"inherit",minWidth:160}}>
          {value || "Font…"} ▾
        </button>
        {open && (
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"#161616",border:"1px solid #2a2a2a",borderRadius:6,width:220,maxHeight:280,overflowY:"auto",zIndex:500,boxShadow:"0 8px 24px rgba(0,0,0,.7)"}}>
            <div style={{padding:"8px 8px 4px",position:"sticky",top:0,background:"#161616",borderBottom:"1px solid #222"}}>
              <input placeholder="Search fonts…" value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"5px 8px",fontSize:12,background:"#0d0d0d",border:"1px solid #2a2a2a",borderRadius:4,color:"#ccc",width:"100%"}} autoFocus />
            </div>
            {filtered.map(f=>(
              <button key={f} type="button" onClick={()=>{onChange(f);setOpen(false);setSearch("");}}
                style={{display:"block",width:"100%",padding:"7px 12px",background:value===f?"#1e1e1e":"none",border:"none",color:"#ccc",fontFamily:f,fontSize:13,textAlign:"left",cursor:"pointer"}}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Size selector */}
      <select value={size||"14px"} onChange={e=>onSizeChange(e.target.value)} style={{width:"auto",padding:"6px 8px",fontSize:12,background:"#1a1a1a",border:"1px solid #2a2a2a",color:"#ccc",borderRadius:4}}>
        {FONT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      {value && <button type="button" onClick={()=>{onChange("");}} style={{background:"none",border:"none",color:"#555",fontSize:11,cursor:"pointer"}}>reset</button>}
      {/* Load the selected font */}
      {value && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(value)}&display=swap`} />}
    </div>
  );
}
