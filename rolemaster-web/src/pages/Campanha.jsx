import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Campanha() {
  const [mesa, setMesa] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const navigate = useNavigate();
  const tenantId = localStorage.getItem("tenantId");

  const carregarSolicitacoes = async () => {
    try {
      const response = await api.get(`/mesas/${tenantId}/solicitacoes`);
      setSolicitacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
    }
  };

  const carregarMesa = async () => {
    try {
      const responseMesa = await api.get(`/mesas/${tenantId}`);
      setMesa(responseMesa.data);

      // Se for o mestre, já aproveitamos e carregamos as solicitações pendentes
      if (responseMesa.data.isMestre) {
        carregarSolicitacoes();
      }
    } catch (error) {
      alert("Erro ao carregar a mesa. O feitiço foi dissipado.");
      navigate("/lobby");
    }
  };

  useEffect(() => {
    if (!tenantId) {
      navigate("/lobby");
      return;
    }
    carregarMesa();
  }, [tenantId, navigate]);

  const voltarParaLobby = () => {
    localStorage.removeItem("tenantId");
    navigate("/lobby");
  };

  if (!mesa)
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Carregando pergaminhos...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={voltarParaLobby}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Voltar ao Lobby
            </button>
            <h1 className="text-2xl font-bold text-red-600 uppercase tracking-wider border-l border-zinc-700 pl-4">
              {mesa.nome}
            </h1>
          </div>
          <div className="text-sm text-zinc-500 font-mono">
            Código: {mesa.codigoConvite}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* ========================================== */}
        {/* VISÃO DO MESTRE                            */}
        {/* ========================================== */}
        {mesa.isMestre ? (
          <div className="space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center shadow-lg">
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">
                Painel do Mestre
              </h2>
              <p className="text-zinc-400 mb-8">
                Controle o destino dos seus aventureiros e prepare o mundo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() =>
                    alert("Em breve: Criador de NPC/Monstro/Personagem")
                  }
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-4 px-6 rounded-lg font-bold border border-zinc-700 transition-all shadow-md"
                >
                  🧙‍♂️ Criar Personagem/NPC
                </button>
                <button
                  onClick={() => alert("Em breve: Atribuição de Fichas")}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-4 px-6 rounded-lg font-bold border border-zinc-700 transition-all shadow-md"
                >
                  🔗 Gerenciar Controle
                </button>
                <button
                  onClick={() => navigate("/sessao-ativa")}
                  className="bg-red-700 hover:bg-red-600 text-white py-4 px-6 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20"
                >
                  ⚔️ Iniciar / Continuar Campanha
                </button>
              </div>
            </div>

            {/* Fila de aprovação de jogadores */}
            {solicitacoes.length > 0 && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-500 mb-4">
                  Aventureiros na Taverna ({solicitacoes.length})
                </h3>
                <p className="text-sm text-zinc-400">
                  Você tem solicitações pendentes. Libere a entrada deles para
                  começarem a enviar fichas.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ========================================== */
          /* VISÃO DO JOGADOR                           */
          /* ========================================== */
          <div className="space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-emerald-500 mb-2">
                Seus Personagens
              </h2>
              <p className="text-zinc-400 mb-6">
                Escolha um herói para esta jornada ou envie uma nova ficha para
                o Mestre aprovar.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer">
                  <span className="text-3xl mb-2">+</span>
                  <span className="font-bold">Submeter Nova Ficha</span>
                </div>
                {/* Aqui faremos o .map() das fichas do jogador futuramente */}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-300 mb-2">
                Aguardando Início da Sessão...
              </h3>
              <p className="text-zinc-500">
                Quando o mestre iniciar o encontro, você será convocado
                automaticamente para o grid.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
