import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "../constants";
import { userInitials } from "../utils/budget";
import NavIcon from "./NavIcon";

// Desktop navigation (hidden below 900 px, where BottomNav takes over).
export default function Sidebar({ activeTab, onNavigate, user, onLogout }) {
  const name = user?.full_name || user?.email || "";

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo" src="/icons/logo-transparent.png" alt="" />
        Budget Tracker
      </div>

      <nav className="sidebar-nav" aria-label="Nawigacja">
        {NAV_ITEMS.map(({ tab, label }) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "nav-item active" : "nav-item"}
            aria-current={activeTab === tab ? "page" : undefined}
            onClick={() => onNavigate(tab)}
          >
            <NavIcon tab={tab} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-row">
          <div className="avatar">{userInitials(name)}</div>
          <div className="user-text">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm logout-btn" onClick={onLogout}>
          <LogOut size={15} aria-hidden="true" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
