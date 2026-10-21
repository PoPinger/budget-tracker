import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

// Bottom sheet on mobile, centered dialog on desktop (>= 900 px); variant "dialog" is centered everywhere.
// With onSubmit the body and footer are one form (Enter submits). Escape and the backdrop close it.
export default function BottomSheet({ title, onClose, onSubmit, footer, children, variant = "sheet" }) {
  const titleId = useId();
  const panelRef = useRef(null);
  // Latest onClose without re-running the effect (it would move focus away from the inputs).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("sheet-open");
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("sheet-open");
    };
  }, []);

  const Body = onSubmit ? "form" : "div";

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`sheet sheet-${variant}`}
        role={variant === "dialog" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {variant === "sheet" && <div className="sheet-grabber" aria-hidden="true" />}
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          {variant === "sheet" && (
            <button type="button" className="icon-btn" aria-label="Zamknij" onClick={onClose}>
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        <Body className="sheet-form" onSubmit={onSubmit} noValidate={onSubmit ? true : undefined}>
          <div className="sheet-body">{children}</div>
          {footer && <div className="sheet-foot">{footer}</div>}
        </Body>
      </div>
    </>
  );
}
