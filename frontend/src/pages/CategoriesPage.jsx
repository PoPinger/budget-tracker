import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import LimitPill from "../components/LimitPill";
import MonthInput from "../components/MonthInput";
import Notice from "../components/Notice";
import Panel, { PanelHeader } from "../components/Panel";
import ProgressBar from "../components/ProgressBar";
import RowActions from "../components/RowActions";
import { useScrollIntoView } from "../hooks/useScrollIntoView";
import { getSpentForCategory, limitState, usagePercent } from "../utils/budget";
import { formatMoney, formatMonthName } from "../utils/format";

export default function CategoriesPage({ form, data, selectedMonth, formMessage }) {
  const { categories, expenses, loadingCategories, categoriesError, loadCategories } = data;

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.month === selectedMonth),
    [categories, selectedMonth],
  );

  const editRef = useScrollIntoView(form.editingCategoryId);
  const isEditing = form.editingCategoryId !== null;

  return (
    <div className={isEditing ? "split has-edit" : "split"}>
      {isEditing && (
        <Panel className="split-edit card-editing" ref={editRef}>
          <PanelHeader title="Edytuj kategorię" />
          <form onSubmit={form.handleUpdateCategory} className="form-stack">
            <div className="field">
              <label htmlFor="edit-category-name">Nazwa</label>
              <input
                id="edit-category-name"
                className="input"
                type="text"
                value={form.editingCategoryName}
                onChange={(e) => form.setEditingCategoryName(e.target.value)}
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="edit-category-limit">Limit (zł)</label>
                <input
                  id="edit-category-limit"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  value={form.editingCategoryLimit}
                  onChange={(e) => form.setEditingCategoryLimit(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-category-month">Miesiąc</label>
                <MonthInput id="edit-category-month" value={form.editingCategoryMonth} onChange={form.setEditingCategoryMonth} />
              </div>
            </div>
            <div className="button-row">
              <button className="btn btn-primary" type="submit">
                Zapisz kategorię
              </button>
              <button className="btn btn-secondary" type="button" onClick={form.cancelCategoryEdit}>
                Anuluj
              </button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="split-list">
        <PanelHeader
          title={`Kategorie – ${formatMonthName(selectedMonth).toLowerCase()}`}
          action={
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadCategories}>
              <RefreshCw size={14} aria-hidden="true" />
              Odśwież
            </button>
          }
        />

        {loadingCategories && <p className="muted">Ładowanie kategorii...</p>}
        {categoriesError && <Notice tone="error">{categoriesError}</Notice>}
        {!loadingCategories && !categoriesError && filteredCategories.length === 0 && (
          <p className="muted">Brak kategorii w tym miesiącu.</p>
        )}

        {!loadingCategories && !categoriesError && filteredCategories.length > 0 && (
          <div className="item-list">
            {filteredCategories.map((category) => {
              const spent = getSpentForCategory(expenses, selectedMonth, category.id);
              const limit = Number(category.limit_amount || 0);
              const state = limitState(spent, limit);

              return (
                <div key={category.id} className="category-row">
                  <div className="category-main">
                    <div className="usage-top">
                      <span className="usage-name">
                        {category.name}
                        <LimitPill state={state} spent={spent} limit={limit} />
                      </span>
                    </div>
                    <ProgressBar percent={usagePercent(spent, limit)} state={state} label={`${category.name}: wykorzystanie limitu`} />
                    <div className="category-meta muted">
                      Wydano <b className="negative">{formatMoney(spent)}</b> z {formatMoney(limit)}
                    </div>
                  </div>
                  <div className="row-actions">
                    <RowActions
                      onEdit={() => form.startCategoryEdit(category)}
                      onDelete={() => form.handleDeleteCategory(category.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel className="split-add">
        <PanelHeader title="Dodaj kategorię" />
        <form onSubmit={form.handleCreateCategory} className="form-stack">
          <div className="field">
            <label htmlFor="category-name">Nazwa kategorii</label>
            <input
              id="category-name"
              className="input"
              type="text"
              placeholder="Np. Jedzenie"
              value={form.categoryName}
              onChange={(e) => form.setCategoryName(e.target.value)}
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="category-limit">Limit (zł)</label>
              <input
                id="category-limit"
                className="input"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                placeholder="Np. 500"
                value={form.limitAmount}
                onChange={(e) => form.setLimitAmount(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="category-month">Miesiąc</label>
              <MonthInput id="category-month" value={form.month} onChange={form.setMonth} />
            </div>
          </div>

          {formMessage && (
            <Notice tone={formMessage.toLowerCase().includes("dodana") ? "success" : "error"}>
              {formMessage}
            </Notice>
          )}

          <button className="btn btn-primary btn-block" type="submit">
            Dodaj kategorię
          </button>
        </form>
      </Panel>
    </div>
  );
}
