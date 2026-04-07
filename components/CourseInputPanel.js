import { e } from "../ui/react.js";
import { SelectionList } from "./SelectionList.js";

function CourseInputPanel(props) {
  const {
    inputValue,
    onInputChange,
    onAdd,
    onBuild,
    status,
    suggestions,
    selections,
    selectionMatchesById,
    onRemoveSelection
  } = props;

  return e(
    "section",
    { className: "panel" },
    e(
      "div",
      { className: "panel__left" },
      e("label", { htmlFor: "course-input" }, "Add a course"),
      e(
        "div",
        { className: "input-row" },
        e("input", {
          id: "course-input",
          list: "course-suggestions",
          placeholder: "CRN, title, or course section",
          autoComplete: "off",
          value: inputValue,
          onInput: (event) => onInputChange(event.target.value),
          onChange: (event) => onInputChange(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }
        }),
        e("button", { type: "button", id: "add", onClick: onAdd }, "Add")
      ),
      e(
        "datalist",
        { id: "course-suggestions" },
        suggestions.map((title) => e("option", { key: title, value: title }))
      ),
      e(
        "div",
        { className: "panel__actions" },
        e("button", { type: "button", id: "build", onClick: onBuild }, "Build schedules")
      ),
      e("div", { className: "status" }, status),
      e(
        "div",
        { className: "selections" },
        e("h2", null, "Selections"),
        e(SelectionList, {
          selections,
          selectionMatchesById,
          onRemoveSelection
        })
      )
    )
  );
}

export { CourseInputPanel };
