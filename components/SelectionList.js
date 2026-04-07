import { e } from "../ui/react.js";
import { getSelectionDisplayCourse } from "../lib/courseUtils.js";

function SelectionList({ selections, selectionMatchesById, onRemoveSelection }) {
  if (!selections.length) {
    return e("p", { className: "summary" }, "No selections yet.");
  }

  return e(
    "div",
    { className: "selection-list" },
    selections.map((selection) => {
      const matches = selectionMatchesById.get(selection.id) || [];
      const displayCourse = getSelectionDisplayCourse(matches, selection.course);
      const countLabel = matches.length === 1 ? "1 backend match" : `${matches.length} backend matches`;

      return e(
        "div",
        { key: selection.id, className: "selection-item" },
        e(
          "div",
          null,
          e("strong", null, displayCourse?.title || selection.displayTitle || selection.raw),
          e("span", null, displayCourse?.courseSection || selection.displaySection || selection.raw),
          e("span", null, countLabel)
        ),
        e(
          "div",
          { className: "selection-actions" },
          e(
            "button",
            {
              type: "button",
              className: "pill",
              onClick: () => onRemoveSelection(selection.id)
            },
            "Remove"
          )
        )
      );
    })
  );
}

export { SelectionList };
