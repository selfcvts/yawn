export function StatBox({ label, value, highlight = false }) {
  return (
    <div style={{ background: "#171411", border: "1px solid #2e2722", borderRadius: 4, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#5a5450", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 20, fontWeight: 600, color: highlight ? "#c4401f" : "#e8d9c0" }}>
        {value}
      </div>
    </div>
  );
}

export function ProfileStats({ user }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 16 }}>
      <StatBox label="Posts" value={user.posts} />
      <StatBox label="Reputation" value={user.rep} highlight />
      <StatBox label="Streak" value={`${user.streak}d`} />
      <StatBox label="Points" value={user.rep} />
    </div>
  );
}
