export default function AppHeader({ user, onLogout }) {
  return (
    <header className="topbar glass">
      <div>
        <div className="eyebrow">Premium Finance Workspace</div>
        <h1 className="app-title brand">
          <img className="brand-logo" src="/icons/logo-transparent.png" alt="" />
          Budget Tracker
        </h1>
        <p className="app-subtitle">
          Zalogowany użytkownik: <strong>{user?.full_name || user?.email}</strong>
        </p>
      </div>

      <button className="secondary-btn" onClick={onLogout}>
        Wyloguj
      </button>
    </header>
  );
}
