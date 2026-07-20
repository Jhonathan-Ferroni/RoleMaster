import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { Lobby } from "./pages/Lobby";
import { Campanha } from "./pages/Campanha";
import { SessaoAtiva } from "./pages/SessaoAtiva";
import { CriarFicha } from "./pages/CriarFicha";
import { AprovacaoFichas } from "./pages/AprovacaoFichas";

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
        <Route path="/criar-ficha" element={<CriarFicha />} />
        <Route path="/ficha/:id" element={<CriarFicha />} />
        <Route path="/ficha/:id/editar" element={<CriarFicha />} />
        <Route path="/aprovacao-fichas" element={<AprovacaoFichas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
