import { useRef } from "react";

const MIN_DISTANCE = 50;

// Touch handlers for a horizontal swipe: finger moving left -> onSwipeLeft, right -> onSwipeRight.
// Mostly vertical moves (scrolling) are ignored.
export function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const start = useRef(null);

  return {
    onTouchStart: (event) => {
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event) => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
  };
}
