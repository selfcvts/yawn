const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function BadgeDisplay({ badges, size = "small" }) {
  if (!badges || badges.length === 0) return null;

  const sizes = {
    small: { height: 20, fontSize: 10, padding: "3px 8px", gap: 3 },
    medium: { height: 28, fontSize: 11, padding: "5px 10px", gap: 4 },
    large: { height: 36, fontSize: 13, padding: "8px 14px", gap: 6 }
  };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {badges.map((badge) => {
        const s = sizes[size];
        const style = {
          display: "inline-flex",
          alignItems: "center",
          gap: s.gap,
          height: s.height,
          padding: s.padding,
          borderRadius: 3,
          fontSize: s.fontSize,
          fontWeight: 600,
          border: `1.5px solid ${badge.border_color || "#000"}`,
          color: badge.text_color || "#fff",
          background: badge.background_image 
            ? `url(${BACKEND_URL}${badge.background_image}) center/cover`
            : badge.background_color || "#DAA520",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap"
        };

        return (
          <div key={badge.id} style={style} title={badge.name}>
            {badge.icon && <span>{badge.icon}</span>}
            <span>{badge.text}</span>
          </div>
        );
      })}
    </div>
  );
}
