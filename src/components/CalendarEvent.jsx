import {
  buildCalendarEventStyle,
  buildCourseLabel,
  formatMeetingLabel
} from "../lib/index.js";

export function CalendarEvent({ course, meeting }) {
  let style = buildCalendarEventStyle(meeting);

  if (!style) {
    style = {
      backgroundColor: "orange",
      border: "2px dashed red"
    };
  }

  if ((meeting.courses && meeting.courses.length > 1) || meeting.conflictWithSelections) {
    const short = (cs) =>
      String(cs)
        .split(":")[0]
        .split(" ")
        .slice(0, 2)
        .join(" ");

    // Decide which courses to list: merged overlapping courses or conflicting selections
    const items = meeting.courses && meeting.courses.length > 1
      ? meeting.courses
      : meeting.conflictingSelections || [];

    return (
      <div className="event conflict" style={style}>
        <div style={{ fontWeight: "bold", color: "var(--accent)" }}>⚠️ Overlap ⚠️</div>
        {items.map((c) => (
          <div key={c.crn}>{short(c.courseSection)}</div>
        ))}
      </div>
    );
  }

  const displayCourse = meeting.courses ? meeting.courses[0] : course;

  return (
    <div
      className="event"
      style={style}
      title={`${buildCourseLabel(displayCourse)} | ${formatMeetingLabel(meeting)}`}
    >
      <strong>{displayCourse.courseSection}</strong>
      <div>{meeting.time || "TBA"}</div>
      <div>{meeting.room || ""}</div>
    </div>
  );
}
