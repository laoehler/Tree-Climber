import { e } from "../ui/react.js";
import { getSelectionDisplayCourse } from "../lib/courseUtils.js";

function SelectionList({
  selections,
  selectionMatchesById,
  onRemoveSelection,
  onReorderSelections 
}) {
  if (!selections.length) {
    return e("p", { className: "summary" }, "No selections yet.");
  }

  return e(
    "div",
    { className: "selection-list" },
    selections.map((selection) => {
      const matches = selectionMatchesById.get(selection.id) || [];
      const displayCourse = getSelectionDisplayCourse(matches, selection.course);
      const countLabel =
        matches.length === 1
          ? "1 backend match"
          : `${matches.length} backend matches`;

      return e(
        "div",
        {
          key: selection.id,
          className: "selection-item",

          draggable: true, 

          onDragStart: (e) => {
            e.dataTransfer.setData("text/plain", String(selection.id));
          },

          onDragOver: (e) => {
            e.preventDefault();
          },

          onDrop: (e) => {
            const sourceId = Number(e.dataTransfer.getData("text/plain"));
            const targetId = selection.id;

            if (!sourceId || sourceId === targetId) return;

            const sourceIndex = selections.findIndex((s) => s.id === sourceId);
            const targetIndex = selections.findIndex((s) => s.id === targetId);

            if (sourceIndex === -1 || targetIndex === -1) return;

            const newSelections = [...selections];
            const [moved] = newSelections.splice(sourceIndex, 1);
            newSelections.splice(targetIndex, 0, moved);

            onReorderSelections(newSelections);
          }
        },

        e(
          "div",
          null,
          e(
            "strong",
            null,
            displayCourse?.title || selection.displayTitle || selection.raw
          ),
          e(
            "span",
            { style: { marginLeft: "8px" } },
            displayCourse?.courseSection ||
              selection.displaySection ||
              selection.raw
          ),
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