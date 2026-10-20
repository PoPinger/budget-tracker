import { Pencil, Trash2 } from "lucide-react";

export default function RowActions({ onEdit, onDelete }) {
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}>
        <Pencil size={14} aria-hidden="true" />
        Edytuj
      </button>
      <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
        <Trash2 size={14} aria-hidden="true" />
        Usuń
      </button>
    </>
  );
}
