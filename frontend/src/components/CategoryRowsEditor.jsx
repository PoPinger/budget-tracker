import { Plus, X } from "lucide-react";
import { formatMoney } from "../utils/format";
import AmountInput from "./AmountInput";
import Notice from "./Notice";

// Editable category rows (name, limit, "Wydatek cykliczny"), "Dodaj kategorię" and the limits total.
// Used by the setup wizard and the "Kategorie" sheet. onChange(key, field, value), onRemove(row).
export default function CategoryRowsEditor({ rows, onChange, onAdd, onRemove, limitsTotal, budget }) {
  const overBudget = limitsTotal > budget ? limitsTotal - budget : 0;

  return (
    <>
      <ul className="setup-categories">
        {rows.map((row, index) => (
          <li key={row.key} className="setup-category">
            <div className="setup-category-fields">
              <div className="field">
                <label htmlFor={`cat-name-${row.key}`}>Nazwa</label>
                <input
                  id={`cat-name-${row.key}`}
                  className="input input-lg"
                  type="text"
                  placeholder="np. Jedzenie"
                  value={row.name}
                  onChange={(event) => onChange(row.key, "name", event.target.value)}
                />
              </div>
              <AmountInput
                id={`cat-limit-${row.key}`}
                label="Limit"
                value={row.limit}
                onChange={(value) => onChange(row.key, "limit", value)}
              />
            </div>
            <div className="setup-category-foot">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={row.isRecurring}
                  onChange={(event) => onChange(row.key, "isRecurring", event.target.checked)}
                />
                Wydatek cykliczny
              </label>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Usuń kategorię ${row.name || index + 1}`}
                onClick={() => onRemove(row)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" className="btn btn-secondary btn-block" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" />
        Dodaj kategorię
      </button>

      <div className="setup-total">
        <span className="muted">Suma limitów</span>
        <b>
          {formatMoney(limitsTotal)} <span className="muted">/ {formatMoney(budget)}</span>
        </b>
      </div>
      {overBudget > 0 && (
        <Notice tone="warning">
          <span aria-hidden="true">▲ </span>
          Limity przekraczają budżet o {formatMoney(overBudget)}.
        </Notice>
      )}
    </>
  );
}
