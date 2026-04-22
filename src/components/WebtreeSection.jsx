import { Fragment } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { formatMeetingLabel } from "../lib/index.js";

function handleDownloadPDF() {
  const element = document.querySelector(".webtree-preview-vertical");
  if (!element) return;

  html2canvas(element, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

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

function renderNode(selection, label, className) {
  const course = selection?.resolvedCourse || null;
  return (
    <div className={`tree-node ${className} ${!course ? "tree-node--empty" : ""}`}>
      <div className="tree-node__label">{label}</div>
      <div className="tree-node__content">
        {course ? (
          <>
            <strong>{course.courseSection}</strong>
            <span>{course.title}</span>
            <span>{course.meetings.map(formatMeetingLabel).join(" • ") || "Meeting time TBA"}</span>
          </>
        ) : (
          <>
            <strong>Empty</strong>
            <span>No course assigned.</span>
          </>
        )}
      </div>
    </div>
  );
}

function renderTree1(choices) {
  return (
    <div className="tree-structure tree-1">
      <div className="tree-row">{renderNode(choices[0], 1, "tree-1-node tree-1-main")}</div>
      <div className="tree-row">
        {renderNode(choices[1], 2, "tree-1-node")}
        {renderNode(choices[4], 5, "tree-1-node")}
      </div>
      <div className="tree-row">
        {renderNode(choices[2], 3, "tree-1-node")}
        {renderNode(choices[3], 4, "tree-1-node")}
        {renderNode(choices[5], 6, "tree-1-node")}
        {renderNode(choices[6], 7, "tree-1-node")}
      </div>
    </div>
  );
}

function renderTree2(choices) {
  return (
    <div className="tree-structure tree-2">
      <div className="tree-row">{renderNode(choices[0], 1, "tree-2-node tree-2-main")}</div>
      <div className="tree-row">
        {renderNode(choices[1], 2, "tree-2-node")}
        {renderNode(choices[4], 5, "tree-2-node")}
      </div>
      <div className="tree-row">
        {renderNode(choices[2], 3, "tree-2-node")}
        {renderNode(choices[3], 4, "tree-2-node")}
        {renderNode(choices[5], 6, "tree-2-node")}
        {renderNode(choices[6], 7, "tree-2-node")}
      </div>
    </div>
  );
}

function renderTree3(choices) {
  return (
    <div className="tree-structure tree-3">
      <div className="tree-row">{renderNode(choices[0], 1, "tree-3-node tree-3-main")}</div>
      <div className="tree-row">
        {renderNode(choices[1], 2, "tree-3-node")}
        {renderNode(choices[4], 5, "tree-3-node")}
      </div>
      <div className="tree-row">
        {renderNode(choices[2], 3, "tree-3-node")}
        {renderNode(choices[3], 4, "tree-3-node")}
        {renderNode(choices[5], 6, "tree-3-node")}
        {renderNode(choices[6], 7, "tree-3-node")}
      </div>
    </div>
  );
}

function renderTree4(choices) {
  return (
    <div className="tree-structure tree-4">
      <div className="tree-row tree-row-horizontal">
        {choices.map((choice, i) => (
          <Fragment key={i}>{renderNode(choice, i + 1, "tree-4-node")}</Fragment>
        ))}
      </div>
    </div>
  );
}

function renderTree(tree) {
  const { title, choices } = tree;
  let treeContent;
  if (title === "Tree 1") treeContent = renderTree1(choices);
  else if (title === "Tree 2") treeContent = renderTree2(choices);
  else if (title === "Tree 3") treeContent = renderTree3(choices);
  else if (title === "Tree 4") treeContent = renderTree4(choices);

  return (
    <div className={`tree-block tree-block--${title.replace(" ", "-").toLowerCase()}`}>
      <div className="tree-block__header">
        <h3>{title}</h3>
        <p>
          {title === "Tree 4"
            ? "Fallback lane used to improve your chances of getting four courses."
            : "Primary choice path with backups flowing downward."}
        </p>
      </div>
      {treeContent}
    </div>
  );
}

export function WebtreeSection({ trees }) {
  return (
    <section className="webtree">
      <div className="results__header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2>WebTree Preview</h2>
          {trees.length > 0 ? (
            <button
              type="button"
              className="pill"
              onClick={handleDownloadPDF}
              style={{ marginLeft: "12px" }}
            >
              Download PDF
            </button>
          ) : null}
        </div>
        <p className="summary">
          {trees.length
            ? "Generated using your ranked selections and the selected schedule."
            : "Your ordered preferences mapped into Tree 1-4."}
        </p>
      </div>
      <div className="webtree-preview-vertical">
        {trees.length ? (
          <>
            {trees
              .filter((tree) => tree.title !== "Tree 4")
              .map((tree) => (
                <div key={tree.title}>{renderTree(tree)}</div>
              ))}
            <div className="flowchart-connector" aria-hidden="true">
              ↓ fallback to Tree 4 ↓
            </div>
            {trees
              .filter((tree) => tree.title === "Tree 4")
              .map((tree) => (
                <div key={tree.title}>{renderTree(tree)}</div>
              ))}
          </>
        ) : (
          <p className="summary">Add courses first.</p>
        )}
      </div>
    </section>
  );
}
