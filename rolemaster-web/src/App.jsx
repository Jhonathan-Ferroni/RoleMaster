import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { Lobby } from "./pages/Lobby";
import { Campanha } from "./pages/Campanha";
import { SessaoAtiva } from "./pages/SessaoAtiva";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/campanha" element={<Campanha />} />
        <Route path="/sessao-ativa" element={<SessaoAtiva />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
