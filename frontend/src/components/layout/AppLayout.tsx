import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__brand-title">Budget Tracker</div>
          <div className="sidebar__brand-subtitle">Kontrola miesięcznych wydatków</div>
        </div>

        <nav className="sidebar__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "sidebar__item sidebar__item--active" : "sidebar__item"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/expenses"
            className={({ isActive }) =>
              isActive ? "sidebar__item sidebar__item--active" : "sidebar__item"
            }
          >
            Wydatki
          </NavLink>

          <NavLink
            to="/categories"
            className={({ isActive }) =>
              isActive ? "sidebar__item sidebar__item--active" : "sidebar__item"
            }
          >
            Kategorie
          </NavLink>

          <NavLink
            to="/budget"
            className={({ isActive }) =>
              isActive ? "sidebar__item sidebar__item--active" : "sidebar__item"
            }
          >
            Budżet
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}