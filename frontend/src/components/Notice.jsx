// Message inside a form or card. tone: "success" | "error" | "warning".
export default function Notice({ tone, children }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
