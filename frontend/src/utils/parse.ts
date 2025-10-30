// Parse human duration into minutes.
// Accepted: "90", "1h", "45m", "1h15", "1h15m", "1:15"
export function parseDurationToMinutes(input: string): number | null {
  if (!input) return null;

  // Normalize: lowercase, trim, remove spaces, unify units, allow decimal comma.
  let s = input.trim().toLowerCase();
  s = s.replace(/,/g, ".");        // decimal comma -> dot
  s = s.replace(/\s+/g, "");       // remove spaces
  s = s.replace(/mins?|mn/g, "m"); // "min", "mins", "mn" -> "m"

  // 1) hh:mm (e.g., "1:05")
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

  // 2) "Xh" or "XhYY" or "XhYYm" or "X.Yh" (fractional hours)
  //    Examples: "1h", "1h15", "1h15m", "1.5h", "2h12"
  const mH = /^(\d+(?:\.\d+)?)h(?:(\d{1,2})m?)?$/.exec(s);
  if (mH) {
    const hFloat = parseFloat(mH[1]!);
    const h = Math.floor(hFloat);
    const fracMin = Math.round((hFloat - h) * 60); // 1.5h -> +30 min
    const mFromGroup = mH[2] !== undefined ? parseInt(mH[2], 10) : 0;
    return h * 60 + fracMin + mFromGroup;
  }

  // 3) Minutes only: "90", "90m"
  const mM = /^(\d+)m?$/.exec(s);
  if (mM) return parseInt(mM[1]!, 10);

  return null;
}
