/**
 * Extracts the shared course code portion used to identify section families.
 *
 * @param {string} courseSection
 * @returns {string}
 */
export const baseCourse = (courseSection) => {
  const parts = String(courseSection || "").trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
};

/**
 * Builds the tooltip/header label shown for a course.
 *
 * @param {{courseSection: string, title: string}} course
 * @returns {string}
 */
export const buildCourseLabel = (course) => `${course.courseSection} - ${course.title}`;

/**
 * Formats a meeting into the compact label used throughout the UI.
 *
 * @param {{days?: string, time?: string, room?: string}} meeting
 * @returns {string}
 */
export const formatMeetingLabel = (meeting) => {
  const roomLabel = meeting.room ? `, ${meeting.room}` : "";
  return `${meeting.days || "TBA"} ${meeting.time || "TBA"}${roomLabel}`.trim();
};

/**
 * Chooses the best display course for a selection row or tree node.
 *
 * @param {Array<object>} matches
 * @param {object | null} fallbackMatch
 * @returns {object | null}
 */
export const getSelectionDisplayCourse = (matches, fallbackMatch) =>
  matches[0] || fallbackMatch || null;
