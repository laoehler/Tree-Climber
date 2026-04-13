export function HelpModal({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__content">
        <button className="modal__close" onClick={onClose} aria-label="Close help">
          ×
        </button>
        <h2>How to use Tree Climber</h2>
        <ol>
          <li>Use the search bar to look up a course and add it to your selections</li>
          <li>Click and drag your courses to your desired priority order</li>
          <li>Let Tree Climber create your webtree and potential schedules</li>
        </ol>
      </div>
    </div>
  );
}
