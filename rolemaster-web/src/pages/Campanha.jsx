import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Campanha() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const navigate = useNavigate();

  // Pegamos o ID da mesa que foi salvo quando clicamos em "Entrar na Mesa" no Lobby
  const tenantId = localStorage.getItem("tenantId");

  const carregarSolicitacoes = async () => {
    try {
      // Bate na rota do Mestre para ver quem quer entrar
      const response = await api.get(`/mesas/${tenantId}/solicitacoes`);
      setSolicitacoes(response.data);
    } catch (error) {
      // Se cair no catch, provavelmente é porque o usuário é um jogador e não o Mestre (o backend retorna Forbid 403)
      console.log("Apenas o mestre visualiza convites pendentes.");
    }
  };

  useEffect(() => {
    if (!tenantId) {
      // Se tentar acessar a url direto sem escolher uma mesa, volta pro Lobby
      navigate("/lobby");
      return;
    }

    carregarSolicitacoes();
  }, [tenantId, navigate]);

  const handleAvaliar = async (solicitacaoId, aprovar) => {
    try {
      await api.put(
        `/mesas/avaliar-solicitacao/${solicitacaoId}?aprovar=${aprovar}`,
      );

      // Atualiza a tela removendo o jogador que acabou de ser avaliado
      setSolicitacoes(solicitacoes.filter((s) => s.id !== solicitacaoId));
    } catch (error) {
      alert("Erro ao avaliar a solicitação do jogador.");
    }
  };

  const voltarParaLobby = () => {
    localStorage.removeItem("tenantId"); // Limpa a mesa atual
    navigate("/lobby");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header da Mesa */}
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
              Mesa Ativa
            </h1>
          </div>
          <div className="text-sm text-zinc-500 font-mono">
            Tenant ID: {tenantId}
          </div>
        </div>
      </header>

      {/* Grid Principal da Campanha */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Coluna Central (Onde ficarão as fichas no futuro) */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center border-dashed">
            <h2 className="text-xl font-bold text-zinc-400 mb-2">
              Fichas de Personagem
            </h2>
            <p className="text-zinc-600 text-center max-w-md">
              O backend já está preparado para o Multi-Tenant. Em breve, as
              fichas da classe Character serão renderizadas aqui, completamente
              isoladas de outras mesas.
            </p>
          </div>
        </div>

        {/* Coluna Lateral (Painel do Mestre) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center justify-between">
              Solicitações
              {solicitacoes.length > 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  {solicitacoes.length}
                </span>
              )}
            </h3>

            {solicitacoes.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">
                Nenhum aventureiro na fila.
              </p>
            ) : (
              <ul className="space-y-4">
                {solicitacoes.map((s) => (
                  <li
                    key={s.id}
                    className="bg-zinc-950 p-3 rounded border border-zinc-800"
                  >
                    <p className="text-sm font-semibold text-zinc-200 mb-2">
                      {s.nomeJogador}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAvaliar(s.id, true)}
                        className="flex-1 bg-green-700/20 text-green-500 hover:bg-green-700 hover:text-white border border-green-900/50 py-1 rounded text-xs font-bold transition-colors"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleAvaliar(s.id, false)}
                        className="flex-1 bg-red-700/20 text-red-500 hover:bg-red-700 hover:text-white border border-red-900/50 py-1 rounded text-xs font-bold transition-colors"
                      >
                        Recusar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
