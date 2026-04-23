import { formatMeetingLabel } from "../lib/index.js";

export function ScheduleCard({ schedule, index }) {
  const countLabel = schedule.length === 1 ? "1 course" : `${schedule.length} courses`;

  return (
    <article className="schedule-card">
      <h3>{`Schedule ${index + 1} (${countLabel})`}</h3>
      {schedule.map((course) => (
        <div key={course.crn} className="course-row">
          <strong>{course.courseSection}</strong>
          <span>{course.title}</span>
          <span>{`CRN ${course.crn}`}</span>
          <span>{course.meetings.map(formatMeetingLabel).join(" • ") || "Meeting time TBA"}</span>
        </div>
      ))}
    </article>
  );
}
