import { e } from "../ui/react.js";

function HelpModal({ onClose }) {
  return e(
    "div",
    { className: "modal", role: "dialog", "aria-modal": "true" },
    e("div", { className: "modal__overlay", onClick: onClose }),
    e(
      "div",
      { className: "modal__content" },
      e(
        "button",
        { className: "modal__close", onClick: onClose, "aria-label": "Close help" },
        "×"
      ),
      e("h2", null, "How to use Tree Climber"),
      e(
        "ol",
        null,
        e(
          "li",
          null,
          "Use the search bar to look up a course and add it to your selections"
        ),
        e(
          "li",
          null,
          "Click and drag your courses to your desired priority order"
        ),
        e(
          "li",
          null,
          "Let Tree Climber create your webtree and potential schedules"
        )
      )
    )
  );
}

export { HelpModal };
