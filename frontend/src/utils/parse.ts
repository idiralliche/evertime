// Parse human duration into minutes.
// Accepted: "90", "1h", "45m", "1h15", "1h15m", "1:15"
export function parseDurationToMinutes(input: string): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase().replace(/\s+/g, "");

  // hh:mm (e.g., "1:05", "2:5" still fails due to [0-5]?\d which is fine)
  const mColon = /^(\d+):([0-5]?\d)$/.exec(s);
  if (mColon) {
    const hStr = mColon[1];
    const mStr = mColon[2];
    if (hStr !== undefined && mStr !== undefined) {
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      return h * 60 + m;
    }
  }

  // "1h15", "1h", "90m" (at least one group must exist)
  const mHM = /^(?:(\d+)h)?(?:(\d{1,3})m)?$/.exec(s);
  if (mHM && (mHM[1] !== undefined || mHM[2] !== undefined)) {
    const h = parseInt(mHM[1] ?? "0", 10);
    const m = parseInt(mHM[2] ?? "0", 10);
    return h * 60 + m;
  }

  // Plain minutes: "90"
  if (/^\d+$/.test(s)) return parseInt(s, 10);

  return null;
}
