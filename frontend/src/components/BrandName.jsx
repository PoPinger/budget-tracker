// "Budget Tracker" in two tones; `shimmer` adds the loader's sweeping highlight.
export default function BrandName({ className = "", shimmer = false }) {
  const classes = ["brand-name", shimmer && "brand-name-shimmer", className].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      <span className="brand-name-main">Budget</span> <span className="brand-name-sub">Tracker</span>
    </span>
  );
}
