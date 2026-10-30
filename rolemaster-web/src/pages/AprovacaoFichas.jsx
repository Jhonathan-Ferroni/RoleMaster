import { Navigate } from "react-router-dom";

// Redireciona de forma limpa para a tela unificada da sala (Campanha)
export function AprovacaoFichas() {
  return <Navigate to="/campanha" replace />;
}
