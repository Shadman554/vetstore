import { useEffect, useRef } from "react";
import { clearAdminSession } from "@/lib/admin-auth";

const INACTIVITY_MS = 30 * 60 * 1000;

export function useInactivityLogout(onLogout: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        clearAdminSession();
        onLogout();
      }, INACTIVITY_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [onLogout]);
}
