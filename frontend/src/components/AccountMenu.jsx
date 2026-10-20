import { LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { userInitials } from "../utils/budget";

// Mobile: small avatar button with the account and "Wyloguj".
export default function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const name = user?.full_name || user?.email || "";

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        className="avatar avatar-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Konto"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {userInitials(name)}
      </button>
      {open && (
        <div className="account-popover" role="menu">
          <div className="user-name">{user?.full_name}</div>
          <div className="user-email">{user?.email}</div>
          <button type="button" role="menuitem" className="btn btn-secondary btn-sm logout-btn" onClick={onLogout}>
            <LogOut size={15} aria-hidden="true" />
            Wyloguj
          </button>
        </div>
      )}
    </div>
  );
}
