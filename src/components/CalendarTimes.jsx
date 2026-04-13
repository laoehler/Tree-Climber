import {
  CALENDAR_END,
  CALENDAR_START,
  CALENDAR_STEP,
  DAY_HEADER_HEIGHT,
  HOUR_ROW_HEIGHT
} from "../lib/constants.js";
import { formatMinutes } from "../lib/courseUtils.js";

export function CalendarTimes() {
  const labels = [
    <div
      key="spacer"
      className="calendar__time-spacer"
      style={{ height: `${DAY_HEADER_HEIGHT}px` }}
    />
  ];

  for (let minute = CALENDAR_START; minute <= CALENDAR_END; minute += CALENDAR_STEP) {
    labels.push(
      <div
        key={minute}
        className="calendar__time-slot"
        style={{ height: `${HOUR_ROW_HEIGHT}px` }}
      >
        {formatMinutes(minute)}
      </div>
    );
  }

  return <div className="calendar__times">{labels}</div>;
}
