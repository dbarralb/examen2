export function NTimer({ seconds = 0, urgent = false }) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");

  return <div className={`n-timer ${urgent ? "n-timer-urgent" : ""}`}>{minutes}:{rest}</div>;
}
