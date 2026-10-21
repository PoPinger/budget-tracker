import { LayoutGrid, LogOut } from "lucide-react";
import { userInitials } from "../utils/budget";
import BrandName from "./BrandName";

// Desktop navigation (hidden below 900 px). The app has one page: "Mój miesiąc".
export default function Sidebar({ user, onLogout }) {
  const name = user?.full_name || user?.email || "";

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo" src="/icons/logo-transparent.png" alt="" />
        <BrandName />
      </div>

      <nav className="sidebar-nav" aria-label="Nawigacja">
        <button
          type="button"
          className="nav-item active"
          aria-current="page"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <LayoutGrid size={18} strokeWidth={2} aria-hidden="true" />
          Mój miesiąc
        </button>
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
