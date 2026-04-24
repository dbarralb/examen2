import { useEffect, useRef } from "react";

export function usePollingRefresh({ task, intervalMs = 1000, enabled = true }) {
  const taskRef = useRef(task);
  const inFlightRef = useRef(false);

  taskRef.current = task;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    async function runTask() {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;

      try {
        await taskRef.current?.({
          isCancelled() {
            return cancelled;
          },
        });
      } finally {
        inFlightRef.current = false;
      }
    }

    runTask();
    const timer = window.setInterval(runTask, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs]);
}
