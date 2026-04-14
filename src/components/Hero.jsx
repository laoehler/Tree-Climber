import { useState } from "react";
import { HelpModal } from "./HelpModal";

export function Hero() {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <header className="hero" style={{ position: "relative" }}>
      <div className="hero__badge">Tree Climber</div>
      <h1>Pick courses. See schedules.</h1>
      <p>
        Enter a CRN, course title, or course section. Add multiple selections to explore possible 4-course
        schedules and receive a recommendation of how to fill out your webtree.
      </p>
      <div style={{ marginTop: 12 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            className="pill"
            type="button"
            onClick={() => setShowHelp(!showHelp)}
          >
            Help
          </button>

          {showHelp && (
            <HelpModal onClose={() => setShowHelp(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
