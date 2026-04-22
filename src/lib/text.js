/**
 * Normalizes free-form text for matching and duplicate detection.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const normalize = (value) =>
  String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
