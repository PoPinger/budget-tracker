// Page-level message under the month picker. tone: "success" | "error".
export default function Banner({ tone, children }) {
  return <div className={`banner ${tone}`}>{children}</div>;
}
