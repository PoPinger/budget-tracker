// Amount field: text input with inputmode="decimal" (comma accepted, parsed by parseAmount) and a "zł" suffix.
export default function AmountInput({ id, value, onChange, label, autoFocus = false, className = "input-lg" }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="amount-input">
        <input
          id={id}
          className={`input ${className}`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus={autoFocus}
        />
        <span className="amount-suffix" aria-hidden="true">
          zł
        </span>
      </div>
    </div>
  );
}
