import { e } from "../ui/react.js";
import { formatMeetingLabel } from "../lib/courseUtils.js";

function handleDownloadPDF() {
  const element = document.querySelector(".webtree-preview-vertical");
  if (!element) return;

  html2canvas(element, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;   
    const pageHeight = 295;  

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;


    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("webtree.pdf");
  });
}

function renderTree1(choices) {
  return e("div", { className: "tree-structure tree-1" },
    e("div", { className: "tree-row" },
      renderNode(choices[0], 1, "tree-1-node tree-1-main")
    ),
    e("div", { className: "tree-row" },
      renderNode(choices[1], 2, "tree-1-node"),
      renderNode(choices[4], 5, "tree-1-node")
    ),
    e("div", { className: "tree-row" },
      renderNode(choices[2], 3, "tree-1-node"),
      renderNode(choices[3], 4, "tree-1-node"),
      renderNode(choices[5], 6, "tree-1-node"),
      renderNode(choices[6], 7, "tree-1-node")
    )
  );
}

function renderTree2(choices) {
  return e("div", { className: "tree-structure tree-2" },
    e("div", { className: "tree-row" },
      renderNode(choices[0], 1, "tree-2-node tree-2-main")
    ),
    e("div", { className: "tree-row" },
      renderNode(choices[1], 2, "tree-2-node"),
      renderNode(choices[4], 5, "tree-2-node")
    ),
    e("div", { className: "tree-row" },
      renderNode(choices[2], 3, "tree-2-node"),
      renderNode(choices[3], 4, "tree-2-node"),
      renderNode(choices[5], 6, "tree-2-node"),
      renderNode(choices[6], 7, "tree-2-node")
    )
  );
}

function renderTree3(choices) {
  return e("div", { className: "tree-structure tree-3" },
    e("div", { className: "tree-row" },
      renderNode(choices[0], 1, "tree-3-node tree-3-main")
    ),
    e("div", { className: "tree-row" },
      renderNode(choices[1], 2, "tree-3-node"),
      renderNode(choices[4], 5, "tree-3-node")
    ),
    e("div", { className: "tree-row" },
      renderNode(choices[2], 3, "tree-3-node"),
      renderNode(choices[3], 4, "tree-3-node"),
      renderNode(choices[5], 6, "tree-3-node"),
      renderNode(choices[6], 7, "tree-3-node")
    )
  );
}

function renderTree4(choices) {
  return e("div", { className: "tree-structure tree-4" },
    e("div", { className: "tree-row tree-row-horizontal" },
      choices.map((choice, i) => renderNode(choice, i + 1, "tree-4-node"))
    )
  );
}

function renderNode(selection, label, className) {
  const course = selection?.resolvedCourse || null;
  return e(
    "div",
    { className: `tree-node ${className} ${!course ? "tree-node--empty" : ""}` },
    e("div", { className: "tree-node__label" }, label),
    e("div", { className: "tree-node__content" },
      course
        ? [
            e("strong", { key: "section" }, course.courseSection),
            e("span", { key: "title" }, course.title),
            e("span", { key: "meeting" }, course.meetings.map(formatMeetingLabel).join(" • ") || "Meeting time TBA")
          ]
        : [
            e("strong", { key: "empty-title" }, "Empty"),
            e("span", { key: "empty-text" }, "No course assigned.")
          ]
    )
  );
}


function renderTree(tree) {
  const { title, choices } = tree;
  let treeContent;
  if (title === "Tree 1") treeContent = renderTree1(choices);
  else if (title === "Tree 2") treeContent = renderTree2(choices);
  else if (title === "Tree 3") treeContent = renderTree3(choices);
  else if (title === "Tree 4") treeContent = renderTree4(choices);

  return e(
    "div",
    { key: title, className: `tree-block tree-block--${title.replace(" ", "-").toLowerCase()}` },
    e("div", { className: "tree-block__header" },
      e("h3", null, title),
      e("p", null,
        title === "Tree 4"
          ? "Fallback lane used to improve your chances of getting four courses."
          : "Primary choice path with backups flowing downward."
      )
    ),
    treeContent
  );
}


function WebtreeSection({ trees }) {
  return e(
    "section",
    { className: "webtree" },
    e(
      "div",
      { className: "results__header" },
      e(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }
        },
        e("h2", null, "WebTree Preview"),
        trees.length > 0 &&
          e(
            "button",
            {
              className: "pill",
              onClick: handleDownloadPDF,
              style: {
                marginLeft: "12px"
              }
            },
            "Download PDF"
          )
      ),
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
      { className: "webtree-preview-vertical" },
      trees.length
        ? [
            trees.filter((tree) => tree.title !== "Tree 4").map((tree) => renderTree(tree)),
            e(
              "div",
              { key: "connector", className: "flowchart-connector", "aria-hidden": "true" },
              "↓ fallback to Tree 4 ↓"
            ),
            trees.filter((tree) => tree.title === "Tree 4").map((tree) => renderTree(tree))
          ]
        : e("p", { className: "summary" }, "Add courses first.")
    )
  );
}

export { WebtreeSection };