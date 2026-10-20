import { useEffect, useRef } from "react";

// Scrolls `ref` into view and focuses its first field whenever `trigger` changes to a truthy value
// (not on mount, so returning to a tab does not jump around).
export function useScrollIntoView(trigger) {
  const ref = useRef(null);
  const previous = useRef(trigger);

  useEffect(() => {
    if (trigger && trigger !== previous.current && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      ref.current.querySelector("input, select, textarea")?.focus({ preventScroll: true });
    }
    previous.current = trigger;
  }, [trigger]);

  return ref;
}
