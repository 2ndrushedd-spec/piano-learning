import React, { useState, useEffect } from "react";
import "./PianoModule.css"; // for styling
import VirtualPiano from "../components/VirtualPiano";
import { useNavigate } from "react-router-dom";
import Lesson3 from "./lessons/Lesson3"; // Import the new lesson component

export default function PianoModule() {
  const navigate = useNavigate();
  const [showPiano, setShowPiano] = useState(false);
  const [progress, setProgress] = useState({
    lesson1: false,
    lesson2: false,
    game1: false,
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pianoProgress");
    if (saved) setProgress(JSON.parse(saved));
  }, []);

  // Save progress to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("pianoProgress", JSON.stringify(progress));
  }, [progress]);

  const startLesson = (lesson) => {
    // navigate to lesson page for lesson1, otherwise mark started
    setProgress((prev) => ({ ...prev, [lesson]: true }));
    if (lesson === "lesson1") {
      navigate("/lesson/1");
      return;
    }
    if (lesson === "lesson2") {
      navigate("/lesson/2");
      return;
    }
    if (lesson === "lesson3") {
      navigate("/lesson/3"); // Navigate to Lesson 3
      return;
    }
  };

  const startGame = (game) => {
    // simple start behavior (was original): show a quick alert and mark progress
    alert(`Starting ${game}...`);
    setProgress((prev) => ({ ...prev, [game]: true }));
  };

  return (
    <div className="module-page">
      <div className="module-wrap">
        <header className="module-header">
          <h1 className="module-title">Piano Learning Module</h1>
          <p className="module-sub">
            Interactive lessons and timed practice, pick a lesson to begin.
          </p>
        </header>

        <main className="module-main">
          <section className="cards-grid">
            <article
              className="card lesson-card"
              aria-labelledby="lesson1-title"
            >
              <div className="card-left">
                <h2 id="lesson1-title" className="card-title">
                  Introduction: Finding & Playing Piano Keys
                </h2>
                <p className="card-desc">
                  Learn the layout of the piano (white & black keys), hear notes
                  and follow a demo.
                </p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => startLesson("lesson1")}
                >
                  {progress.lesson1 ? "Continue" : "Start Lesson 1"}
                </button>
              </div>
            </article>

            <article
              className="card lesson-card"
              aria-labelledby="lesson2-title"
            >
              <div className="card-left">
                <h2 id="lesson2-title" className="card-title">
                  Understanding Black Keys (Sharps ♯ & Flats ♭)
                </h2>
                <p className="card-desc">
                  Why black keys exist, sharp/flat names, then practice a timed
                  melody using black keys.
                </p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => startLesson("lesson2")}
                >
                  {progress.lesson2 ? "Continue" : "Start Lesson 2"}
                </button>
              </div>
            </article>

            <article
              className="card lesson-card"
              aria-labelledby="lesson3-title"
            >
              <div className="card-left">
                <h2 id="lesson3-title" className="card-title">
                  Rhythm & Timing Basics
                </h2>
                <p className="card-desc">
                  Learn to read basic rhythms, understand note values, and
                  practice with a metronome.
                </p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => startLesson("lesson3")}
                >
                  {progress.lesson3 ? "Continue" : "Start Lesson 3"}
                </button>
              </div>
            </article>

            {/* Twinkle Tutorial game removed */}
          </section>

          <section className="module-info">
            <div className="info-card">
              <h3>Quick tips</h3>
              <ul>
                <li>Use the demo to hear notes and watch highlights.</li>
                <li>
                  In timed challenges, press the highlighted note during each
                  beat.
                </li>
                <li>Your progress is saved locally (browser storage).</li>
              </ul>
            </div>
          </section>
        </main>

        <footer className="module-footer">
          <button
            className="floating-piano-btn"
            onClick={() => setShowPiano(!showPiano)}
          >
            🎹 Open Piano
          </button>
        </footer>
      </div>

      {/* Piano Pop-up */}
      {showPiano && (
        <VirtualPiano
          close={() => setShowPiano(false)}
          centerBottom={true} /* appear bottom-center */
        />
      )}
    </div>
  );
}
