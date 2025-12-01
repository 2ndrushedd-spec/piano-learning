import React, { useEffect, useRef, useState } from "react";
import "./Lesson3.css";

export default function Lesson3() {
	// helper: build a small inline SVG data URI for reliable local rendering
	const makeSvgData = (title, subtitle) => {
		const svg = `
		<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'>
			<rect width='100%' height='100%' fill='transparent'/>
			<text x='50%' y='46%' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='26' fill='#06152a' font-weight='700'>${title}</text>
			<text x='50%' y='74%' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='14' fill='#475569'>${subtitle}</text>
		</svg>`;
		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	};

	// simple placeholder-only rhythms (use inline SVG generated above)
	const rhythms = [
		{ name: "Whole Note", beats: 4, subdivisions: 1, type: "note", sources: [ makeSvgData("Whole", "Note") ] },
		{ name: "Half Note", beats: 2, subdivisions: 1, type: "note", sources: [ makeSvgData("Half", "Note") ] },
		{ name: "Quarter Note", beats: 1, subdivisions: 1, type: "note", sources: [ makeSvgData("Quarter", "Note") ] },
		{ name: "Eighth Note", beats: 1, subdivisions: 2, type: "note", sources: [ makeSvgData("Eighth", "Note") ] },
		{ name: "Sixteenth Note", beats: 1, subdivisions: 4, type: "note", sources: [ makeSvgData("Sixteenth", "Note") ] },

		{ name: "Whole Rest", beats: 4, subdivisions: 1, type: "rest", sources: [ makeSvgData("Whole", "Rest") ] },
		{ name: "Half Rest", beats: 2, subdivisions: 1, type: "rest", sources: [ makeSvgData("Half", "Rest") ] },
		{ name: "Quarter Rest", beats: 1, subdivisions: 1, type: "rest", sources: [ makeSvgData("Quarter", "Rest") ] },
		{ name: "Eighth Rest", beats: 1, subdivisions: 2, type: "rest", sources: [ makeSvgData("Eighth", "Rest") ] },
		{ name: "Sixteenth Rest", beats: 1, subdivisions: 4, type: "rest", sources: [ makeSvgData("Sixteenth", "Rest") ] },
	];

	// explicit full sequence: notes then rests in requested order
	const notesOrder = ["Whole Note", "Half Note", "Quarter Note", "Eighth Note", "Sixteenth Note"];
	const restsOrder = ["Whole Rest", "Half Rest", "Quarter Rest", "Eighth Rest", "Sixteenth Rest"];
	const sequence = [
		...notesOrder.map((name) => rhythms.find((r) => r.name === name)).filter(Boolean),
		...restsOrder.map((name) => rhythms.find((r) => r.name === name)).filter(Boolean),
	];

	// sequence index state
	const [seqIndex, setSeqIndex] = useState(0);
	const seqRef = useRef(seqIndex);
	seqRef.current = seqIndex;

	// indicator at subdivision resolution
	const [indicatorStep, setIndicatorStep] = useState(0);
	const [tick, setTick] = useState(0);
	const indicatorRef = useRef(0); // live ref used by interval
	const tickRef = useRef(0);

	// AudioContext / playback helpers (unchanged)
	const audioCtxRef = useRef(null);
	const createAudioCtxIfNeeded = async () => {
		if (!audioCtxRef.current) {
			audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
			try { await audioCtxRef.current.resume(); } catch (e) {}
		}
	};
	const playTone = async (freq = 1000, peak = 0.18, dur = 0.09) => {
		await createAudioCtxIfNeeded();
		const ctx = audioCtxRef.current;
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "square";
		osc.frequency.setValueAtTime(freq, now);
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.linearRampToValueAtTime(peak, now + 0.002);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + dur + 0.02);
	};
	const playClickForLabel = (label, isRest = false) => {
		if (/^[1-4]$/.test(label)) {
			playTone(isRest ? 980 : 1100, isRest ? 0.16 : 0.28, isRest ? 0.10 : 0.12);
		} else if (label === "&") {
			playTone(isRest ? 760 : 900, isRest ? 0.08 : 0.14, isRest ? 0.07 : 0.09);
		} else {
			playTone(isRest ? 660 : 760, isRest ? 0.06 : 0.09, isRest ? 0.06 : 0.08);
		}
	};

	// current rhythm from sequence
	const rhythm = sequence[seqIndex];

	// display labels builder (unchanged)
	const buildDisplayLabels = (subdivisions) => {
		const beatLabels = ["1", "2", "3", "4"];
		if (subdivisions === 1) return [...beatLabels];
		const labels = [];
		for (let b = 1; b <= 4; b++) {
			if (subdivisions === 2) {
				labels.push(String(b));
				labels.push("&");
			} else if (subdivisions === 4) {
				labels.push(String(b));
				labels.push("e");
				labels.push("&");
				labels.push("a");
			}
		}
		return labels;
	};

	const displayLabels = buildDisplayLabels(rhythm.subdivisions);
	const totalSubdivisions = displayLabels.length;
	const activeIndices = Array.from({ length: rhythm.beats * rhythm.subdivisions }, (_, i) => i);

	// fallback image
	const noteFallbackDataUri =
		"data:image/svg+xml;utf8," +
		encodeURIComponent(
			`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='none'/><path d='M44 8v28.6A6.4 6.4 0 0 1 38.6 43 6.4 6.4 0 0 1 32.2 36.6 6.4 6.4 0 0 1 38.6 30V13H24v6a8 8 0 1 0 4 0V8h16z' fill='%2311234a'/></svg>`
		);

	// reset indicator when sequence index changes
	useEffect(() => {
		indicatorRef.current = 0;
		tickRef.current = 0;
		setIndicatorStep(0);
		setTick(0);
	}, [seqIndex]);

	// subdivision timer: recreate when seqIndex (current rhythm) changes so subdivMs matches
	useEffect(() => {
		// compute current rhythm for this sequence index
		const curSeq = seqRef.current;
		const curRhythm = sequence[curSeq];
		if (!curRhythm) return undefined;

		const beatMs = 900;
		const subdivisions = Math.max(1, curRhythm.subdivisions);
		const subdivMs = Math.max(60, Math.round(beatMs / subdivisions));

		// ensure refs reset for new rhythm
		indicatorRef.current = 0;
		tickRef.current = 0;
		setIndicatorStep(0);
		setTick(0);

		const id = setInterval(() => {
			// compute labels for current rhythm (re-read in case sequence changed)
			const seqIdxNow = seqRef.current;
			const rhythmNow = sequence[seqIdxNow];
			if (!rhythmNow) return;

			const displayLabelsNow = buildDisplayLabels(rhythmNow.subdivisions);
			const totalNow = displayLabelsNow.length;

			// advance indicator ref and state
			const next = (indicatorRef.current + 1) % totalNow;
			indicatorRef.current = next;
			setIndicatorStep(next);

			// play sound for this subdivision label
			const curLabel = displayLabelsNow[next];
			playClickForLabel(curLabel, rhythmNow.type === "rest");

			// advance tick and when measure completes advance sequence
			tickRef.current += 1;
			setTick(tickRef.current);
			if (tickRef.current >= totalNow) {
				// advance sequence index and reset counters
				setSeqIndex((i) => {
					const ni = (i + 1) % sequence.length;
					seqRef.current = ni;
					indicatorRef.current = 0;
					tickRef.current = 0;
					// update UI reset
					setIndicatorStep(0);
					setTick(0);
					return ni;
				});
			}
		}, subdivMs);

		return () => clearInterval(id);
	}, [seqIndex]); // recreate when seqIndex changes

	const titleSuffix = rhythm.beats === 1 ? "1 Beat" : `${rhythm.beats} Beats`;
	const title = `${rhythm.name} – ${titleSuffix}`;

	return (
		<div className="lesson-page lesson-tabs lesson3" aria-live="polite">
			<header className="lesson-header centered" style={{ marginBottom: 12 }}>
				<h1>Lesson 3 — Rhythm Notation: Note & Rest Durations</h1>
				<p className="lesson-sub" style={{ maxWidth: 760 }}>
					Learn how long different notes and rests last. Each example below shows the notation and a beat/subdivision scale that highlights the duration.
				</p>
			</header>

			<main className="lesson-main">
				<section className="lesson-demo">
					<div className="demo-card">
						<div className="demo-title">Rhythm Values</div>
						<div className="demo-sub">
							The example cycles through notes first, then rests. Watch the moving beat indicator and the highlighted duration.
						</div>

						<div className="rhythm-card" role="region" aria-label="Rhythm lesson">
							<div className="rhythm-head">
								<img
									className="rhythm-img"
									src={rhythm.sources && rhythm.sources[0]}
									alt={rhythm.name}
									onError={(e) => {
										e.currentTarget.onerror = null;
										e.currentTarget.src = noteFallbackDataUri;
									}}
								/>
								<div className="rhythm-text">
									<div className="primary-name">{rhythm.name}</div>
									<div className="secondary-title">{title}</div>
									<div className="meta">{rhythm.type === "note" ? "Note duration" : "Rest duration"}</div>
								</div>
							</div>

							<div className="beat-scale" aria-hidden={false}>
								{displayLabels.map((label, i) => {
									const isActive = activeIndices.includes(i);
									const isCurrent = indicatorStep % totalSubdivisions === i;
									const activeClass = isActive ? (rhythm.type === "rest" ? "rest-active" : "active") : "";
									return (
										<div
											key={`${label}-${i}`}
											className={`beat-box ${displayLabels.length > 4 ? "small" : ""} ${activeClass} ${isCurrent ? "current" : ""}`}
										>
											{label}
										</div>
									);
								})}
							</div>

							<div style={{ marginTop: 8, color: "#334155", fontSize: 14 }}>
								Highlights show the duration. The pulsing box indicates the current beat/subdivision.
							</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
