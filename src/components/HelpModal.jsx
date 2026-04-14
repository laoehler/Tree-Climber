export function HelpModal({ onClose }) {
  return (
    <div className="help-popover">
    <div className="help-header">
      <h3>How to use Tree Climber</h3>
      <button className="help-close" onClick={onClose}>×</button>
      </div>
      <ol>
        <li>Use the search bar to look up a course and add it to your selections.</li>
        <li>Drag and drop your courses to reorder it!</li>
        <li>Let Tree Climber create your Webtree and potential schedules.</li>
      </ol>
    </div>
  );
}