import { e } from "../ui/react.js";
import { formatMeetingLabel } from "../lib/courseUtils.js";

function ScheduleCard({ schedule, index }) {
  const countLabel = schedule.length === 1 ? "1 course" : `${schedule.length} courses`;

  return e(
    "article",
    { className: "schedule-card" },
    e("h3", null, `Schedule ${index + 1} (${countLabel})`),
    schedule.map((course) =>
      e(
        "div",
        { key: course.crn, className: "course-row" },
        e("strong", null, course.courseSection),
        e("span", null, course.title),
        e("span", null, `CRN ${course.crn}`),
        e("span", null, course.meetings.map(formatMeetingLabel).join(" • ") || "Meeting time TBA")
      )
    )
  );
}

export { ScheduleCard };
