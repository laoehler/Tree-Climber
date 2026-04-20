import {
  CALENDAR_BODY_HEIGHT,
  CALENDAR_END,
  CALENDAR_START,
  DAYS,
  MAX_SCHEDULES
} from "./constants.js";

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

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

const parseTimeRange = (time, startTime, endTime) => {
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

const formatMinutes = (minutes) => {
  if (minutes == null) return "TBA";

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${meridiem}`;
};

const expandDays = (days) =>
  days && normalize(days) !== "tba" ? DAYS.filter((day) => String(days).includes(day)) : [];

const baseCourse = (courseSection) => {
  const parts = String(courseSection || "").trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
};

const buildCourseLabel = (course) => `${course.courseSection} - ${course.title}`;

const formatMeetingLabel = (meeting) => {
  const roomLabel = meeting.room ? `, ${meeting.room}` : "";
  return `${meeting.days || "TBA"} ${meeting.time || "TBA"}${roomLabel}`.trim();
};

const buildCourseSearchBlob = (course) =>
  normalize([
    course.crn,
    course.courseSection,
    course.title,
    course.department
  ].filter(Boolean).join(" "));

const uniqueByCrn = (courses) => {
  const seen = new Set();
  return courses.filter((course) => {
    if (seen.has(course.crn)) return false;
    seen.add(course.crn);
    return true;
  });
};

const getSelectionMatches = (catalog, raw) => {
  const needle = normalize(raw);
  if (!needle) return [];

  const exactMatches = [];
  const fuzzyMatches = [];

  catalog.forEach((course) => {
    const normalizedSection = normalize(course.courseSection);
    const normalizedTitle = normalize(course.title);
    const normalizedCrn = normalize(course.crn);

    const isExact =
      normalizedSection === needle ||
      normalizedTitle === needle ||
      normalizedCrn === needle;

    const isFuzzy =
      course.searchBlob.includes(needle) ||
      normalizedSection.startsWith(needle) ||
      normalizedTitle.includes(needle);

    if (isExact) {
      exactMatches.push(course);
    } else if (isFuzzy) {
      fuzzyMatches.push(course);
    }
  });

  return uniqueByCrn([...exactMatches, ...fuzzyMatches]);
};

const meetingsConflict = (meetingA, meetingB) => {
  const sharedDays = expandDays(meetingA.days).filter((day) => expandDays(meetingB.days).includes(day));
  if (!sharedDays.length) return false;
  if (!meetingA.range || !meetingB.range) return false;

  return meetingA.range.start < meetingB.range.end && meetingB.range.start < meetingA.range.end;
};

const conflictBetween = (courseA, courseB) => {
  if (baseCourse(courseA.courseSection) === baseCourse(courseB.courseSection)) return true;

  return courseA.meetings.some((meetingA) =>
    courseB.meetings.some((meetingB) => meetingsConflict(meetingA, meetingB))
  );
};

const hasConflict = (schedule, course) =>
  schedule.some((existingCourse) => conflictBetween(existingCourse, course));

const buildRankedSchedules = (results) => {
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

  return schedules.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;

    const aMeetingCount = a.reduce((count, course) => count + course.meetings.length, 0);
    const bMeetingCount = b.reduce((count, course) => count + course.meetings.length, 0);
    return aMeetingCount - bMeetingCount;
  });
};

const getSelectionDisplayCourse = (matches, fallbackMatch) => matches[0] || fallbackMatch || null;

const buildTrees = (selections, schedule, selectionMatchesById) => {
  const activeSelections = selections.filter((selection) => selection.active);
  if (!activeSelections.length) return [];

  const resolvedSelections = activeSelections.map((selection) => {
    const matches = selectionMatchesById.get(selection.id) || [];
    const scheduledCourse = schedule.find((course) =>
      matches.some((match) => match.crn === course.crn)
    );

    return {
      ...selection,
      resolvedCourse: scheduledCourse || getSelectionDisplayCourse(matches, selection.course)
    };
  });

  const tree = (title, offset, size) => ({
    title,
    choices: Array.from({ length: size }, (_, index) => resolvedSelections[offset + index] || null)
  });

  return [
    tree("Tree 1", 0, 7),
    tree("Tree 2", 1, 7),
    tree("Tree 3", 2, 7),
    tree("Tree 4", 3, 10)
  ];
};

const buildCalendarEventStyle = (meeting) => {
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

export {
  baseCourse,
  buildCalendarEventStyle,
  buildCourseLabel,
  buildCourseSearchBlob,
  buildRankedSchedules,
  buildTrees,
  expandDays,
  formatMeetingLabel,
  formatMinutes,
  getSelectionDisplayCourse,
  getSelectionMatches,
  normalize,
  parseTimeRange
};
