/**
 * Formats a Date as an "h:mm AM/PM" label in the venue's timezone
 * (America/Toronto) — deterministic regardless of where the app renders,
 * so SSR and client output match.
 */
const torontoClock = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Toronto",
});

export function formatTorontoClock(d: Date): string {
  // Intl inserts a narrow no-break space before AM/PM — normalize to a
  // plain space so shiftClockLabel's regex still matches.
  return torontoClock.format(d).replace(/[  ]/g, " ");
}

/**
 * Shifts a clock label like "5:42 PM" by deltaMinutes.
 * Returns the input unchanged if it isn't a plain h:mm AM/PM label
 * (e.g. "~6:15 PM" copy strings stay as-is).
 */
export function shiftClockLabel(label: string, deltaMinutes: number): string {
  const m = label.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!m) return label;
  const h12 = parseInt(m[1], 10) % 12;
  const hours = h12 + (m[3] === "PM" ? 12 : 0);
  let total = hours * 60 + parseInt(m[2], 10) + deltaMinutes;
  total = ((total % 1440) + 1440) % 1440;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  const outH = nh % 12 === 0 ? 12 : nh % 12;
  return `${outH}:${String(nm).padStart(2, "0")} ${nh >= 12 ? "PM" : "AM"}`;
}
