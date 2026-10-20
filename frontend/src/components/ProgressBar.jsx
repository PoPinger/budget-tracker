export default function ProgressBar({ percent, danger }) {
  return (
    <div className="progress-track">
      <div
        className={`progress-fill ${danger ? "danger" : ""}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
