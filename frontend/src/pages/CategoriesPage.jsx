import { useMemo } from "react";
import Notice from "../components/Notice";
import Panel, { PanelHeader } from "../components/Panel";
import { getSpentForCategory } from "../utils/budget";

export default function CategoriesPage({ form, data, selectedMonth, formMessage }) {
  const { categories, expenses, loadingCategories, categoriesError, loadCategories } = data;

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.month === selectedMonth),
    [categories, selectedMonth],
  );

  return (
    <section className="content-grid">
      <Panel>
        <h2>{form.editingCategoryId !== null ? "Zarządzaj kategoriami" : "Dodaj kategorię"}</h2>

        <form onSubmit={form.handleCreateCategory} className="form-stack">
          <label className="form-label">
            Miesiąc
            <input className="input" type="date" value={form.month} onChange={(e) => form.setMonth(e.target.value)} required />
          </label>

          <label className="form-label">
            Nazwa kategorii
            <input
              className="input"
              type="text"
              placeholder="Np. Jedzenie"
              value={form.categoryName}
              onChange={(e) => form.setCategoryName(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Limit
            <input
              className="input"
              type="number"
              min="1"
              step="0.01"
              placeholder="Np. 500"
              value={form.limitAmount}
              onChange={(e) => form.setLimitAmount(e.target.value)}
              required
            />
          </label>

          {formMessage && (
            <Notice tone={formMessage.toLowerCase().includes("dodana") ? "success" : "error"}>
              {formMessage}
            </Notice>
          )}

          <button className="primary-btn" type="submit">
            Dodaj kategorię
          </button>
        </form>

        {form.editingCategoryId !== null && (
          <>
            <div className="divider" />
            <h3>Edytuj kategorię</h3>

            <form onSubmit={form.handleUpdateCategory} className="form-stack">
              <label className="form-label">
                Miesiąc
                <input
                  className="input"
                  type="date"
                  value={form.editingCategoryMonth}
                  onChange={(e) => form.setEditingCategoryMonth(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Nazwa
                <input
                  className="input"
                  type="text"
                  value={form.editingCategoryName}
                  onChange={(e) => form.setEditingCategoryName(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Limit
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.editingCategoryLimit}
                  onChange={(e) => form.setEditingCategoryLimit(e.target.value)}
                  required
                />
              </label>

              <div className="button-row">
                <button className="primary-btn" type="submit">
                  Zapisz kategorię
                </button>
                <button className="secondary-btn" type="button" onClick={form.cancelCategoryEdit}>
                  Anuluj
                </button>
              </div>
            </form>
          </>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Moje kategorie"
          action={
            <button className="primary-btn" onClick={loadCategories}>
              Odśwież
            </button>
          }
        />

        {loadingCategories && <p className="muted">Ładowanie kategorii...</p>}
        {categoriesError && <Notice tone="error">{categoriesError}</Notice>}
        {!loadingCategories && !categoriesError && filteredCategories.length === 0 && (
          <p className="muted">Brak kategorii dla wybranego miesiąca.</p>
        )}

        {!loadingCategories && !categoriesError && filteredCategories.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Miesiąc</th>
                  <th>Nazwa</th>
                  <th>Limit</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const categorySpent = getSpentForCategory(expenses, selectedMonth, category.id);
                  const categoryLimit = Number(category.limit_amount || 0);
                  const exceeded = categorySpent > categoryLimit;

                  return (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>{category.month}</td>
                      <td>{category.name}</td>
                      <td className={exceeded ? "danger-text semibold" : ""}>{category.limit_amount}</td>
                      <td>
                        <div className="actions-inline">
                          <button className="edit-btn" onClick={() => form.startCategoryEdit(category)}>
                            Edytuj
                          </button>
                          <button className="danger-btn" onClick={() => form.handleDeleteCategory(category.id)}>
                            Usuń
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </section>
  );
}
