// state: "ok" (lime) | "warn" (amber) | "exceeded" (red)
export default function ProgressBar({ percent, state = "ok", label }) {
  const width = Math.max(0, Math.min(Number(percent) || 0, 100));
  return (
    <div
      className="track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Number(percent) || 0)}
    >
      <div className={`fill fill-${state}`} style={{ width: `${width}%` }} />
    </div>
  );
}
