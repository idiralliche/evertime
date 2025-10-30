// Human-friendly duration formatting for French UI.
export function formatDuration(min?: number | null): string {
  if (min == null || Number.isNaN(min)) return "";
  const total = Math.max(0, Math.round(min)); // clamp & round to integer minutes
  const h = Math.floor(total / 60);
  const m = total % 60;

  // Use non-breaking space to avoid line breaks between number and unit
  const nbsp = "\u00A0";

  if (h === 0) return `${m}${nbsp}min`;      // e.g. "45 min"
  if (m === 0) return `${h}${nbsp}h`;        // e.g. "3 h"
  return `${h}${nbsp}h${nbsp}${m}${nbsp}min`; // e.g. "1 h 15 min"
}
