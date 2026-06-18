import { useState } from "react";

export function ColorPicker({ onSelect, onClose }) {
  const [selectedColor, setSelectedColor] = useState("#c4401f");
  const [r, setR] = useState(196);
  const [g, setG] = useState(64);
  const [b, setB] = useState(31);
  const [gradientType, setGradientType] = useState("none");
  const [gradientStart, setGradientStart] = useState("#c4401f");
  const [gradientEnd, setGradientEnd] = useState("#f39c12");
  const [gradientAngle, setGradientAngle] = useState(90);

  const presetColors = [
    "#c4401f", "#f39c12", "#e74c3c", "#9b59b6", "#3498db",
    "#1abc9c", "#2ecc71", "#f1c40f", "#e67e22", "#95a5a6",
    "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad",
    "#f39c12", "#d35400", "#c0392b", "#7f8c8d", "#2c3e50"
  ];

  const gradientTypes = [
    { value: "none", label: "Solid Color" },
    { value: "linear", label: "Linear Gradient" },
    { value: "radial", label: "Radial Gradient" },
    { value: "conic", label: "Conic Gradient" },
  ];

  const updateRGB = (newR, newG, newB) => {
    setR(newR);
    setG(newG);
    setB(newB);
    const hex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    setSelectedColor(hex);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    setR(r);
    setG(g);
    setB(b);
  };

  const handleApply = () => {
    if (gradientType === "none") {
      onSelect({
        type: "solid",
        color: selectedColor
      });
    } else {
      let gradient;
      if (gradientType === "linear") {
        gradient = `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
      } else if (gradientType === "radial") {
        gradient = `radial-gradient(circle, ${gradientStart}, ${gradientEnd})`;
      } else if (gradientType === "conic") {
        gradient = `conic-gradient(from ${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
      }
      onSelect({
        type: "gradient",
        gradient: gradient,
        value: `${gradientType}-${gradientStart}-${gradientEnd}-${gradientAngle}`
      });
    }
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      zIndex: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#171411",
        border: "1px solid #2e2722",
        borderRadius: 4,
        padding: 24,
        maxWidth: 500,
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <h3 style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, marginTop: 0, textTransform: "uppercase", marginBottom: 20 }}>
          Color & Gradient Picker
        </h3>

        {/* Gradient Type Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Type
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {gradientTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setGradientType(type.value)}
                style={{
                  background: gradientType === type.value ? "#2e2722" : "transparent",
                  border: `1px solid ${gradientType === type.value ? "#c4401f" : "#2e2722"}`,
                  color: gradientType === type.value ? "#c4401f" : "#a89a85",
                  padding: "8px 12px",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "Oswald, sans-serif",
                  textTransform: "uppercase",
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {gradientType === "none" ? (
          <>
            {/* RGB Sliders */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                RGB Values
              </label>
              
              {/* Red */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#e74c3c" }}>Red</span>
                  <span style={{ fontSize: 12, color: "#e8d9c0", fontFamily: "monospace" }}>{r}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={r}
                  onChange={(e) => updateRGB(Number(e.target.value), g, b)}
                  style={{ width: "100%", accentColor: "#e74c3c" }}
                />
              </div>

              {/* Green */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#2ecc71" }}>Green</span>
                  <span style={{ fontSize: 12, color: "#e8d9c0", fontFamily: "monospace" }}>{g}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={g}
                  onChange={(e) => updateRGB(r, Number(e.target.value), b)}
                  style={{ width: "100%", accentColor: "#2ecc71" }}
                />
              </div>

              {/* Blue */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#3498db" }}>Blue</span>
                  <span style={{ fontSize: 12, color: "#e8d9c0", fontFamily: "monospace" }}>{b}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={b}
                  onChange={(e) => updateRGB(r, g, Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#3498db" }}
                />
              </div>
            </div>

            {/* Color Preview */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Preview
              </label>
              <div style={{
                background: selectedColor,
                height: 60,
                borderRadius: 4,
                border: "1px solid #2e2722",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 14,
                textShadow: "0 0 4px rgba(0,0,0,0.5)",
              }}>
                {selectedColor.toUpperCase()}
              </div>
            </div>

            {/* Preset Colors */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Presets
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
                {presetColors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    style={{
                      background: color,
                      width: "100%",
                      aspectRatio: "1",
                      border: selectedColor === color ? "2px solid #c4401f" : "1px solid #2e2722",
                      borderRadius: 3,
                      cursor: "pointer",
                      padding: 0,
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Gradient Controls */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Start Color
              </label>
              <input
                type="color"
                value={gradientStart}
                onChange={(e) => setGradientStart(e.target.value)}
                style={{ width: "100%", height: 50, border: "1px solid #2e2722", borderRadius: 3, cursor: "pointer" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                End Color
              </label>
              <input
                type="color"
                value={gradientEnd}
                onChange={(e) => setGradientEnd(e.target.value)}
                style={{ width: "100%", height: 50, border: "1px solid #2e2722", borderRadius: 3, cursor: "pointer" }}
              />
            </div>

            {(gradientType === "linear" || gradientType === "conic") && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Angle: {gradientAngle}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            )}

            {/* Gradient Preview */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Preview
              </label>
              <div style={{
                background: gradientType === "linear" 
                  ? `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`
                  : gradientType === "radial"
                  ? `radial-gradient(circle, ${gradientStart}, ${gradientEnd})`
                  : `conic-gradient(from ${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`,
                height: 100,
                borderRadius: 4,
                border: "1px solid #2e2722",
              }} />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "transparent",
              color: "#a89a85",
              border: "1px solid #2e2722",
              borderRadius: 3,
              padding: "10px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 1,
              background: "#c4401f",
              color: "#0d0c0b",
              border: "none",
              borderRadius: 3,
              padding: "10px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Oswald, sans-serif",
              textTransform: "uppercase",
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
