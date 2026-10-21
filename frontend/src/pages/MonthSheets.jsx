import { Pencil, Plus, Trash2 } from "lucide-react";
import AmountInput from "../components/AmountInput";
import BottomSheet from "../components/BottomSheet";
import CategoryRowsEditor from "../components/CategoryRowsEditor";
import Notice from "../components/Notice";
import { formatDate, formatMoney, formatMonthName } from "../utils/format";

function SheetFooter({ onCancel, saving, label, savingLabel = "Zapisywanie..." }) {
  return (
    <>
      <button type="button" className="btn btn-secondary btn-lg" onClick={onCancel}>
        Anuluj
      </button>
      <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
        {saving ? savingLabel : label}
      </button>
    </>
  );
}

function DateField({ id, label, value, onChange, month }) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input input-lg"
        type="date"
        min={month}
        max={`${month.slice(0, 8)}${String(lastDay).padStart(2, "0")}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function IncomesSheet({ form, data, totals, onClose }) {
  return (
    <BottomSheet
      title="Przychody"
      onClose={onClose}
      onSubmit={form.saveSalary}
      footer={<SheetFooter onCancel={onClose} saving={form.saving} label="Zapisz" />}
    >
      <AmountInput id="sheet-salary" label="Wypłata" value={form.salary} onChange={form.setSalary} className="input-amount" />

      <div className="sheet-section">
        <h3 className="sheet-subtitle">Dodatkowe przychody</h3>
        {data.incomes.length === 0 ? (
          <p className="muted">Brak dodatkowych przychodów w tym miesiącu.</p>
        ) : (
          <ul className="mini-list">
            {data.incomes.map((income) => (
              <li key={income.id} className="mini-row">
                <span className="mini-main">
                  <span className="mini-name">{income.name}</span>
                  <span className="mini-meta">{formatDate(income.income_date)}</span>
                </span>
                <span className="mini-amount positive">+{formatMoney(income.amount)}</span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Edytuj przychód ${income.name}`}
                  onClick={() => form.openEditIncome(income)}
                >
                  <Pencil size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  aria-label={`Usuń przychód ${income.name}`}
                  onClick={() => form.removeIncome(income)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="btn btn-secondary btn-block btn-lg" onClick={form.openAddIncome}>
        <Plus size={16} aria-hidden="true" />
        Dodaj przychód
      </button>

      <div className="sheet-total">
        <span>Przychody razem</span>
        <span className="positive">{formatMoney(totals.totalIncome)}</span>
      </div>
      {form.salaryError && <Notice tone="error">{form.salaryError}</Notice>}
    </BottomSheet>
  );
}

function IncomeSheet({ form, totals, selectedMonth }) {
  const editing = Boolean(form.editingId);
  return (
    <BottomSheet
      title={editing ? "Edytuj przychód" : "Dodaj przychód"}
      onClose={form.backToIncomes}
      onSubmit={form.saveIncome}
      footer={
        <SheetFooter onCancel={form.backToIncomes} saving={form.saving} label={editing ? "Zapisz" : "Dodaj przychód"} />
      }
    >
      <div className="field">
        <label htmlFor="income-name">Nazwa</label>
        <input
          id="income-name"
          className="input input-lg"
          type="text"
          placeholder="np. Premia"
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
        />
      </div>
      <AmountInput id="income-amount" label="Kwota" value={form.amount} onChange={form.setAmount} className="input-amount" />
      <DateField id="income-date" label="Data" value={form.date} onChange={form.setDate} month={selectedMonth} />
      {!editing && (
        <p className="sheet-note">Przychody razem przed dodaniem: {formatMoney(totals.totalIncome)}</p>
      )}
      {form.error && <Notice tone="error">{form.error}</Notice>}
    </BottomSheet>
  );
}

function BudgetSheet({ form, totals, selectedMonth, onClose }) {
  const budget = Number.isNaN(form.value) ? 0 : form.value;
  const goal = totals.totalIncome - budget;
  return (
    <BottomSheet
      title="Edytuj budżet"
      onClose={onClose}
      onSubmit={form.save}
      footer={<SheetFooter onCancel={onClose} saving={form.saving} label="Zapisz" />}
    >
      <AmountInput
        id="sheet-budget"
        label={`Budżet na ${formatMonthName(selectedMonth).toLowerCase()}`}
        value={form.amount}
        onChange={form.setAmount}
        className="input-amount"
      />
      <p className="sheet-note">
        Przychody {formatMoney(totals.totalIncome)} → cel oszczędnościowy{" "}
        <b className={goal < 0 ? "exceeded-text" : "positive"}>{formatMoney(goal)}</b>. Limity kategorii:{" "}
        {formatMoney(totals.limitsTotal)}.
      </p>
      {goal < 0 && (
        <Notice tone="warning">
          <span aria-hidden="true">▲ </span>
          Budżet przekracza przychody o {formatMoney(-goal)} – cel oszczędnościowy będzie ujemny
        </Notice>
      )}
      {budget > 0 && totals.limitsTotal > budget && (
        <Notice tone="warning">
          <span aria-hidden="true">▲ </span>
          Limity kategorii przekraczają budżet o {formatMoney(totals.limitsTotal - budget)}.
        </Notice>
      )}
      {form.error && <Notice tone="error">{form.error}</Notice>}
    </BottomSheet>
  );
}

function CategoriesSheet({ form, totals, onClose }) {
  return (
    <BottomSheet
      title="Kategorie"
      onClose={onClose}
      onSubmit={form.save}
      footer={<SheetFooter onCancel={onClose} saving={form.saving} label="Zapisz" />}
    >
      <p className="sheet-note">Wydatek cykliczny jest dodawany automatycznie w wysokości limitu.</p>
      <CategoryRowsEditor
        rows={form.rows}
        onChange={form.updateRow}
        onAdd={form.addRow}
        onRemove={form.removeRow}
        limitsTotal={form.limitsTotal}
        budget={totals.budget}
      />
      {form.error && <Notice tone="error">{form.error}</Notice>}
    </BottomSheet>
  );
}

function ExpenseSheet({ form, monthCategories, selectedMonth, onClose }) {
  const editing = Boolean(form.editingId);
  // Recurring categories already hold their full limit; they are offered only if the expense is in one.
  const options = monthCategories.filter(
    (category) => !category.is_recurring || String(category.id) === form.categoryId,
  );

  return (
    <BottomSheet
      title={editing ? "Edytuj wydatek" : "Dodaj wydatek"}
      onClose={onClose}
      onSubmit={form.save}
      footer={<SheetFooter onCancel={onClose} saving={form.saving} label={editing ? "Zapisz" : "Dodaj wydatek"} />}
    >
      <div className="field">
        <label htmlFor="expense-name">Nazwa</label>
        <input
          id="expense-name"
          className="input input-lg"
          type="text"
          placeholder="np. Zakupy"
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
        />
      </div>
      <AmountInput id="expense-amount" label="Kwota" value={form.amount} onChange={form.setAmount} className="input-amount" />
      <div className="field-row">
        <div className="field">
          <label htmlFor="expense-category">Kategoria</label>
          <select
            id="expense-category"
            className="input input-lg"
            value={form.categoryId}
            onChange={(event) => form.setCategoryId(event.target.value)}
          >
            <option value="">Wybierz</option>
            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <DateField id="expense-date" label="Data" value={form.date} onChange={form.setDate} month={selectedMonth} />
      </div>
      <div className="field">
        <label htmlFor="expense-notes">Notatka</label>
        <textarea
          id="expense-notes"
          className="input textarea"
          placeholder="Opcjonalnie"
          value={form.notes}
          onChange={(event) => form.setNotes(event.target.value)}
        />
      </div>
      {form.warning && (
        <Notice tone="warning">
          <span aria-hidden="true">▲ </span>
          {form.warning}
        </Notice>
      )}
      {form.error && <Notice tone="error">{form.error}</Notice>}
      {editing && (
        <button type="button" className="btn btn-danger btn-block btn-lg" onClick={form.remove} disabled={form.saving}>
          <Trash2 size={16} aria-hidden="true" />
          Usuń wydatek
        </button>
      )}
    </BottomSheet>
  );
}

function CloseMonthDialog({ actions, selectedMonth, onClose }) {
  const close = (event) => {
    event.preventDefault();
    actions.close();
  };
  return (
    <BottomSheet
      variant="dialog"
      title={`Zamknąć ${formatMonthName(selectedMonth).toLowerCase()}?`}
      onClose={onClose}
      onSubmit={close}
      footer={
        <SheetFooter onCancel={onClose} saving={actions.busy} label="Zamknij miesiąc" savingLabel="Zamykanie..." />
      }
    >
      <p className="muted">
        Miesiąc stanie się tylko do odczytu i zobaczysz jego podsumowanie. Możesz go później otworzyć ponownie.
      </p>
    </BottomSheet>
  );
}

// The open sheet (one at a time, see useSheets). Each gets its own key so it mounts fresh.
export default function MonthSheets({ sheets, forms, data, totals, monthCategories, selectedMonth }) {
  const onClose = sheets.close;
  switch (sheets.sheet) {
    case "incomes":
      return <IncomesSheet key="incomes" form={forms.income} data={data} totals={totals} onClose={onClose} />;
    case "income":
      return <IncomeSheet key="income" form={forms.income} totals={totals} selectedMonth={selectedMonth} />;
    case "budget":
      return (
        <BudgetSheet key="budget" form={forms.budget} totals={totals} selectedMonth={selectedMonth} onClose={onClose} />
      );
    case "categories":
      return <CategoriesSheet key="categories" form={forms.category} totals={totals} onClose={onClose} />;
    case "expense":
      return (
        <ExpenseSheet
          key="expense"
          form={forms.expense}
          monthCategories={monthCategories}
          selectedMonth={selectedMonth}
          onClose={onClose}
        />
      );
    case "closeMonth":
      return <CloseMonthDialog key="close" actions={forms.month} selectedMonth={selectedMonth} onClose={onClose} />;
    default:
      return null;
  }
}
