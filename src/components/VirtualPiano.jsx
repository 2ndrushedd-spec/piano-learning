import React, { useEffect, useRef, useState } from "react";
import "./VirtualPiano.css";

// Accept optional props:
//  - close: function to close piano (existing)
//  - highlightKeys: array of key names to visually highlight (e.g. ['C'])
//  - onKeyPress: function(noteName) called when any key is pressed
//  - hideBlackKeys: boolean - if true, black keys will not be rendered
//  - hideClose: boolean - if true, the red close-X will not be rendered
//  - hideLabels: boolean - if true, the note labels will not be rendered
//  - centerBottom: boolean - if true, position the piano at the bottom center on mount
export default function VirtualPiano({
	close,
	highlightKeys = [],
	onKeyPress,
	hideBlackKeys = false,
	hideClose = false,
	hideLabels = false,
	centerBottom = false, // new prop: center piano at bottom center on mount
}) {
	// audio refs (unchanged)
	const audioCtxRef = useRef(null);
	const activeNotesRef = useRef({});

	// layout refs/state
	const whiteKeyEls = useRef([]);
	const whiteKeysContainer = useRef(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	// drag / resize state
	const [pos, setPos] = useState({ x: 0, y: 0 });
	const [size, setSize] = useState({ width: 720, height: 220 });
	const dragRef = useRef(null);
	const resizeRef = useRef(null);
	const draggingRef = useRef(false);
	const resizingRef = useRef(false);
	const dragOffsetRef = useRef({ x: 0, y: 0 });
	const resizeStartRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 });

	// visual pressed keys
	const [pressedKeys, setPressedKeys] = useState([]);

	const whiteKeys = [
		{ name: "C", freq: 261.63 },
		{ name: "D", freq: 293.66 },
		{ name: "E", freq: 329.63 },
		{ name: "F", freq: 349.23 },
		{ name: "G", freq: 392.0 },
		{ name: "A", freq: 440.0 },
		{ name: "B", freq: 493.88 },
	];

	const blackKeys = [
		{ name: "C#", freq: 277.18, leftWhite: "C" },
		{ name: "D#", freq: 311.13, leftWhite: "D" },
		{ name: "F#", freq: 369.99, leftWhite: "F" },
		{ name: "G#", freq: 415.3, leftWhite: "G" },
		{ name: "A#", freq: 466.16, leftWhite: "A" },
	];

	// Initialize Audio Context (unchanged)
	useEffect(() => {
		audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
	}, []);

	// set initial position & size once on mount (centered horizontally, bottom offset)
	useEffect(() => {
		const winW = window.innerWidth;
		const winH = window.innerHeight;
		const initW = Math.min(Math.floor(winW * 0.9), 720);
		const initH = 220;
		const initX = Math.max(8, Math.round((winW - initW) / 2));
		const defaultY = Math.max(40, winH - initH - 80);
		setSize({ width: initW, height: initH });
		if (centerBottom) {
			// position at bottom center by default
			const bottomY = Math.max(8, winH - initH - 80);
			setPos({ x: initX, y: bottomY });
		} else {
			setPos({ x: initX, y: defaultY });
		}
	}, [centerBottom]);

	// keep containerSize in sync with the actual white-keys inner width/height
	useEffect(() => {
		const updateRect = () => {
			const el = whiteKeysContainer.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			setContainerSize({ width: rect.width, height: rect.height });
		};
		updateRect();
		// also observe resize of the white-keys container
		const el = whiteKeysContainer.current;
		if (el) {
			const ro = new ResizeObserver(updateRect);
			ro.observe(el);
			return () => ro.disconnect();
		}
	}, [size.width, size.height]);

	// pointer move/up handlers for dragging/resizing
	useEffect(() => {
		const onPointerMove = (e) => {
			const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
			const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
			if (draggingRef.current) {
				const nx = clientX - dragOffsetRef.current.x;
				const ny = clientY - dragOffsetRef.current.y;

				// allow wider movement range; ensure at least a sliver remains visible
				const minX = Math.min(8, window.innerWidth - size.width);
				const maxX = Math.max(8, window.innerWidth - 80); // allow near-edge positioning
				const clampedX = Math.min(Math.max(minX, nx), maxX);

				const minY = 8;
				const maxY = Math.max(8, window.innerHeight - 80);
				const clampedY = Math.min(Math.max(minY, ny), maxY);

				setPos({ x: clampedX, y: clampedY });
			} else if (resizingRef.current) {
				const dx = clientX - resizeStartRef.current.startX;
				const dy = clientY - resizeStartRef.current.startY;
				const newW = Math.max(320, Math.round(resizeStartRef.current.startW + dx));
				const newH = Math.max(140, Math.round(resizeStartRef.current.startH + dy));
				// clamp to viewport so it doesn't grow off-screen
				const clampW = Math.min(newW, window.innerWidth - pos.x - 8);
				const clampH = Math.min(newH, window.innerHeight - pos.y - 8);
				setSize({ width: clampW, height: clampH });
			}
		};
		const onPointerUp = () => {
			draggingRef.current = false;
			resizingRef.current = false;
			document.body.style.userSelect = "";
		};
		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerUp);
		return () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("pointercancel", onPointerUp);
		};
	}, [size.width, size.height, pos.x, pos.y]);

	// start drag (now uses pointer capture + preventDefault)
	const onDragStart = (e) => {
		e.preventDefault();
		const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
		const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
		draggingRef.current = true;
		dragOffsetRef.current = { x: clientX - pos.x, y: clientY - pos.y };
		document.body.style.userSelect = "none";

		// pointer capture (if available)
		if (e.pointerId && e.currentTarget && e.currentTarget.setPointerCapture) {
			try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
		}
	};

	// start resize (preventDefault + pointer capture)
	const onResizeStart = (e) => {
		e.stopPropagation();
		e.preventDefault();
		const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
		const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
		resizingRef.current = true;
		resizeStartRef.current = {
			startX: clientX,
			startY: clientY,
			startW: size.width,
			startH: size.height,
		};
		document.body.style.userSelect = "none";

		if (e.pointerId && e.currentTarget && e.currentTarget.setPointerCapture) {
			try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
		}
	};

	// Play / Stop note (audio logic unchanged) with pressed visual sync
	const playNote = (note) => {
		const ctx = audioCtxRef.current;
		if (!ctx || activeNotesRef.current[note.name]) return;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.value = note.freq;
		gain.gain.setValueAtTime(0.001, ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		activeNotesRef.current[note.name] = { osc, gain };
		setPressedKeys((prev) => (prev.includes(note.name) ? prev : [...prev, note.name]));

		// notify lesson/parent if provided
		try { if (typeof onKeyPress === "function") onKeyPress(note.name); } catch (e) {}
	};

	// Stop by note object (existing API)
	const stopNote = (note) => {
		const ctx = audioCtxRef.current;
		const active = activeNotesRef.current[note.name];
		if (!active) {
			setPressedKeys((prev) => prev.filter((n) => n !== note.name));
			return;
		}
		const now = ctx.currentTime;
		active.gain.gain.cancelScheduledValues(now);
		active.gain.gain.setValueAtTime(active.gain.gain.value, now);
		active.gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
		active.osc.stop(now + 0.5);
		delete activeNotesRef.current[note.name];
		setPressedKeys((prev) => prev.filter((n) => n !== note.name));
	};

	// Stop by name (useful for pointer handlers / global cleanup)
	const stopNoteByName = (name) => {
		const ctx = audioCtxRef.current;
		const active = activeNotesRef.current[name];
		if (!active || !ctx) {
			setPressedKeys((prev) => prev.filter((n) => n !== name));
			return;
		}
		const now = ctx.currentTime;
		active.gain.gain.cancelScheduledValues(now);
		active.gain.gain.setValueAtTime(active.gain.gain.value, now);
		active.gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
		try { active.osc.stop(now + 0.25); } catch (e) {}
		delete activeNotesRef.current[name];
		setPressedKeys((prev) => prev.filter((n) => n !== name));
	};

	// Stop all active notes (called on cancel/visibilitychange/blur)
	const stopAllNotes = () => {
		const ctx = audioCtxRef.current;
		if (!ctx) {
			setPressedKeys([]);
			activeNotesRef.current = {};
			return;
		}
		const now = ctx.currentTime;
		Object.keys(activeNotesRef.current).forEach((name) => {
			const active = activeNotesRef.current[name];
			if (!active) return;
			try {
				active.gain.gain.cancelScheduledValues(now);
				active.gain.gain.setValueAtTime(active.gain.gain.value, now);
				active.gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
				active.osc.stop(now + 0.12);
			} catch (e) {}
			delete activeNotesRef.current[name];
		});
		setPressedKeys([]);
	};

	// global listeners to ensure notes are cleaned up on cancel/blur/visibility change
	useEffect(() => {
		window.addEventListener("touchend", stopAllNotes, { passive: true });
		window.addEventListener("touchcancel", stopAllNotes, { passive: true });
		window.addEventListener("pointercancel", stopAllNotes);
		window.addEventListener("blur", stopAllNotes);
		const onVisibility = () => { if (document.hidden) stopAllNotes(); };
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			window.removeEventListener("touchend", stopAllNotes);
			window.removeEventListener("touchcancel", stopAllNotes);
			window.removeEventListener("pointercancel", stopAllNotes);
			window.removeEventListener("blur", stopAllNotes);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	// compute container inline style; if centerBottom use centered horizontal layout
	const containerStyle = centerBottom
		? {
				position: "fixed",
				left: "50%",
				transform: "translateX(-50%)",
				top: `${pos.y}px`,
				width: `${size.width}px`,
				height: `${size.height + 40}px`,
		  }
		: {
				position: "fixed",
				left: `${pos.x}px`,
				top: `${pos.y}px`,
				width: `${size.width}px`,
				height: `${size.height + 40}px`,
		  };

	// enharmonic mapping (sharps -> flats)
	const enharmonic = {
		"C#": "Db",
		"D#": "Eb",
		"F#": "Gb",
		"G#": "Ab",
		"A#": "Bb",
	};

	// Render label for white keys (string) or black keys (two-line object)
	const renderWhiteLabel = (name) => {
	  return name || "";
	};
	
	const renderBlackLabelParts = (name) => {
	  const flat = enharmonic[name] || "";
	  return { sharp: name, flat };
	};

	// Compute white cell width from current size and render keys
	return (
		<div className="virtual-piano" style={containerStyle}>
			{/* drag handle */}
			<div className="drag-handle" onPointerDown={onDragStart} role="presentation" />

			{/* White Keys */}
			<div
				className="white-keys"
				ref={whiteKeysContainer}
				style={{ height: `${size.height}px` }}
			>
				{whiteKeys.map((note, idx) => (
					<div
						key={note.name}
						ref={(el) => (whiteKeyEls.current[idx] = el)}
						className={
							"key white " +
							(pressedKeys.includes(note.name) ? "pressed " : "") +
							(Array.isArray(highlightKeys) && highlightKeys.includes(note.name) ? "highlight" : "")
						}
						onPointerDown={() => playNote(note)}
						onPointerUp={() => stopNoteByName(note.name)}
						onPointerCancel={() => stopNoteByName(note.name)}
						onPointerLeave={() => stopNoteByName(note.name)}
						// keep mouse handlers as fallback for older browsers (pointer events preferred)
						onMouseDown={() => playNote(note)}
						onMouseUp={() => stopNoteByName(note.name)}
						onTouchStart={() => playNote(note)}
						onTouchEnd={() => stopNoteByName(note.name)}
					>
						{/* Render label only if not hidden */}
						{!hideLabels && <span className="label">{renderWhiteLabel(note.name)}</span>}
					</div>
				))}

				{/* Black keys: render only if not hidden */}
				{!hideBlackKeys &&
					containerSize.width > 0 &&
					blackKeys.map((key) => {
						const leftIdx = whiteKeys.findIndex((w) => w.name === key.leftWhite);
						const rightIdx = leftIdx + 1;
						if (leftIdx === -1 || rightIdx >= whiteKeys.length) return null;

						// Percent-based layout: center black key between white keys using percentage math
						const whiteCount = whiteKeys.length;
						const blackRatio = 0.62; // width relative to a white key
						const blackWidthPercent = (blackRatio * 100) / whiteCount; // percent of full container width
						const blackHeightPercent = 65; // percent of white key height
						// left position: center at seam between left and right white keys ( (leftIdx+1)/whiteCount )
						const seamPercent = ((leftIdx + 1) / whiteCount) * 100;
						// subtract half of black width (in percent) to center
						const leftCalc = `calc(${seamPercent}% - ${blackWidthPercent / 2}%)`;

						const parts = renderBlackLabelParts(key.name);
						return (
							<div
								key={key.name}
								className={
									"key black " +
									(pressedKeys.includes(key.name) ? "pressed " : "") +
									(Array.isArray(highlightKeys) && highlightKeys.includes(key.name) ? "highlight" : "")
								}
								style={{
									width: `${blackWidthPercent}%`,
									height: `${blackHeightPercent}%`,
									left: leftCalc,
									top: 0,
									position: "absolute",
								}}
								onPointerDown={() => playNote(key)}
								onPointerUp={() => stopNoteByName(key.name)}
								onPointerCancel={() => stopNoteByName(key.name)}
								onPointerLeave={() => stopNoteByName(key.name)}
								onMouseDown={() => playNote(key)}
								onMouseUp={() => stopNoteByName(key.name)}
								onTouchStart={() => playNote(key)}
								onTouchEnd={() => stopNoteByName(key.name)}
							>
								{/* Render split label only if not hidden */}
								{!hideLabels && (
									<span className="label">
										<span className="label-sharp">{parts.sharp}</span>
										<span className="label-flat">{parts.flat}</span>
									</span>
								)}
							</div>
						);
					})}
			</div>

			{/* resize handle (bottom-right) */}
			<div
				className="resize-handle"
				ref={resizeRef}
				onPointerDown={onResizeStart}
				role="presentation"
				aria-hidden="true"
			/>

			{/* red close X (render only when allowed) */}
			{!hideClose && (
				<button className="close-x" onClick={close} aria-label="Close piano">
					×
				</button>
			)}
		</div>
	);
}
