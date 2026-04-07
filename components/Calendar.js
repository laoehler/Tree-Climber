import { e } from "../ui/react.js";
import { CALENDAR_BODY_HEIGHT, DAY_HEADER_HEIGHT, DAY_LABELS, DAYS } from "../lib/constants.js";
import { expandDays } from "../lib/courseUtils.js";
import { CalendarTimes } from "./CalendarTimes.js";
import { CalendarEvent } from "./CalendarEvent.js";

function Calendar({ schedule }) {
  return e(
    "div",
    { className: "calendar" },
    e(CalendarTimes),
    e(
      "div",
      { className: "calendar__grid" },
      DAYS.map((day) =>
        e(
          "div",
          { key: day, className: "calendar__column" },
          e(
            "div",
            { className: "calendar__day", style: { height: `${DAY_HEADER_HEIGHT}px` } },
            DAY_LABELS[day]
          ),
          e(
            "div",
            { className: "calendar__events", style: { height: `${CALENDAR_BODY_HEIGHT}px` } },
            schedule.flatMap((course) =>
              course.meetings
                .filter((meeting) => expandDays(meeting.days).includes(day))
                .map((meeting, index) =>
                  e(CalendarEvent, {
                    key: `${course.crn}-${day}-${index}`,
                    course,
                    meeting
                  })
                )
            )
          )
        )
      )
    )
  );
}

export { Calendar };
