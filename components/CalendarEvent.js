import { e } from "../ui/react.js";
import {
  buildCalendarEventStyle,
  buildCourseLabel,
  formatMeetingLabel
} from "../lib/courseUtils.js";

function CalendarEvent({ course, meeting }) {
  const style = buildCalendarEventStyle(meeting);
  if (!style) return null;

  return e(
    "div",
    {
      className: "event",
      style,
      title: `${buildCourseLabel(course)} | ${formatMeetingLabel(meeting)}`
    },
    e("strong", null, course.courseSection),
    e("div", null, meeting.time || "TBA"),
    e("div", null, meeting.room || "")
  );
}

export { CalendarEvent };
