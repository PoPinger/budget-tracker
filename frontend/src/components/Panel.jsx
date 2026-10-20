export default function Panel({ children }) {
  return <div className="panel glass">{children}</div>;
}

// Panel title row; `action` is optional (e.g. a refresh button).
export function PanelHeader({ title, action }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      {action}
    </div>
  );
}
