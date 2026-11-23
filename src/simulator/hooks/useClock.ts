import { useEffect, useState } from "react";

/** Current time, refreshed on each new minute. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer = 0;
    const schedule = (): void => {
      const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msToNextMinute);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

/** HH:MM, the way a phone status bar shows it. */
export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
