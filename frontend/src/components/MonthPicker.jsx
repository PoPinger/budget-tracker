export default function MonthPicker({ value, onChange }) {
  return (
    <section className="month-row">
      <div className="month-card glass">
        <label className="form-label">
          Miesiąc
          <input
            className="input"
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
