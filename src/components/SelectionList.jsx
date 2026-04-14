import { getSelectionDisplayCourse } from "../lib/courseUtils.js";

function formatTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "";

  if (!timeStr.includes("–") && !timeStr.includes("-")) return timeStr;

  const parts = timeStr.split(/–|-/);
  if (parts.length !== 2) return timeStr;

  const [start, end] = parts.map(t => t.trim());

  function formatOne(t, includeAmPm) {
    if (!t) return "";
  
    let ampm = "";
    if (t.toLowerCase().includes("am")) ampm = "AM";
    if (t.toLowerCase().includes("pm")) ampm = "PM";
  
    const num = t.replace(/am|pm/i, "").trim();
  
    if (num.length !== 4) return t;
  
    let hour = num.slice(0, 2);
    const minute = num.slice(2, 4);
  
    hour = String(parseInt(hour, 10));
  
    return `${hour}:${minute}${includeAmPm && ampm ? " " + ampm : ""}`;
  }

  const formattedStart = formatOne(start, false);
  const formattedEnd = formatOne(end, true);

  return `${formattedStart} – ${formattedEnd}`;
}


export function SelectionList({ selections, selectionMatchesById, onRemoveSelection, onReorderSelections }) {
  if (!selections.length) {
    return <p className="summary">No selections yet.</p>;
  }

  return (
    <div className="selection-list">
      {selections.map((selection) => {
        const matches = selectionMatchesById.get(selection.id) || [];
        const displayCourse = getSelectionDisplayCourse(matches, selection.course);

        return (
          <div
            key={selection.id}
            className={`selection-item ${!selection.active ? "inactive" : ""}`}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", String(selection.id));
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              const sourceId = Number(event.dataTransfer.getData("text/plain"));
              const targetId = selection.id;

              if (!sourceId || sourceId === targetId) return;

              const sourceIndex = selections.findIndex((s) => s.id === sourceId);
              const targetIndex = selections.findIndex((s) => s.id === targetId);

              if (sourceIndex === -1 || targetIndex === -1) return;

              const newSelections = [...selections];
              const [moved] = newSelections.splice(sourceIndex, 1);
              newSelections.splice(targetIndex, 0, moved);

              onReorderSelections(newSelections);
            }}
          >
            <div>
              <strong>{displayCourse?.title || selection.displayTitle}</strong>

              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "4px"
                }}
              >
                {!selection.active ? (
                  "Hidden from schedule."
                ) : (
                  (() => {
                    const course = displayCourse || selection.course;
                    const meeting = course?.meetings?.[0];

                    return (
                      <>
                        {course?.courseSection}
                        {meeting ? ` · ${meeting.days} ${formatTime(meeting.time)}` : ""}
                      </>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="selection-actions">
              <button
                type="button"
                className={`pill ${!!selection.active ? "active" : ""}`}
                onClick={() => {
                  const updated = selections.map((s) =>
                    s.id === selection.id ? { ...s, active: !s.active } : s
                  );
                  onReorderSelections(updated);
                }}
              >
                {selection.active ? "Hide" : "Show"}
              </button>

              <button
                type="button"
                className="pill delete"
                onClick={() => onRemoveSelection(selection.id)}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}