import { e } from "../ui/react.js";
import {
  buildCalendarEventStyle,
  buildCourseLabel,
  formatMeetingLabel
} from "../lib/courseUtils.js";

function CalendarEvent({ course, meeting }) {
  let style = buildCalendarEventStyle(meeting);

  if (!style) {
    style = {
      backgroundColor: "orange",
      border: "2px dashed red"
    };
  }


  if (meeting.courses && meeting.courses.length > 1) {
    const short = (cs) =>
      String(cs)
        .split(":")[0]       
        .split(" ")
        .slice(0, 2)         
        .join(" ");          

    return e(
      "div",
      {
        className: "event conflict",
        style
      },
      e(
        "div",
        { style: { fontWeight: "bold", color: "var(--accent)" } },
        "⚠️ Overlap ⚠️"
      ),
      ...meeting.courses.map((c) =>
        e("div", null, short(c.courseSection))
      )
    );
  }


  const displayCourse = meeting.courses ? meeting.courses[0] : course;

  return e(
    "div",
    {
      className: "event",
      style,
      title: `${buildCourseLabel(displayCourse)} | ${formatMeetingLabel(meeting)}`
    },
    e("strong", null, displayCourse.courseSection),
    e("div", null, meeting.time || "TBA"),
    e("div", null, meeting.room || "")
  );
}

export { CalendarEvent };