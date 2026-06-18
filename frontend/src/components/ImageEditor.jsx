import { useState, useRef, useEffect } from "react";

const ICONS = {
  move: "M5 12h14M12 5v14",
  resize: "M4 4h6M4 4v6M4 4l6 6M20 4h-6M20 4v6M20 4l-6 6M4 20h6M4 20v-6M4 20l6-6M20 20h-6M20 20v-6M20 20l-6-6",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 13l4 4L19 7",
};

function Icon({ name, size = 16, style = {} }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

export function ImageEditor({ imageUrl, onSave, onCancel }) {
  const [scale, setScale] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
  }, [imageUrl]);

  useEffect(() => {
    drawCanvas();
  }, [scale, position]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions
    const scaleFactor = scale / 100;
    const width = img.width * scaleFactor;
    const height = img.height * scaleFactor;

    // Draw image
    ctx.drawImage(
      img,
      position.x,
      position.y,
      width,
      height
    );
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#171411",
        border: "1px solid #2e2722",
        borderRadius: 4,
        padding: 20,
        maxWidth: 800,
        width: "100%",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, margin: 0, textTransform: "uppercase" }}>
            Edit Image
          </h3>
          <button onClick={onCancel} style={{ background: "transparent", border: "none", color: "#5a5450", cursor: "pointer" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div style={{
          background: "#0d0c0b",
          border: "1px solid #2e2722",
          borderRadius: 4,
          padding: 16,
          marginBottom: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
          cursor: isDragging ? "grabbing" : "grab",
        }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ maxWidth: "100%" }}
          />
        </div>

        {/* Controls */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Icon name="resize" size={16} style={{ color: "#c4401f" }} />
            <label style={{ fontSize: 12, color: "#5a5450", minWidth: 60 }}>Scale: {scale}%</label>
            <input
              type="range"
              min="10"
              max="200"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#5a5450" }}>
            <div style={{ flex: 1 }}>
              <Icon name="move" size={14} style={{ display: "inline", marginRight: 4 }} />
              Drag image to position
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              color: "#a89a85",
              border: "1px solid #2e2722",
              borderRadius: 3,
              padding: "8px 16px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: "#c4401f",
              color: "#0d0c0b",
              border: "none",
              borderRadius: 3,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Oswald, sans-serif",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="check" size={16} style={{ color: "#0d0c0b" }} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
