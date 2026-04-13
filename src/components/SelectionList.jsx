import { getSelectionDisplayCourse } from "../lib/courseUtils.js";

export function SelectionList({ selections, selectionMatchesById, onRemoveSelection, onReorderSelections }) {
  if (!selections.length) {
    return <p className="summary">No selections yet.</p>;
  }

  return (
    <div className="selection-list">
      {selections.map((selection) => {
        const matches = selectionMatchesById.get(selection.id) || [];
        const displayCourse = getSelectionDisplayCourse(matches, selection.course);
        const countLabel =
          matches.length === 1 ? "1 backend match" : `${matches.length} backend matches`;

        return (
          <div
            key={selection.id}
            className="selection-item"
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
              <strong>{displayCourse?.title || selection.displayTitle || selection.raw}</strong>
              <span style={{ marginLeft: "8px" }}>
                {displayCourse?.courseSection || selection.displaySection || selection.raw}
              </span>
              <span>{countLabel}</span>
            </div>

            <div className="selection-actions">
              <button
                type="button"
                className="pill"
                onClick={() => onRemoveSelection(selection.id)}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
