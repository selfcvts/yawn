import { useState, useRef, useEffect } from "react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { ColorPicker } from './ColorPicker';

// Expanded Google Fonts list (50+ fonts)
const GOOGLE_FONTS = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway", "Ubuntu",
  "Poppins", "Nunito", "Merriweather", "Playfair Display", "Crimson Text",
  "Libre Baskerville", "Source Sans Pro", "PT Serif", "Inconsolata", "Fira Sans",
  "Noto Sans", "Quicksand", "Barlow", "Karla", "Rubik", "Work Sans", "DM Sans",
  "Space Grotesk", "Abril Fatface", "Bebas Neue", "Pacifico", "Righteous",
  "Satisfy", "Architects Daughter", "Dancing Script", "Indie Flower", "Lobster",
  "Permanent Marker", "Shadows Into Light", "Caveat", "Amatic SC",
  "Gloria Hallelujah", "Patrick Hand", "Kalam", "Courgette", "Sacramento",
  "Great Vibes", "Allura", "Tangerine", "Pinyon Script", "Yellowtail", "Cookie",
  "Bad Script", "Marck Script", "Neucha", "Comfortaa", "ABeeZee", "Exo", "Cabin",
  "Fjalla One", "Alfa Slab One", "Lilita One", "Monoton", "Black Ops One",
  "Creepster", "Eater", "Nosifer", "Metal Mania", "Rye", "Bangers", "Fascinate",
  "Fontdiner Swanky", "Hanalei Fill", "Press Start 2P", "VT323", "Orbitron",
  "Bungee", "Staatliches", "Anton", "Teko", "Archivo Black", "Passion One",
  "Russo One", "Saira Condensed", "Squada One", "Secular One", "Audiowide",
  "Syne", "Lexend", "Chakra Petch", "Iceland", "Syncopate", "Turret Road",
  "Michroma", "Share Tech Mono", "Rajdhani", "Electrolize", "Saira",
  "Cormorant", "Cinzel", "EB Garamond", "Lora", "Spectral", "Vollkorn",
  "Bitter", "Cardo", "Arvo", "Domine", "Alegreya", "Crete Round",
  "Zilla Slab", "Roboto Slab", "Josefin Slab", "Rokkitt", "Sanchez",
  "Patua One", "Coustard", "Ultra", "Yeseva One", "Fredericka the Great",
  "Poiret One", "Julius Sans One", "Jura", "Philosopher", "Tenor Sans",
  "Heebo", "Almarai", "Cairo", "Tajawal", "Amiri", "Changa", "Aref Ruqaa",
  "Lalezar", "Harmattan", "Reem Kufi", "Scheherazade New", "IBM Plex Sans",
  "IBM Plex Serif", "IBM Plex Mono", "Courier Prime", "Red Hat Display",
  "Red Hat Text", "Manrope", "Inter", "JetBrains Mono", "Outfit", "Sora",
  "Plus Jakarta Sans", "Be Vietnam Pro", "Epilogue", "Space Mono", "Azeret Mono",
  "Overpass", "Overpass Mono", "Chivo", "Frank Ruhl Libre", "Aleo", "Gelasio",
  "Literata", "Newsreader", "Source Serif Pro", "Crimson Pro", "Ovo",
  "Belleza", "Shrikhand", "Righteous", "Bungee Inline", "Modak", "Lobster Two",
  "Paytone One", "Acme", "Archivo Narrow", "Barlow Condensed", "Pathway Gothic One",
  "Yanone Kaffeesatz", "Questrial", "Armata", "Signika", "Cantarell",
  "Assistant", "Varela Round", "Maven Pro", "Hind", "Mukta", "Catamaran",
  "Merriweather Sans", "Exo 2", "Titillium Web", "Dosis", "Oxygen", "Asap",
  "Abel", "Archivo", "Cuprum", "Monda", "Gudea", "Martel", "Yrsa", "Alice",
  "Old Standard TT", "Judson", "Neuton", "Gentium Book Basic", "Fanwood Text",
  "Quando", "Poly", "Kameron", "Podkova", "Copse", "Lusitana", "Adamina",
  "Unna", "Halant", "Trocchi", "Average", "Radley", "Stoke", "Belgrano",
  "Vidaloka", "Cambo", "Enriqueta", "Mate", "Rasa", "Alike", "Prociono",
  "Brawler", "Mate SC", "Lora", "Crimson Text", "Cinzel Decorative"
];

// Load Google Fonts dynamically
const loadGoogleFont = (fontName) => {
  const linkId = `font-${fontName.replace(/\s+/g, '-')}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }
};

export default function RichTextEditor({ value, onChange, onRichContentChange, placeholder }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [textColor, setTextColor] = useState(null);
  const textareaRef = useRef(null);

  // Load default font
  useEffect(() => {
    loadGoogleFont(selectedFont);
  }, [selectedFont]);

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

  const handleColorSelect = (colorData) => {
    setTextColor(colorData);
    setShowColorPicker(false);
    // Update rich content with color info
    if (onRichContentChange) {
      onRichContentChange({
        color: colorData,
        font: selectedFont,
        bold: isBold,
        italic: isItalic
      });
    }
  };

  const handleFontChange = (font) => {
    setSelectedFont(font);
    loadGoogleFont(font);
    setShowFontPicker(false);
    if (onRichContentChange) {
      onRichContentChange({
        color: textColor,
        font: font,
        bold: isBold,
        italic: isItalic
      });
    }
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

        {/* Font Selector Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowFontPicker(!showFontPicker)}
            style={{
              background: "transparent",
              color: "#a89a85",
              border: "1px solid #2e2722",
              borderRadius: 3,
              padding: "4px 10px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "Oswald, sans-serif",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            title="Select Font"
          >
            <span>Font</span>
            <span style={{ fontSize: 8 }}>▼</span>
          </button>

          {showFontPicker && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              background: "#171411",
              border: "1px solid #2e2722",
              borderRadius: 4,
              maxHeight: 300,
              overflowY: "auto",
              zIndex: 100,
              minWidth: 200,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
            }}>
              {GOOGLE_FONTS.map(font => (
                <button
                  key={font}
                  onClick={() => handleFontChange(font)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: selectedFont === font ? "#2e2722" : "transparent",
                    color: selectedFont === font ? "#c4401f" : "#a89a85",
                    border: "none",
                    padding: "8px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: font,
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFont !== font) e.target.style.background = "#0d0c0b";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFont !== font) e.target.style.background = "transparent";
                  }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Picker Button */}
        <button
          onClick={() => setShowColorPicker(true)}
          style={{
            background: textColor ? (textColor.type === "gradient" ? textColor.gradient : textColor.color) : "transparent",
            color: textColor ? "#fff" : "#a89a85",
            border: "1px solid #2e2722",
            borderRadius: 3,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "Oswald, sans-serif",
            textTransform: "uppercase",
            fontWeight: 600
          }}
          title="Text Color & Gradients"
        >
          {textColor ? "●" : "A"}
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

      {showColorPicker && (
        <ColorPicker
          onSelect={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight: 110,
          background: textColor?.type === "gradient" ? textColor.gradient : "#0d0c0b",
          color: textColor?.type === "solid" ? textColor.color : "#e8d9c0",
          border: "1px solid #2e2722",
          borderTop: "none",
          borderRadius: "0 0 3px 3px",
          padding: "10px 12px",
          fontSize: 14,
          fontWeight: isBold ? "bold" : "normal",
          fontStyle: isItalic ? "italic" : "normal",
          fontFamily: selectedFont,
          outline: "none",
          resize: "vertical",
          caretColor: "#c4401f",
        }}
      />
    </div>
  );
}
