import React, { useState } from "react";
import "./Lesson1.css"; // reuse lesson css for piano styles (kept colocated)

const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"];

export default function LessonPiano({ onKeyPress, highlightTarget = null }) {
  const [pressed, setPressed] = useState(null);

  const handlePress = (name, e) => {
    e.preventDefault();
    setPressed(name);
    if (typeof onKeyPress === "function") onKeyPress(name);
    setTimeout(() => setPressed(null), 160);
  };

  return (
    <div className="lesson-piano" role="application" aria-label="Lesson piano">
      <div className="lesson-white-keys" onContextMenu={(e) => e.preventDefault()}>
        {WHITE_KEYS.map((k) => (
          <div
            key={k}
            className={
              "lp-key" +
              (pressed === k ? " pressed" : "") +
              (highlightTarget === k ? " target-glow" : "")
            }
            role="button"
            tabIndex={0}
            data-note={k}
            onMouseDown={(e) => handlePress(k, e)}
            onTouchStart={(e) => handlePress(k, e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handlePress(k, e);
            }}
            aria-label={k}
          >
            {/* labels intentionally hidden for this lesson; kept for screen readers */}
            <span className="sr-only">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
