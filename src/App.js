import { BrowserRouter, Routes, Route } from "react-router-dom";
import InstrumentSelect from "./pages/InstrumentSelect";
import PianoModule from "./pages/PianoModule";
import Lesson1 from "./pages/lessons/Lesson1";
import Lesson2 from "./pages/lessons/Lesson2"; // <-- added import

export default function App() {
	return (
		<BrowserRouter basename={process.env.PUBLIC_URL}>
			<Routes>
				<Route path="/" element={<InstrumentSelect />} />
				<Route path="/piano" element={<PianoModule />} />
				<Route path="/lesson/1" element={<Lesson1 />} />
				<Route path="/lesson/2" element={<Lesson2 />} /> {/* <-- new route */}
			</Routes>
		</BrowserRouter>
	);
}
