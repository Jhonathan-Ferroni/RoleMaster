import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { api } from "../services/api";

const BACKEND_URL = "https://rolemaster-ioyd.onrender.com";

export function Campanha() {
  const [mesa, setMesa] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [conviteAberto, setConviteAberto] = useState(false); // NOVO: Controla se o convite apareceu
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

  // ==========================================
  // NOVO: RADAR DO JOGADOR (SIGNALR NO LOBBY)
  // ==========================================
  useEffect(() => {
    // Se a mesa ainda não carregou ou se for o Mestre, não precisa ligar o radar aqui
    if (!mesa || mesa.isMestre) return;

    const conexao = new HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/campanhaHub`)
      .withAutomaticReconnect()
      .build();

    conexao
      .start()
      .then(() => {
        // Jogador entra no grupo da mesa para ouvir
        conexao.invoke("EntrarNaMesa", tenantId);

        // Fica escutando a trombeta do Mestre
        conexao.on("ReceberConvocacao", () => {
          setConviteAberto(true); // Abre o Modal na cara do jogador!
        });
      })
      .catch((err) => console.error("Erro no radar da Taverna:", err));

    return () => {
      conexao.stop();
    };
  }, [mesa, tenantId]);

  const avaliarJogador = async (solicitacaoId, aprovar) => {
    try {
      await api.put(
        `/mesas/avaliar-solicitacao/${solicitacaoId}?aprovar=${aprovar}`,
      );
      setSolicitacoes(solicitacoes.filter((s) => s.id !== solicitacaoId));
      alert(
        aprovar ? "Jogador aceito na guilda!" : "Jogador expulso da taverna.",
      );
    } catch (error) {
      console.error("Erro ao avaliar jogador:", error);
      alert("Erro ao avaliar o jogador.");
    }
  };

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative">
      {/* ========================================== */}
      {/* NOVO: MODAL DE CONVITE PARA O GRID          */}
      {/* ========================================== */}
      {conviteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-900 rounded-xl p-8 max-w-md text-center shadow-[0_0_50px_rgba(185,28,28,0.3)] animate-pulse">
            <h2 className="text-3xl font-bold text-red-500 mb-4">
              ⚔️ A Batalha Vai Começar!
            </h2>
            <p className="text-zinc-300 mb-8 font-medium text-lg">
              O Mestre tocou a trombeta e está te convocando para o grid. Deseja
              ingressar na sessão agora?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/sessao-ativa")}
                className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
              >
                Atender ao Chamado
              </button>
              <button
                onClick={() => setConviteAberto(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-2 px-6 rounded-lg transition-colors border border-zinc-700"
              >
                Aguardar na Taverna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* O resto do seu visual padrão do Cabeçalho e Main... */}
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
                  onClick={() => navigate("/criar-ficha")}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-4 px-6 rounded-lg font-bold border border-zinc-700 transition-all shadow-md"
                >
                  🧙‍♂️ Criar Personagem/NPC
                </button>
                <button
                  onClick={() => navigate("/aprovacao-fichas")}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-4 px-6 rounded-lg font-bold border border-zinc-700 transition-all shadow-md"
                >
                  🔗 Aprovar Fichas
                </button>
                <button
                  onClick={() => navigate("/sessao-ativa")}
                  className="bg-red-700 hover:bg-red-600 text-white py-4 px-6 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20"
                >
                  ⚔️ Iniciar / Continuar Campanha
                </button>
              </div>
            </div>

            {solicitacoes.length > 0 && (
              <div className="bg-red-900/10 border border-red-900/40 rounded-xl p-6">
                <h3 className="text-xl font-bold text-red-500 mb-2">
                  Aventureiros na Taverna ({solicitacoes.length})
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Você tem solicitações pendentes. Libere a entrada deles para
                  começarem a enviar fichas.
                </p>
                <div className="space-y-3">
                  {solicitacoes.map((solic) => (
                    <div
                      key={solic.id}
                      className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg shadow-sm"
                    >
                      <span className="text-zinc-300">
                        🧙‍♂️ O jogador{" "}
                        <strong className="text-white text-lg ml-1 mr-1">
                          {solic.nomeJogador}
                        </strong>{" "}
                        quer entrar na guilda!
                      </span>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => avaliarJogador(solic.id, true)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-md font-semibold transition-colors"
                        >
                          Permitir
                        </button>
                        <button
                          onClick={() => avaliarJogador(solic.id, false)}
                          className="bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white px-5 py-2 rounded-md font-semibold transition-colors border border-zinc-700 hover:border-red-500"
                        >
                          Expulsar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
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
                <div
                  onClick={() => navigate("/criar-ficha")}
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer"
                >
                  <span className="text-3xl mb-2">+</span>
                  <span className="font-bold">Submeter Nova Ficha</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-zinc-300 mb-2">
                Aguardando Início da Sessão...
              </h3>
              <p className="text-zinc-500">
                Mantenha seus machados afiados. Quando o mestre iniciar o
                encontro, o chamado surgirá nesta tela.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
