import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Error from "./pages/404";
import Layout from "./pages/Layout";
import Game from "./pages/Game";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:game_id" element={<Game />} />
        {/* 404 ERROR */}
        <Route path="/*" element={<Error />} />
      </Route>
    </Routes>
  );
}

export default App;
