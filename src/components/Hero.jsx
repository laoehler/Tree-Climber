export function Hero({ onHelpClick }) {
  return (
    <header className="hero">
      <div className="hero__badge">Webtree Builder</div>
      <h1>Pick courses. See schedules.</h1>
      <p>
        Enter a CRN, course title, or course section. Add multiple selections to explore possible 4-course
        schedules and receive a recommendation of how to fill out your webtree.
      </p>
      <div style={{ marginTop: 12 }}>
        <button className="pill" type="button" onClick={onHelpClick}>
          Help
        </button>
      </div>
    </header>
  );
}
