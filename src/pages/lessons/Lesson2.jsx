import React, { useEffect, useRef, useState } from "react";
import VirtualPiano from "../../components/VirtualPiano";
import "./Lesson2.css";

export default function Lesson2() {
  const LESSON_KEY = "pianoProgress";
  const [completed, setCompleted] = useState(false);

  // full sequence split into lines (updated per your last message)
  const sequenceLines = [
    ["E", "D", "C#", "D", "E", "E", "E"],      // Line 1
    ["D", "D", "D", "E", "G", "G"],           // Line 2
    ["E", "D", "C#", "D", "E", "E", "E"],     // Line 3
    ["E", "D", "D", "E", "D", "C#"],          // Line 4 (final note set to C#; change to "C" if you prefer)
  ];
  const fullSequence = sequenceLines.flat(); // linear sequence used for timing

  // page state
  const [tab, setTab] = useState("lesson"); // "lesson" | "challenge"
  const demoRef = useRef(null);
  const [demoHighlight, setDemoHighlight] = useState([]);

  // challenge / playback state
  const [started, setStarted] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null); // current index in fullSequence
  const playingIntervalRef = useRef(null);
  const playingIndexRef = useRef(null);           // <-- NEW: stable ref for current index
  const awaitingInputRef = useRef(false);
  const [currentHighlight, setCurrentHighlight] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [hitsArr, setHitsArr] = useState([]); // booleans per beat
  const TICK_MS = 600; // beat duration (actual tempo ≈ 100 BPM)

  // new: countdown state and ref
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.lesson2) setCompleted(true);
      }
    } catch (e) {}
    return () => clearInterval(demoRef.current);
  }, []);

  const saveProgress = () => {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj.lesson2 = true;
      localStorage.setItem(LESSON_KEY, JSON.stringify(obj));
      setCompleted(true);
    } catch (e) {}
  };

  // Demo: highlight black keys cycle
  useEffect(() => {
    clearInterval(demoRef.current);
    setDemoHighlight([]);
    if (tab !== "lesson") return;
    const blackCycle = ["C#", "D#", "F#", "G#", "A#"];
    let i = 0;
    demoRef.current = setInterval(() => {
      setDemoHighlight([blackCycle[i]]);
      i = (i + 1) % blackCycle.length;
    }, 900);
    return () => clearInterval(demoRef.current);
  }, [tab]);

  // start the timed challenge playback
  const startChallenge = () => {
    if (completed) return;
    clearInterval(playingIntervalRef.current);
    setStarted(true);
    setFeedback("");
    // initialize state for a fresh run
    setHitsArr(new Array(fullSequence.length).fill(false));
    // set first index via ref + state
    playingIndexRef.current = 0;
    setPlayingIndex(0);
    setCurrentHighlight(fullSequence[0]);
    awaitingInputRef.current = true;

    // use an interval that reads/writes playingIndexRef to avoid stale closures
    playingIntervalRef.current = setInterval(() => {
      const prev = playingIndexRef.current;
      // if user didn't press during previous beat, mark miss
      if (awaitingInputRef.current && prev !== null) {
        setHitsArr((arr) => {
          const copy = arr.slice();
          copy[prev] = false;
          return copy;
        });
        awaitingInputRef.current = false;
      }

      const next = (prev === null) ? null : prev + 1;
      if (next >= fullSequence.length) {
        // finish
        clearInterval(playingIntervalRef.current);
        playingIntervalRef.current = null;
        playingIndexRef.current = null;
        setPlayingIndex(null);
        setCurrentHighlight(null);
        awaitingInputRef.current = false;
        // evaluate results
        setTimeout(() => {
          setFeedback("Sequence finished — checking results...");
          setTimeout(() => {
            setHitsArr((arr) => {
              const allGood = arr.every(Boolean);
              if (allGood) {
                setFeedback("🎉 Perfect! You played the sequence correctly.");
                saveProgress();
              } else {
                const hits = arr.filter(Boolean).length;
                setFeedback(`Incomplete: ${hits}/${arr.length} correct. Try again.`);
              }
              setStarted(false);
              return arr;
            });
          }, 600);
        }, 300);
        return;
      }

      // advance to next beat
      playingIndexRef.current = next;
      setPlayingIndex(next);
      setCurrentHighlight(fullSequence[next]);
      awaitingInputRef.current = true;
    }, TICK_MS);
    setTab("challenge");
  };

  // new: start handler that shows a 3-second countdown, then calls original start logic
  const startWithCountdown = () => {
    // if already counting or already started, ignore
    if (countdown > 0) return;
    setCountdown(3);
    // decrement every second
    countdownRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          // stop the interval
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          // small delay to allow "1" to be visible -> then start
          setTimeout(() => {
            setCountdown(0);
            // CALL THE ORIGINAL START FUNCTION HERE
            // If your original starter is named `startChallenge`, call it:
            if (typeof startChallenge === "function") startChallenge();
            // Otherwise replace the above with your existing start logic.
          }, 220);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const resetChallenge = () => {
    setStarted(false);
    setPlayingIndex(null);
    setCurrentHighlight(null);
    setFeedback("");
    awaitingInputRef.current = false;
    clearInterval(playingIntervalRef.current);
    playingIntervalRef.current = null;
    playingIndexRef.current = null; // clear ref
    setHitsArr(new Array(fullSequence.length).fill(false));
    setTab("lesson");
  };

  const clearSavedProgress = () => {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      delete obj.lesson2;
      localStorage.setItem(LESSON_KEY, JSON.stringify(obj));
      setCompleted(false);
      setFeedback("Saved progress cleared.");
      setTimeout(() => setFeedback(""), 1400);
    } catch (e) {}
  };

  // user input during challenge: accept only one input per beat
  const handleChallengeKey = (noteName) => {
    if (!started || completed) return;
    const idx = playingIndexRef.current;
    if (idx === null || idx === undefined) {
      setFeedback("🔉 Wait for the highlighted note.");
      return;
    }
    if (!awaitingInputRef.current) {
      setFeedback("⏱️ Too late for this beat.");
      return;
    }
    // lock input for this beat
    awaitingInputRef.current = false;
    if (noteName === currentHighlight) {
      setHitsArr((arr) => {
        const copy = arr.slice();
        copy[idx] = true;
        return copy;
      });
      setFeedback(`✅ Hit: ${noteName}`);
    } else {
      setHitsArr((arr) => {
        const copy = arr.slice();
        copy[idx] = false;
        return copy;
      });
      setFeedback(`❌ Miss: expected ${currentHighlight}, you pressed ${noteName}`);
    }
  };

  return (
    <div className="lesson-page lesson2-tabs">
      <header className="lesson-header centered">
        <h1>Lesson 2 — Understanding Black Keys (Sharps ♯ & Flats ♭)</h1>
        <p className="lesson-sub">
          Learn why black keys exist and how sharps (♯) and flats (♭) are named. Then practice a
          timed "Mary Had a Little Lamb" exercise — follow the highlighted notes and play them in rhythm.
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
              <div className="demo-title">Why Black Keys?</div>
              <div className="demo-sub">
                Black keys are sharps or flats — the demo highlights common sharps (labels show both names).
              </div>

              {/* Added explanation about naming (sharps vs flats) */}
              <div className="lesson-explain" style={{ maxWidth: 720, textAlign: "left", marginTop: 8 }}>
                <h3 style={{ margin: "8px 0", fontSize: 16 }}>Sharps (♯) vs Flats (♭)</h3>
                <p style={{ margin: "6px 0" }}>
                  Explain naming: sharps (♯) vs flats (♭).
                </p>
                <p style={{ margin: "6px 0" }}><strong>Example:</strong> <span style={{ fontWeight: 800 }}>C♯</span> = one semitone above C</p>
                <p style={{ margin: "6px 0" }}><strong>Example:</strong> <span style={{ fontWeight: 800 }}>D♭</span> = one semitone below D</p>
                <p style={{ margin: "6px 0" }}>
                  Same key, different name depending on musical context. (C♯ and D♭ refer to the same piano key.)
                </p>
              </div>

              <div className="demo-piano-wrap">
                <VirtualPiano
                  highlightKeys={demoHighlight}
                  onKeyPress={() => {}}
                  close={() => {}}
                  hideBlackKeys={false}
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
                <h2>Play: Mary Had a Little Lamb (timed)</h2>
                <p>Follow the highlighted note each beat and press it on the piano. Keep rhythm — labels are hidden.</p>

                {/* Render the four lines with per-note highlight */}
                <div className="seq-container">
                  {sequenceLines.map((line, lineIdx) => {
                    // compute global index offset for this line
                    const offset = sequenceLines.slice(0, lineIdx).flat().length;
                    return (
                      <div key={lineIdx} className="seq-line" aria-hidden="true">
                        <div className="seq-line-label">Line {lineIdx + 1}</div>
                        <div className="seq-notes">
                          {line.map((n, ni) => {
                            const globalIdx = offset + ni;
                            const isActive = playingIndex === globalIdx;
                            const ok = hitsArr[globalIdx];
                            return (
                              <div key={ni} className={`seq-note ${isActive ? "active" : ""} ${ok ? "ok" : ""}`}>
                                {n}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="controls" style={{ marginTop: 12 }}>
                  <button className="btn primary" onClick={startWithCountdown} disabled={started || completed}>
                    {completed ? "Completed" : started ? "In progress" : "Start Challenge"}
                  </button>
                  <button className="btn" onClick={resetChallenge}>Reset Challenge</button>
                  <button className="btn" onClick={clearSavedProgress}>Clear saved progress</button>
                </div>

                <div className="status" style={{ marginTop: 12 }}>
                  <div className="instruction">
                    {completed ? "Lesson complete — well done!" : !started ? "Press Start to begin." : `Play: ${currentHighlight || "—"}`}
                  </div>
                  <div className="feedback" aria-live="polite">{feedback}</div>
                  <div className="score">Hits: {hitsArr.filter(Boolean).length}/{fullSequence.length}</div>
                </div>
              </div>

              <div className="challenge-piano">
                <VirtualPiano
                  onKeyPress={handleChallengeKey}
                  hideBlackKeys={false}
                  hideClose={true}
                  hideLabels={true} /* hide labels during timed accuracy test */
                  centerBottom={false}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Countdown overlay / indicator */}
      {countdown > 0 && (
        <div className="countdown-overlay" aria-live="polite" style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none"
        }}>
          <div style={{
            background: "rgba(15,20,25,0.85)",
            color: "#fff",
            fontSize: 56,
            padding: "18px 28px",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
          }}>
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
}
