import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Lobby } from "./pages/Lobby";
import { Campanha } from "./pages/Campanha";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/campanha" element={<Campanha />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
