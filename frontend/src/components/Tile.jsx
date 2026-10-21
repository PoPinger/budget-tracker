import { Pencil } from "lucide-react";

// Dashboard tile: label, big value, content below. With onClick the whole tile is a button
// (pencil in the corner when it opens an edit sheet, `editLabel` is its aria-label).
export default function Tile({ label, icon, value, valueClass = "", accent = false, onClick, editLabel, children }) {
  const className = ["tile", accent && "tile-accent", onClick && "tile-button"].filter(Boolean).join(" ");
  const content = (
    <>
      {editLabel && (
        <span className="tile-edit" aria-hidden="true">
          <Pencil size={15} />
        </span>
      )}
      <span className="tile-label">
        {icon}
        {label}
      </span>
      <span className={`tile-value ${valueClass}`}>{value}</span>
      {children}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={editLabel}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}
