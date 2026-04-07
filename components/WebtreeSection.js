import { e } from "../ui/react.js";
import { formatMeetingLabel } from "../lib/courseUtils.js";

function renderChoice(selection, index, treeTitle) {
  const course = selection?.resolvedCourse || null;
  const isTree4 = treeTitle === "Tree 4";
  const slotLabel = isTree4 ? `Fallback ${index + 1}` : `Choice ${index + 1}`;

  return e(
    "div",
    {
      key: `${treeTitle}-${index}`,
      className: `flow-node ${!course ? "flow-node--empty" : ""} ${isTree4 ? "flow-node--tree4" : ""}`
    },
    e(
      "div",
      { className: "flow-node__badge" },
      slotLabel
    ),
    e(
      "div",
      { className: "flow-node__content" },
      course
        ? [
            e("strong", { key: "section" }, course.courseSection),
            e("span", { key: "title" }, course.title),
            e(
              "span",
              { key: "meeting" },
              course.meetings.map(formatMeetingLabel).join(" • ") || "Meeting time TBA"
            )
          ]
        : [
            e("strong", { key: "empty-title" }, "Empty"),
            e("span", { key: "empty-text" }, "No course assigned to this slot.")
          ]
    ),
    !isTree4 && index < 6
      ? e("div", { className: "flow-node__arrow", "aria-hidden": "true" }, "↓")
      : null
  );
}

function renderTree(tree) {
  const isTree4 = tree.title === "Tree 4";

  return e(
    "div",
    {
      key: tree.title,
      className: `flow-tree-diagram ${isTree4 ? "flow-tree-diagram--tree4" : ""}`
    },
    e(
      "div",
      { className: "flow-tree-diagram__header" },
      e("h3", null, tree.title),
      e(
        "p",
        null,
        isTree4
          ? "Fallback lane used to improve your chances of getting four courses."
          : "Primary choice path with backups flowing downward."
      )
    ),
    e(
      "div",
      {
        className: `flow-tree-diagram__body ${isTree4 ? "flow-tree-diagram__body--tree4" : ""}`
      },
      tree.choices.map((selection, index) => renderChoice(selection, index, tree.title))
    )
  );
}

function WebtreeSection({ trees }) {
  return e(
    "section",
    { className: "webtree" },
    e(
      "div",
      { className: "results__header" },
      e("h2", null, "WebTree Preview"),
      e(
        "p",
        { className: "summary" },
        trees.length
          ? "Generated using your ranked selections and the selected schedule."
          : "Your ordered preferences mapped into Tree 1-4."
      )
    ),
    e(
      "div",
      { className: "webtree-preview" },
      trees.length
        ? [
            e(
              "div",
              { key: "top", className: "flowchart-top" },
              trees
                .filter((tree) => tree.title !== "Tree 4")
                .map((tree) => renderTree(tree))
            ),
            e(
              "div",
              { key: "connector", className: "flowchart-connector", "aria-hidden": "true" },
              "↓ fallback to Tree 4 ↓"
            ),
            trees
              .filter((tree) => tree.title === "Tree 4")
              .map((tree) => renderTree(tree))
          ]
        : e("p", { className: "summary" }, "Add courses first.")
    )
  );
}

export { WebtreeSection };