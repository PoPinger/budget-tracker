import { Copy, X } from "lucide-react";
import AmountInput from "../components/AmountInput";
import CategoryRowsEditor from "../components/CategoryRowsEditor";
import Notice from "../components/Notice";
import Panel from "../components/Panel";
import Stepper from "../components/Stepper";
import { SETUP_STEPS } from "../hooks/useMonthSetup";
import { formatMoney, formatMonthTitle } from "../utils/format";

function SalaryStep({ setup, monthLabel }) {
  return (
    <>
      <p className="muted">Ile wynosi Twoja wypłata za {monthLabel}? Dodatkowe przychody dodasz później.</p>
      <AmountInput id="setup-salary" label="Wypłata" value={setup.salary} onChange={setup.setSalary} autoFocus />
    </>
  );
}

function BudgetStep({ setup }) {
  const { previous, salaryValue, budgetValue } = setup;
  const overSalary = budgetValue > salaryValue ? budgetValue - salaryValue : 0;

  return (
    <>
      <p className="muted">Ile maksymalnie chcesz wydać w tym miesiącu?</p>
      <AmountInput id="setup-budget" label="Budżet" value={setup.budget} onChange={setup.setBudget} autoFocus />
      {previous?.total_limit != null && (
        <button type="button" className="btn btn-secondary btn-block" onClick={setup.copyPreviousBudget}>
          <Copy size={16} aria-hidden="true" />
          Tak jak w poprzednim miesiącu ({formatMoney(previous.total_limit)})
        </button>
      )}
      {overSalary > 0 && (
        <Notice tone="warning">
          <span aria-hidden="true">▲ </span>
          Budżet przekracza wypłatę o {formatMoney(overSalary)} – cel oszczędnościowy będzie ujemny
        </Notice>
      )}
    </>
  );
}

function CategoriesStep({ setup }) {
  const { rows, previous, limitsTotal, budgetValue } = setup;

  return (
    <>
      <p className="muted">
        Dodaj kategorie z limitami. Wydatek cykliczny (np. czynsz) zostanie od razu dodany w wysokości limitu.
      </p>
      {previous?.categories.length > 0 && (
        <button type="button" className="btn btn-secondary btn-block" onClick={setup.copyPreviousCategories}>
          <Copy size={16} aria-hidden="true" />
          Skopiuj kategorie i limity z poprzedniego miesiąca
        </button>
      )}

      <CategoryRowsEditor
        rows={rows}
        onChange={setup.updateRow}
        onAdd={setup.addRow}
        onRemove={(row) => setup.removeRow(row.key)}
        limitsTotal={limitsTotal}
        budget={budgetValue}
      />
    </>
  );
}

const STEP_COMPONENTS = [SalaryStep, BudgetStep, CategoriesStep];

// Month setup wizard: one step per screen, "Wstecz" / "Dalej" (fixed at the bottom on mobile).
export default function MonthSetupPage({ setup, selectedMonth }) {
  const StepContent = STEP_COMPONENTS[setup.step];
  const isLast = setup.step === SETUP_STEPS.length - 1;
  const monthLabel = formatMonthTitle(selectedMonth).toLowerCase();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isLast) setup.save();
    else setup.next();
  };

  return (
    <Panel className="setup">
      <div className="setup-head">
        <Stepper steps={SETUP_STEPS} current={setup.step} />
        <button type="button" className="icon-btn" aria-label="Zamknij kreator" onClick={setup.cancel}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <h2 className="setup-title">{SETUP_STEPS[setup.step]}</h2>

      <form className="form-stack setup-form" onSubmit={handleSubmit} noValidate>
        <StepContent setup={setup} monthLabel={monthLabel} />
        {setup.stepError && <Notice tone="error">{setup.stepError}</Notice>}

        <div className="setup-actions">
          {setup.step > 0 ? (
            <button type="button" className="btn btn-secondary btn-lg" onClick={setup.back}>
              Wstecz
            </button>
          ) : (
            <button type="button" className="btn btn-secondary btn-lg" onClick={setup.cancel}>
              Anuluj
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-lg" disabled={setup.saving}>
            {isLast ? (setup.saving ? "Zapisywanie..." : "Zapisz") : "Dalej"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
