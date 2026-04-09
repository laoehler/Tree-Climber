import { Calendar } from "./Calendar.jsx";
import { ScheduleCard } from "./ScheduleCard.jsx";

export function SchedulesSection({
  schedules,
  selectedScheduleIndex,
  onSelectSchedule,
  summary,
  selectedSchedule
}) {
  return (
    <section className="results">
      <div className="results__header">
        <h2>Schedules</h2>
        <div className="schedule-controls">
          <label htmlFor="schedule-select">Preview schedule</label>
          <select
            id="schedule-select"
            value={String(selectedScheduleIndex)}
            disabled={!schedules.length}
            onChange={(event) => onSelectSchedule(Number.parseInt(event.target.value, 10))}
          >
            {schedules.length ? (
              schedules.map((schedule, index) => (
                <option key={index} value={String(index)}>
                  {`Schedule ${index + 1} (${schedule.length} course${schedule.length === 1 ? "" : "s"})`}
                </option>
              ))
            ) : (
              <option value="0">No schedules available</option>
            )}
          </select>
        </div>
        <div className="summary">{summary}</div>
      </div>
      <Calendar schedule={selectedSchedule} />
      <div className="schedules">
        {schedules.length ? (
          schedules.map((schedule, index) => (
            <ScheduleCard key={index} schedule={schedule} index={index} />
          ))
        ) : (
          <p className="summary">No conflict-free schedules matched your selections.</p>
        )}
      </div>
    </section>
  );
}
