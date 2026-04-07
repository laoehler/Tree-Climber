import { e } from "../ui/react.js";
import { Calendar } from "./Calendar.js";
import { ScheduleCard } from "./ScheduleCard.js";

function SchedulesSection(props) {
  const {
    schedules,
    selectedScheduleIndex,
    onSelectSchedule,
    summary,
    selectedSchedule
  } = props;

  return e(
    "section",
    { className: "results" },
    e(
      "div",
      { className: "results__header" },
      e("h2", null, "Schedules"),
      e(
        "div",
        { className: "schedule-controls" },
        e("label", { htmlFor: "schedule-select" }, "Preview schedule"),
        e(
          "select",
          {
            id: "schedule-select",
            value: String(selectedScheduleIndex),
            disabled: !schedules.length,
            onChange: (event) => onSelectSchedule(Number.parseInt(event.target.value, 10))
          },
          schedules.length
            ? schedules.map((schedule, index) =>
                e(
                  "option",
                  { key: index, value: String(index) },
                  `Schedule ${index + 1} (${schedule.length} course${schedule.length === 1 ? "" : "s"})`
                )
              )
            : e("option", { value: "0" }, "No schedules available")
        )
      ),
      e("div", { className: "summary" }, summary)
    ),
    e(Calendar, { schedule: selectedSchedule }),
    e(
      "div",
      { className: "schedules" },
      schedules.length
        ? schedules.map((schedule, index) => e(ScheduleCard, { key: index, schedule, index }))
        : e("p", { className: "summary" }, "No conflict-free schedules matched your selections.")
    )
  );
}

export { SchedulesSection };
