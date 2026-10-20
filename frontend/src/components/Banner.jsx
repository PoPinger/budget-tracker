// Page-level message under the header. tone: "success" | "error".
export default function Banner({ tone, children }) {
  return (
    <div className={`notice notice-${tone} banner`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
