import React, { useEffect, useRef, useState } from "react";
import VirtualPiano from "../../components/VirtualPiano";
import "./Lesson1.css";

export default function Lesson1() {
  const LESSON_KEY = "pianoProgress";
  // Include all white and black keys for lesson and challenge
  const sequence = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const [completed, setCompleted] = useState(false);

  // tabs: "lesson" (demo) | "challenge"
  const [tab, setTab] = useState("lesson");

  // demo highlight state (used in Lesson tab)
  const [demoHighlight, setDemoHighlight] = useState([]);
  const demoRef = useRef(null);

  // Challenge state (reworked)
  const [started, setStarted] = useState(false);
  const [targetKey, setTargetKey] = useState(null); // current random target
  const [consecutive, setConsecutive] = useState(0); // consecutive correct presses
  const [feedback, setFeedback] = useState("");
  const resetRef = useRef(null);

  useEffect(() => {
    // load saved progress
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.lesson1) setCompleted(true);
      }
    } catch (e) {}
    return () => clearInterval(demoRef.current);
  }, []);

  const saveProgress = () => {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj.lesson1 = true;
      localStorage.setItem(LESSON_KEY, JSON.stringify(obj));
      setCompleted(true);
    } catch (e) {}
  };

  // Demo: cycle highlight keys when lesson tab active
  useEffect(() => {
    clearInterval(demoRef.current);
    setDemoHighlight([]);
    if (tab !== "lesson") return;
    // Animate white keys, then black keys, then repeat
    const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
    const blackKeys = ["C#", "D#", "F#", "G#", "A#"];
    let idx = 0;
    let phase = "white";
    demoRef.current = setInterval(() => {
      if (phase === "white") {
        setDemoHighlight([whiteKeys[idx]]);
        idx += 1;
        if (idx >= whiteKeys.length) {
          phase = "black";
          idx = 0;
        }
      } else {
        setDemoHighlight([blackKeys[idx]]);
        idx += 1;
        if (idx >= blackKeys.length) {
          phase = "white";
          idx = 0;
        }
      }
    }, 700);
    return () => clearInterval(demoRef.current);
  }, [tab]);

  // Challenge handlers (rewritten)
  const startChallenge = () => {
    if (completed) return;
    setStarted(true);
    setConsecutive(0);
    setFeedback("");
    // pick first random target immediately
    const first = randomKey();
    setTargetKey(first);
    setTab("challenge");
  };

  const resetChallenge = () => {
    // reset only the in-memory challenge state (does not clear saved lesson completion)
    setStarted(false);
    setTargetKey(null);
    setConsecutive(0);
    setFeedback("");
    setTab("lesson");
  };

  const clearSavedProgress = () => {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      delete obj.lesson1;
      localStorage.setItem(LESSON_KEY, JSON.stringify(obj));
      setCompleted(false);
      setFeedback("Saved progress cleared.");
      setTimeout(() => setFeedback(""), 1400);
    } catch (e) {
      /* ignore */
    }
  };

  function randomKey() {
    const idx = Math.floor(Math.random() * sequence.length);
    return sequence[idx];
  }

  const handleChallengeKey = (noteName) => {
    if (!started || completed) return;
    if (noteName === targetKey) {
      const nextConsec = consecutive + 1;
      setConsecutive(nextConsec);
      setFeedback(`✅ Correct (${nextConsec} in a row)`);
      if (nextConsec >= 12) {
        setFeedback("🎉 12 correct in a row — Lesson complete!");
        saveProgress();
        setStarted(false);
        setTargetKey(null);
        return;
      }
      clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => {
        setTargetKey(randomKey());
        setFeedback("");
      }, 450);
    } else {
      setFeedback(`❌ Wrong key (${noteName}). Progress reset — start again.`);
      setConsecutive(0);
      setTargetKey(randomKey());
    }
  };

  const showHint = () => {
    // no hints per requirement; keep no-op
  };

  return (
    <div className="lesson-page lesson-tabs">
      <header className="lesson-header centered">
        <h1>Lesson 1 — Introduction: Finding & Playing Piano Keys 🎹</h1>
        <p className="lesson-sub">
          Learn the layout of all piano keys (white and black) and play the notes from C to B.
        </p>
      </header>

      <div className="tabs-row centered">
        <button className={`tab ${tab === "lesson" ? "active" : ""}`} onClick={() => setTab("lesson")}>Lesson</button>
        <button className={`tab ${tab === "challenge" ? "active" : ""}`} onClick={() => setTab("challenge")}>Challenge</button>
      </div>

      <main className="lesson-main">
        {tab === "lesson" && (
          <section className="lesson-demo">
            <div className="demo-card">
              <div className="demo-title">Piano Key Overview</div>
              <div className="demo-sub">
                All piano keys (white and black) will be highlighted in sequence. Click any key to hear it.
              </div>
              <div className="demo-piano-wrap">
                <VirtualPiano
                  highlightKeys={demoHighlight}
                  onKeyPress={() => {}}
                  close={() => {}}
                  hideBlackKeys={false} // show black keys
                  hideClose={true}
                  hideLabels={false}
                />
              </div>
              <div className="demo-footer">
                <button className="btn" onClick={() => setTab("challenge")}>Go to Challenge</button>
              </div>
            </div>
          </section>
        )}

        {tab === "challenge" && (
          <section className="lesson-challenge">
            <div className="challenge-wrapper">
              <div className="challenge-card">
                <h2>Find the Keys (random order)</h2>
                <p>Click the requested key (white or black). Get 12 correct in a row to finish.</p>
                <div className="controls">
                  <button className="btn primary" onClick={startChallenge} disabled={completed || started}>
                    {completed ? "Completed" : started ? "In progress" : "Start Challenge"}
                  </button>
                  <button className="btn" onClick={resetChallenge}>Reset Challenge</button>
                  <button className="btn" onClick={clearSavedProgress}>Clear saved progress</button>
                </div>
                <div className="status" style={{ marginTop: 12 }}>
                  <div className="instruction">
                    {completed ? "Lesson complete — well done!" : !started ? "Press Start to begin." : `Press: ${targetKey || "—"}`}
                  </div>
                  <div className="feedback" aria-live="polite">{feedback}</div>
                  <div className="score">Consecutive correct: {consecutive}/12</div>
                </div>
              </div>

              <div className="challenge-piano">
                <VirtualPiano
                  onKeyPress={handleChallengeKey}
                  hideBlackKeys={false}
                  hideClose={true}
                  hideLabels={true}
                  centerBottom={true}
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
