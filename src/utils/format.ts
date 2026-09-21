/**
 * Formats satang (integer) to Thai Baht formatted string.
 * e.g. 15000 -> "150", 15050 -> "150.50"
 */
export function formatSatangToBaht(satang: number): string {
  const baht = satang / 100;
  if (Number.isInteger(baht)) {
    return baht.toLocaleString();
  }
  return baht.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Provides a consistent worker label fallback when display name is not available.
 */
export function formatWorkerFallback(id: string, prefix = "Worker"): string {
  const shortId = id.length > 8 ? id.slice(0, 8) : id;
  return `${prefix} ${shortId}`;
}

/**
 * Safely truncates a text string with an ellipsis if it exceeds maxLength.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Maps quest tags and titles to aesthetic category tones ("green" | "blue" | "purple").
 */
export function getCategoryTone(tag: string): "green" | "blue" | "purple" {
  if (!tag) return "green";
  const lower = tag.toLocaleLowerCase();
  if (
    tag === "Academic" ||
    tag === "วิชาการ" ||
    lower.includes("print") ||
    tag.includes("ถ่าย")
  ) {
    return "blue";
  }
  if (
    tag === "Event" ||
    tag === "กิจกรรม" ||
    lower.includes("design") ||
    tag.includes("ออกแบบ")
  ) {
    return "purple";
  }
  return "green";
}
