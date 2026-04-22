import { CALENDAR_BODY_HEIGHT, DAY_HEADER_HEIGHT, DAY_LABELS, DAYS } from "../lib/constants.js";
import { expandDays } from "../lib/index.js";
import { CalendarEvent } from "./CalendarEvent.jsx";
import { CalendarTimes } from "./CalendarTimes.jsx";

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

export function Calendar({ schedule, selections = [] }) {
  return (
    <div className="calendar">
      <CalendarTimes />
      <div className="calendar__grid">
        {DAYS.map((day) => {
          const dayMeetings = schedule.flatMap((course) =>
            course.meetings
              .filter((meeting) => expandDays(meeting.days).includes(day))
              .map((meeting) => ({
                ...meeting,
                course
              }))
          );

          const mergedMeetings = mergeMeetings(dayMeetings);

          // Build a list of meetings coming from the user's selection list for this day
          const selectionMeetings = selections.flatMap((selection) =>
            (selection.course?.meetings || [])
              .filter((m) => expandDays(m.days).includes(day))
              .map((m) => ({ ...m, course: selection.course }))
          );

          // For each merged meeting, determine if it conflicts with any selection meeting
          mergedMeetings.forEach((meeting) => {
            const conflicts = selectionMeetings.filter((sel) => {
              // skip if same course is part of this merged meeting
              if (meeting.courses && meeting.courses.some((c) => c.crn === sel.course?.crn)) return false;

              if (!meeting.range || !sel.range) return false;

              return meeting.range.start < sel.range.end && sel.range.start < meeting.range.end;
            });

            meeting.conflictingSelections = conflicts.map((c) => c.course).filter(Boolean);
            meeting.conflictWithSelections = meeting.conflictingSelections.length > 0;
          });

          return (
            <div key={day} className="calendar__column">
              <div
                className="calendar__day"
                style={{ height: `${DAY_HEADER_HEIGHT}px` }}
              >
                {DAY_LABELS[day]}
              </div>
              <div
                className="calendar__events"
                style={{ height: `${CALENDAR_BODY_HEIGHT}px` }}
              >
                {mergedMeetings.map((meeting, index) => (
                  <CalendarEvent
                    key={`merged-${day}-${index}`}
                    meeting={meeting}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
