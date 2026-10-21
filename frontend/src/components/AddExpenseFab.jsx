import { Plus } from "lucide-react";

// Mobile only: floating lime "+" for adding an expense (bottom-right, respects the safe areas).
export default function AddExpenseFab({ onClick }) {
  return (
    <button type="button" className="fab-float only-mobile" onClick={onClick} aria-label="Dodaj wydatek">
      <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
