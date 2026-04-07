import { e } from "../ui/react.js";

function Hero() {
  return e(
    "header",
    { className: "hero" },
    e("div", { className: "hero__badge" }, "Webtree Builder"),
    e("h1", null, "Pick courses. See schedules."),
    e(
      "p",
      null,
      "Enter a CRN, course title, or course section. Add multiple selections to explore possible 4-course schedules and receive a recommendation of how to fill out your webtree."
    )
  );
}

export { Hero };
