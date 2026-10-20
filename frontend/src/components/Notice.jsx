// Message inside a form or panel. tone: "success" | "error".
export default function Notice({ tone, children }) {
  return <div className={`notice ${tone}`}>{children}</div>;
}
