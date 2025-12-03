import React from "react";
import { useNavigate } from "react-router-dom";
import "./InstrumentSelect.css";

export default function InstrumentSelect() {
	const navigate = useNavigate();
	const publicBase = `${window.location.origin}${process.env.PUBLIC_URL || ""}`;

	return (
		<div className="module-page">
			<div className="module-wrap">

				<header className="module-header">
					<h1 className="module-title">Choose an Instrument</h1>
					<p className="module-sub">
						Start learning — pick an instrument to open lessons and interactive practice.
					</p>
				</header>

				<main className="module-main" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

					{/* Instruments */}
					<section aria-label="Choose an instrument">
						<div style={{ display: "flex", gap: 16 }}>
							<article
								className="card lesson-card"
								role="button"
								onClick={() => navigate("/piano")}
								tabIndex={0}
								onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/piano")}
								aria-label="Open Piano module"
								style={{ cursor: "pointer", flex: 1 }}
							>
								<div className="card-left">
									<h2 className="card-title">Piano</h2>
									<p className="card-desc">Lessons, challenges and an interactive virtual piano.</p>
								</div>
							</article>

							<article
								className="card lesson-card instrument-disabled"
								role="button"
								aria-disabled="true"
								style={{ flex: 1, cursor: "default" }}
							>
								<div className="card-left">
									<h2 className="card-title">Guitar</h2>
									<p className="card-desc">Coming soon — chord lessons & practice.</p>
								</div>
							</article>
						</div>
					</section>

					{/* Mini-games BELOW instruments */}
					<section aria-label="Mini games">
						<h3 className="module-subtitle" style={{ margin: "0 12px 12px 0", textAlign: "center" }}>Mini-games</h3>

						<div style={{ display: "flex", gap: 16 }}>
							{/* Note Catcher */}
							<article
								className="card game-card"
								role="button"
								onClick={() => { window.location.href = `${publicBase}/Note%20Catcher/notecatcher.html`; }}
								tabIndex={0}
								onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (window.location.href = `${publicBase}/Note%20Catcher/notecatcher.html`)}
								aria-label="Play Note Catcher"
								style={{ cursor: "pointer", flex: 1 }}
							>
								<div className="card-left">
									<h4 className="card-title">Note Catcher</h4>
									<p className="card-desc">Catch falling notes — ear training mini-game.</p>
								</div>
							</article>

							{/* Rhythm Tapper */}
							<article
								className="card game-card"
								role="button"
								onClick={() => { window.location.href = `${publicBase}/RhythmTapper/rhythmtapper.html`; }}
								tabIndex={0}
								onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (window.location.href = `${publicBase}/RhythmTapper/rhythmtapper.html`)}
								aria-label="Play Rhythm Tapper"
								style={{ cursor: "pointer", flex: 1 }}
							>
								<div className="card-left">
									<h4 className="card-title">Rhythm Tapper</h4>
									<p className="card-desc">Tap along to rhythms — timing practice mini-game.</p>
								</div>
							</article>
						</div>
					</section>

				</main>

				<footer className="module-footer">
					<small className="credits">Made with ♫ — Practice slowly and enjoy learning.</small>
				</footer>

			</div>
		</div>
	);
}
