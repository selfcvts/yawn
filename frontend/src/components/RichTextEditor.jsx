import { useState, useRef, useEffect } from "react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const FONTS = [
  "Arial", "Arial Black", "Comic Sans MS", "Courier New", "Georgia", "Impact",
  "Lucida Console", "Palatino", "Tahoma", "Times New Roman", "Trebuchet MS",
  "Verdana", "Helvetica", "Garamond", "Book Antiqua", "Century Gothic",
  "Franklin Gothic Medium", "Monospace", "Cursive", "Fantasy", "System-UI",
  "Oswald", "Inter", "JetBrains Mono", "Roboto", "Open Sans", "Lato",
  "Montserrat", "Raleway", "Ubuntu", "Poppins", "Nunito", "Merriweather",
  "Playfair Display", "Crimson Text", "Libre Baskerville", "Source Sans Pro",
  "PT Serif", "Inconsolata", "Fira Sans", "Noto Sans", "Quicksand",
  "Barlow", "Karla", "Rubik", "Work Sans", "DM Sans", "Space Grotesk",
  "Abril Fatface", "Bebas Neue", "Pacifico", "Righteous", "Satisfy",
  "Architects Daughter", "Dancing Script", "Indie Flower", "Lobster",
  "Permanent Marker", "Shadows Into Light", "Caveat", "Amatic SC",
  "Gloria Hallelujah", "Patrick Hand", "Kalam", "Courgette", "Sacramento",
  "Great Vibes", "Allura", "Tangerine", "Pinyon Script", "Yellowtail",
  "Cookie", "Bad Script", "Marck Script", "Neucha",
  "Comfortaa", "ABeeZee", "Exo", "Cabin", "Fjalla One", "Alfa Slab One",
  "Lilita One", "Monoton", "Black Ops One",
  "Creepster", "Eater", "Nosifer", "Metal Mania", "Rye",
  "Bangers", "Fascinate", "Fontdiner Swanky", "Hanalei Fill",
];

export default function RichTextEditor({ value, onChange, onRichContentChange, placeholder }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const textareaRef = useRef(null);

  const addEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || "";
    const newText = text.substring(0, start) + emoji.native + text.substring(end);
    onChange(newText);
    
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
    }, 10);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ 
        display: "flex", 
        gap: 8, 
        padding: "8px 10px", 
        background: "#171411", 
        border: "1px solid #2e2722", 
        borderBottom: "none",
        borderRadius: "3px 3px 0 0",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <button
          onClick={() => setIsBold(!isBold)}
          style={{
            background: isBold ? "#c4401f" : "transparent",
            color: isBold ? "#0d0c0b" : "#a89a85",
            border: "1px solid #2e2722",
            borderRadius: 3,
            padding: "4px 10px",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: "bold"
          }}
          title="Bold"
        >
          B
        </button>
        
        <button
          onClick={() => setIsItalic(!isItalic)}
          style={{
            background: isItalic ? "#c4401f" : "transparent",
            color: isItalic ? "#0d0c0b" : "#a89a85",
            border: "1px solid #2e2722",
            borderRadius: 3,
            padding: "4px 10px",
            fontSize: 12,
            cursor: "pointer",
            fontStyle: "italic"
          }}
          title="Italic"
        >
          I
        </button>
        
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            background: "transparent",
            color: "#a89a85",
            border: "1px solid #2e2722",
            borderRadius: 3,
            padding: "4px 10px",
            fontSize: 12,
            cursor: "pointer"
          }}
          title="Emojis"
        >
          😀
        </button>
      </div>

      {showEmojiPicker && (
        <div style={{
          position: "absolute",
          top: 50,
          right: 0,
          zIndex: 100,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
        }}>
          <Picker
            data={data}
            onEmojiSelect={addEmoji}
            theme="dark"
            previewPosition="none"
          />
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight: 110,
          background: "#0d0c0b",
          border: "1px solid #2e2722",
          borderTop: "none",
          borderRadius: "0 0 3px 3px",
          padding: "10px 12px",
          color: "#e8d9c0",
          fontSize: 14,
          fontWeight: isBold ? "bold" : "normal",
          fontStyle: isItalic ? "italic" : "normal",
          outline: "none",
          resize: "vertical",
          caretColor: "#c4401f",
        }}
      />
    </div>
  );
}
