import {
  CALENDAR_BODY_HEIGHT,
  CALENDAR_END,
  CALENDAR_START,
  DAYS,
  MAX_SCHEDULES
} from "./constants.js";
import { baseCourse } from "./coursePresentation.js";
import { normalize } from "./text.js";

/**
 * Expands compact weekday strings like `MWF` into individual day tokens.
 *
 * @param {string} days
 * @returns {Array<string>}
 */
export const expandDays = (days) =>
  days && normalize(days) !== "tba" ? DAYS.filter((day) => String(days).includes(day)) : [];

/**
 * Returns whether two meetings overlap on any shared day.
 *
 * @param {{days: string, range?: {start: number, end: number}}} meetingA
 * @param {{days: string, range?: {start: number, end: number}}} meetingB
 * @returns {boolean}
 */
export const meetingsConflict = (meetingA, meetingB) => {
  const sharedDays = expandDays(meetingA.days).filter((day) => expandDays(meetingB.days).includes(day));
  if (!sharedDays.length) return false;
  if (!meetingA.range || !meetingB.range) return false;

  return meetingA.range.start < meetingB.range.end && meetingB.range.start < meetingA.range.end;
};

/**
 * Returns whether two course options cannot coexist in one schedule.
 *
 * @param {{courseSection: string, meetings: Array<object>}} courseA
 * @param {{courseSection: string, meetings: Array<object>}} courseB
 * @returns {boolean}
 */
export const conflictBetween = (courseA, courseB) => {
  if (baseCourse(courseA.courseSection) === baseCourse(courseB.courseSection)) return true;

  return courseA.meetings.some((meetingA) =>
    courseB.meetings.some((meetingB) => meetingsConflict(meetingA, meetingB))
  );
};

const hasConflict = (schedule, course) =>
  schedule.some((existingCourse) => conflictBetween(existingCourse, course));

/**
 * Builds and ranks conflict-free schedules from the current matched selections.
 *
 * @param {Array<{selection: object, matches: Array<object>}>} results
 * @returns {Array<Array<object>>}
 */
export const buildRankedSchedules = (results) => {
  if (!results.length) return [];

  const validResults = results.filter((result) => result.matches.length > 0);
  if (!validResults.length) return [];

  const schedules = [];

  const dfs = (index, currentSchedule) => {
    if (schedules.length >= MAX_SCHEDULES) return;

    if (index === validResults.length) {
      schedules.push([...currentSchedule]);
      return;
    }

    const currentResult = validResults[index];
    let foundCompatible = false;

    for (const course of currentResult.matches) {
      if (!hasConflict(currentSchedule, course)) {
        foundCompatible = true;
        currentSchedule.push(course);
        dfs(index + 1, currentSchedule);
        currentSchedule.pop();
      }
    }

    if (!foundCompatible) {
      dfs(index + 1, currentSchedule);
    }
  };

  dfs(0, []);

  return schedules.sort((scheduleA, scheduleB) => {
    if (scheduleB.length !== scheduleA.length) return scheduleB.length - scheduleA.length;

    const aMeetingCount = scheduleA.reduce((count, course) => count + course.meetings.length, 0);
    const bMeetingCount = scheduleB.reduce((count, course) => count + course.meetings.length, 0);
    return aMeetingCount - bMeetingCount;
  });
};

/**
 * Calculates the vertical placement of a meeting card on the weekly calendar.
 *
 * @param {{range?: {start: number, end: number}}} meeting
 * @returns {{top: string, height: string} | null}
 */
export const buildCalendarEventStyle = (meeting) => {
  if (!meeting.range) return null;

  const totalMinutes = CALENDAR_END - CALENDAR_START;
  const start = Math.max(meeting.range.start, CALENDAR_START);
  const end = Math.min(meeting.range.end, CALENDAR_END);
  if (end <= start) return null;

  const top = ((start - CALENDAR_START) / totalMinutes) * CALENDAR_BODY_HEIGHT;
  const height = ((end - start) / totalMinutes) * CALENDAR_BODY_HEIGHT;

  return {
    top: `${top}px`,
    height: `${height}px`
  };
};
