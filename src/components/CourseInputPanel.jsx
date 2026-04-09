import { SelectionList } from "./SelectionList.jsx";

export function CourseInputPanel({
  inputValue,
  onInputChange,
  onAdd,
  onBuild,
  status,
  suggestions,
  selections,
  selectionMatchesById,
  onRemoveSelection,
  onReorderSelections
}) {
  return (
    <section className="panel">
      <div className="panel__left">
        <label htmlFor="course-input">Add a course</label>
        <div className="input-row">
          <input
            id="course-input"
            list="course-suggestions"
            placeholder="CRN, title, or course section"
            autoComplete="off"
            value={inputValue}
            onInput={(event) => onInputChange(event.target.value)}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAdd();
              }
            }}
          />
          <button type="button" id="add" onClick={onAdd}>
            Add
          </button>
        </div>
        <datalist id="course-suggestions">
          {suggestions.map((s) => (
            <option key={s.label} value={s.value} label={s.label} />
          ))}
        </datalist>
        <div className="panel__actions">
          <button type="button" id="build" onClick={onBuild}>
            Build schedules
          </button>
        </div>
        <div className="status">{status}</div>
        <div className="selections">
          <h2>Selections - Drag and drop to reorder!</h2>
          <SelectionList
            selections={selections}
            selectionMatchesById={selectionMatchesById}
            onRemoveSelection={onRemoveSelection}
            onReorderSelections={onReorderSelections}
          />
        </div>
      </div>
    </section>
  );
}
