// Card on the surface color.
export default function Panel({ children, className = "", ref, ...props }) {
  return (
    <section ref={ref} className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}

// Card title row; `action` is optional (e.g. a link or a refresh button).
export function PanelHeader({ title, action }) {
  return (
    <div className="card-head">
      <h2 className="card-title">{title}</h2>
      {action}
    </div>
  );
}
