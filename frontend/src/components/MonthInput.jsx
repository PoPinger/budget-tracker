// Native month field that stores the 1st of the month ("YYYY-MM-01").
export default function MonthInput({ id, value, onChange }) {
  return (
    <input
      id={id}
      className="input"
      type="month"
      value={String(value || "").slice(0, 7)}
      onChange={(e) => onChange(e.target.value ? `${e.target.value}-01` : "")}
      required
    />
  );
}
