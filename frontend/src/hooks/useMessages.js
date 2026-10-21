import { useState } from "react";

// Page banner under the header (success after saving, errors from list actions).
// Errors inside a sheet are kept by that sheet's hook.
export function useMessages() {
  const [message, setMessage] = useState(null);

  // tone: "success" | "error"
  const showMessage = (text, tone = "success") => setMessage({ text, tone });
  const clearMessages = () => setMessage(null);

  return { message, showMessage, clearMessages };
}
