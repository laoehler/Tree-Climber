const DAYS = ["M", "T", "W", "R", "F"];
const DAY_LABELS = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  R: "Thursday",
  F: "Friday"
};
const CALENDAR_START = 8 * 60;
const CALENDAR_END = 18 * 60;
const CALENDAR_STEP = 60;
const HOUR_ROW_HEIGHT = 72;
const DAY_HEADER_HEIGHT = 38;
const CALENDAR_BODY_HEIGHT = ((CALENDAR_END - CALENDAR_START) / 60) * HOUR_ROW_HEIGHT;
const MAX_SCHEDULES = 50;

export {
  CALENDAR_BODY_HEIGHT,
  CALENDAR_END,
  CALENDAR_START,
  CALENDAR_STEP,
  DAY_HEADER_HEIGHT,
  DAY_LABELS,
  DAYS,
  HOUR_ROW_HEIGHT,
  MAX_SCHEDULES
};
