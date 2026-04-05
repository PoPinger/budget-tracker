import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition";

  const activeClass = "bg-indigo-600 text-white";

  return (
    <aside className="w-64 h-screen bg-[#0B0F19] border-r border-gray-800 p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-8 text-white">
        💰 Budget Tracker
      </h1>

      <nav className="flex flex-col gap-2">
        <NavLink to="/" className={({ isActive }) => `${linkClass} ${isActive && activeClass}`}>
          📊 Dashboard
        </NavLink>

        <NavLink to="/budgets" className={({ isActive }) => `${linkClass} ${isActive && activeClass}`}>
          💵 Budgets
        </NavLink>

        <NavLink to="/categories" className={({ isActive }) => `${linkClass} ${isActive && activeClass}`}>
          🏷 Categories
        </NavLink>

        <NavLink to="/expenses" className={({ isActive }) => `${linkClass} ${isActive && activeClass}`}>
          🧾 Expenses
        </NavLink>
      </nav>
    </aside>
  );
}