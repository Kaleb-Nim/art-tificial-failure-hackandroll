import { Route, Routes } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Error from "./pages/404";
import Layout from "./pages/Layout";
import Game from "./pages/Game";
import Review from "./pages/Review";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:room_id" element={<Game />} />
        <Route path="/:round_id/review" element={<Review />} />
        {/* 404 ERROR */}
        <Route path="/*" element={<Error />} />
      </Route>
    </Routes>
  );
}

export default App;
