export default function StatCard({ label, value, danger = false, children }) {
  return (
    <div className="stat-card glass">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${danger ? "danger-text" : ""}`}>{value}</span>
      {children}
    </div>
  );
}
