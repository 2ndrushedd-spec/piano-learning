import React from "react";
import { useNavigate } from "react-router-dom";
import "./InstrumentSelect.css";

export default function InstrumentSelect() {
	const navigate = useNavigate();

	return (
		<div className="instrument-select-page">
			<div className="container">
				<header className="select-header">
					<h1 className="select-title">Choose an Instrument</h1>
					<p className="select-sub">
						Start learning — pick an instrument to open lessons and interactive practice.
					</p>
				</header>

				<main className="instrument-grid" role="list">
					<article
						className="instrument-card"
						role="listitem"
						onClick={() => navigate("/piano")}
						tabIndex={0}
						onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/piano")}
						aria-label="Open Piano module"
					>
						<img
							src="https://cdn-icons-png.flaticon.com/512/3665/3665994.png"
							alt=""
							className="instrument-icon"
							aria-hidden="true"
						/>
						<div className="instrument-info">
							<h2 className="instrument-title">Piano</h2>
							<p className="instrument-desc">Lessons, challenges and an interactive virtual piano.</p>
						</div>
					</article>

					<article className="instrument-card instrument-disabled" role="listitem" aria-disabled="true">
						<img
							src="https://cdn-icons-png.flaticon.com/512/3585/3585854.png"
							alt=""
							className="instrument-icon"
							aria-hidden="true"
						/>
						<div className="instrument-info">
							<h2 className="instrument-title">Guitar</h2>
							<p className="instrument-desc">Coming soon — chord lessons & practice.</p>
						</div>
					</article>
				</main>

				<footer className="select-footer">
					<small className="credits">Made with ♫ — Practice slowly and enjoy learning.</small>
				</footer>
			</div>
		</div>
	);
}
