import { e } from "../ui/react.js";
import { CALENDAR_BODY_HEIGHT, DAY_HEADER_HEIGHT, DAY_LABELS, DAYS } from "../lib/constants.js";
import { expandDays } from "../lib/courseUtils.js";
import { CalendarTimes } from "./CalendarTimes.js";
import { CalendarEvent } from "./CalendarEvent.js";

function mergeMeetings(meetings) {
  const merged = [];

  meetings.forEach((m) => {
    let found = false;

    for (const existing of merged) {
      const overlap =
        m.range &&
        existing.range &&
        m.range.start < existing.range.end &&
        existing.range.start < m.range.end;

      if (overlap) {
        existing.courses.push(m.course);
        found = true;
        break;
      }
    }

    if (!found) {
      merged.push({
        ...m,
        courses: [m.course]
      });
    }
  });

  return merged;
}

function Calendar({ schedule }) {
  return e(
    "div",
    { className: "calendar" },
    e(CalendarTimes),
    e(
      "div",
      { className: "calendar__grid" },
      DAYS.map((day) => {
        const dayMeetings = schedule.flatMap((course) =>
          course.meetings
            .filter((meeting) => expandDays(meeting.days).includes(day))
            .map((meeting) => ({
              ...meeting,
              course
            }))
        );

        const mergedMeetings = mergeMeetings(dayMeetings);

        return e(
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
            mergedMeetings.map((meeting, index) =>
              e(CalendarEvent, {
                key: `merged-${day}-${index}`,
                meeting
              })
            )
          )
        );
      })
    )
  );
}

export { Calendar };