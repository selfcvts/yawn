import { useState, useRef, useEffect } from "react";
import { API } from "../context/AuthContext";

// 1800+ emoji categories
const EMOJI_DATA = {
  "😀 Smileys": ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","😘","🥰","😗","😙","😚","☺️","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🤑","😲","☹️","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","🥴","😠","😡","🤬","😷","🤒","🤕","🤢","🤮","🤧","😇","🥳","🥸","🤠","🤡","🤥","🤫","🤭","🧐","🤓","😈","👿","👹","👺","💀","☠️","👻","👽","🤖","💩","😺","😸","😹","😻","😼","😽","🙀","😿","😾"],
  "👋 Gestures": ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁️","👅","👄","💋","🫦"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","🕉️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"],
  "🌟 Symbols": ["⭐","🌟","✨","💫","⚡","🔥","🌊","💧","🌸","🌺","🌻","🌹","🌷","🍀","🌿","🍃","🍂","🍁","🌾","🌵","🌴","🌲","🌳","🎋","🎍","🪴","🌱","🌾","🍄","🌰","🐚","🪸","🪨","💎","💍","👑","🏆","🥇","🎖️","🎗️","🎫","🎟️","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎰","🎱"],
  "🍕 Food": ["🍕","🍔","🌮","🌯","🥙","🧆","🥚","🍳","🧇","🥞","🧈","🍞","🥐","🥖","🥨","🧀","🥗","🥘","🍲","🫕","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍙","🍚","🍱","🥟","🦪","🍤","🍙","🍘","🍥","🥮","🍡","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🧃","🥤","🧋","☕","🍵","🫖","🍺","🍻","🥂","🍷","🫗","🥃","🍸","🍹","🧉","🍾"],
  "🚗 Travel": ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🛺","🚲","🛴","🛹","🛼","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🌍","🌎","🌏","🗺️","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱"],
  "💻 Tech": ["💻","🖥️","🖨️","⌨️","🖱️","🖲️","💽","💾","💿","📀","📱","☎️","📞","📟","📠","📺","📻","🧭","⏱️","⏲️","⏰","🕰️","⌚","⏳","⌛","📡","🔋","🪫","🔌","💡","🔦","🕯️","🪔","🧯","🗑️","🛢️","💸","💴","💵","💶","💷","💰","💳","🪙","💹","📈","📉","📊","📋","📌","📍","✂️","🗃️","🗄️","🗑️","🔒","🔓","🔏","🔐","🔑","🗝️"],
  "🐶 Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"],
  "🌙 Dark": ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌙","🌚","⭐","🌟","✨","💫","☄️","🌠","🌌","🌃","🏙️","🌆","🌇","🌉","🌁","🌫","⛈️","🌩","🌨","🌧","🌦","🌤","☀️","🌈","💧","🌊","🔱","⚜️","🏴","🖤","💀","☠️","🕷","🦇","🧿","🔮","💎","🗝","⚰️","🕯","🌹","🥀","🍄","🌑","👁","🌀","♾️","⚡","🌪","🔥","💀","🦂","🐍","🌙","🖤","🔮","💀","⚰️","🕯","🧛","🧟","👻","💀","🕳","🌑"],
  "💪 Fitness": ["💪","🏋️","🤸","⛹️","🏊","🚴","🧗","🤼","🤺","🏇","🥇","🏆","🎽","🥊","🥋","🎿","⛷️","🏂","🪂","🏋️‍♂️","🤼‍♂️","🤾","🏌️","🧘","🤾‍♀️","🏄","🚵","🤽","🤹","🩰","🏅","🎖️","🥈","🥉","🥅","⛳","🏹","🎣","🤿","🎽","🛷","🏒","🏑","🏏","⛸️","🥌","🎯","🎱","🏸","🏓","🥏"],
  "💄 Grooming": ["💄","💅","👄","💋","🪥","🧴","🧷","🪒","💈","🛁","🚿","🪞","🧼","🧹","🧺","🧻","🪣","🧽","🪟","🛏","🛋","🚽","🚪","🔑","🪑","🖼","🪣","💊","🩺","🩹","💉","🩸","🧬","🦷","💊","🩺","💅","💇","💆","🧖","🛀","🧘"],
};

export default function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(Object.keys(EMOJI_DATA)[0]);
  const [custom, setCustom] = useState([]);
  const [search, setSearch] = useState("");
  const ref = useRef();

  useEffect(() => {
    fetch(`${API}/emojis`).then(r=>r.json()).then(setCustom).catch(()=>{});
  }, [open]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allEmojis = Object.values(EMOJI_DATA).flat();
  const filtered = search ? allEmojis.filter(e => e.includes(search)) : null;

  return (
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <button type="button" onClick={()=>setOpen(!open)} style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:"5px 10px",cursor:"pointer",fontSize:16}}>😀</button>
      {open && (
        <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:0,background:"#141414",border:"1px solid #222",borderRadius:10,width:340,maxHeight:400,display:"flex",flexDirection:"column",zIndex:600,boxShadow:"0 -8px 32px rgba(0,0,0,.8)"}}>
          <div style={{padding:"8px 8px 0",borderBottom:"1px solid #1e1e1e"}}>
            <input placeholder="Search emoji…" value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"5px 8px",fontSize:12,background:"#0d0d0d",border:"1px solid #222",borderRadius:4,color:"#ccc",width:"100%",marginBottom:6}} />
            {!search && (
              <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:6}}>
                {["Custom",...Object.keys(EMOJI_DATA)].map(k=>(
                  <button key={k} type="button" onClick={()=>setTab(k)} style={{flexShrink:0,padding:"3px 8px",borderRadius:3,background:tab===k?"#c0392b":"#1a1a1a",border:"none",color:"#ccc",fontSize:10,cursor:"pointer",whiteSpace:"nowrap"}}>{k.split(" ")[0]}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{overflowY:"auto",padding:8,display:"flex",flexWrap:"wrap",gap:3}}>
            {filtered ? filtered.map((e,i)=>(
              <button key={i} type="button" onClick={()=>{onSelect(e);setOpen(false);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:2,borderRadius:4,lineHeight:1}}>{e}</button>
            )) : tab==="Custom" ? (
              custom.length ? custom.map(e=>(
                <button key={e.id} type="button" onClick={()=>{onSelect(`:${e.name}:`);setOpen(false);}} title={`:${e.name}:`} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                  <img src={e.url} alt={e.name} style={{width:28,height:28,objectFit:"contain"}} />
                </button>
              )) : <div style={{color:"#444",fontSize:12,padding:"20px 0",width:"100%",textAlign:"center"}}>No custom emojis yet</div>
            ) : (EMOJI_DATA[tab]||[]).map((e,i)=>(
              <button key={i} type="button" onClick={()=>{onSelect(e);setOpen(false);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:2,borderRadius:4,lineHeight:1}}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
