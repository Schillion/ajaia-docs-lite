const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Formats an ISO timestamp as a short relative string, e.g. "5 minutes ago". */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 45) return "just now";

  for (const [unit, secondsInUnit] of UNITS) {
    if (absSeconds >= secondsInUnit) {
      const value = Math.round(seconds / secondsInUnit);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(Math.round(seconds / 60), "minute");
}
