import { normalize } from "./text.js";

const parseClockValue = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;

  const padded = digits.padStart(4, "0");
  const hours = Number.parseInt(padded.slice(0, 2), 10);
  const minutes = Number.parseInt(padded.slice(2, 4), 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const parseTimeToken = (value, meridiemHint) => {
  if (!value) return null;

  const text = String(value).trim().toUpperCase();
  const meridiemMatch = text.match(/(AM|PM)$/);
  const meridiem = meridiemMatch ? meridiemMatch[1] : meridiemHint;
  const digits = text.replace(/[^0-9]/g, "");
  if (!digits) return null;

  let hours;
  let minutes;

  if (digits.length <= 2) {
    hours = Number.parseInt(digits, 10);
    minutes = 0;
  } else if (digits.length === 3) {
    hours = Number.parseInt(digits.slice(0, 1), 10);
    minutes = Number.parseInt(digits.slice(1), 10);
  } else {
    hours = Number.parseInt(digits.slice(0, 2), 10);
    minutes = Number.parseInt(digits.slice(2, 4), 10);
  }

  if ([hours, minutes].some(Number.isNaN)) return null;

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Parses meeting time data from either explicit backend clock fields or a text range.
 *
 * @param {string} time
 * @param {string} startTime
 * @param {string} endTime
 * @returns {{start: number, end: number} | null}
 */
export const parseTimeRange = (time, startTime, endTime) => {
  if (startTime && endTime) {
    return {
      start: parseClockValue(startTime),
      end: parseClockValue(endTime)
    };
  }

  if (!time || normalize(time) === "tba") return null;

  const parts = String(time).trim().toUpperCase().split("-").map((part) => part.trim());
  if (parts.length !== 2) return null;

  const meridiemHint = parts[1].match(/(AM|PM)$/)?.[1] || null;
  const start = parseTimeToken(parts[0], meridiemHint);
  const end = parseTimeToken(parts[1], meridiemHint);

  if (start == null || end == null) return null;
  return { start, end };
};

/**
 * Formats minutes since midnight for the calendar time gutter.
 *
 * @param {number | null} minutes
 * @returns {string}
 */
export const formatMinutes = (minutes) => {
  if (minutes == null) return "TBA";

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${meridiem}`;
};

/**
 * Converts compact meeting time strings into a more readable label.
 *
 * @param {string} timeStr
 * @returns {string}
 */
export const formatDisplayTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return "";
  if (!timeStr.includes("–") && !timeStr.includes("-")) return timeStr;

  const parts = timeStr.split(/–|-/);
  if (parts.length !== 2) return timeStr;

  const [start, end] = parts.map((time) => time.trim());

  const formatOne = (time, includeMeridiem) => {
    if (!time) return "";

    let meridiem = "";
    if (time.toLowerCase().includes("am")) meridiem = "AM";
    if (time.toLowerCase().includes("pm")) meridiem = "PM";

    const numeric = time.replace(/am|pm/i, "").trim();
    if (numeric.length !== 4) return time;

    const hour = String(Number.parseInt(numeric.slice(0, 2), 10));
    const minute = numeric.slice(2, 4);

    return `${hour}:${minute}${includeMeridiem && meridiem ? ` ${meridiem}` : ""}`;
  };

  return `${formatOne(start, false)} – ${formatOne(end, true)}`;
};
