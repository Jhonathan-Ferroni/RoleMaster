import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { api, HUB_URL } from "../services/api";

export function Campanha() {
  const [mesa, setMesa] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [minhasFichas, setMinhasFichas] = useState([]);
  const [conviteAberto, setConviteAberto] = useState(false);
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

  const carregarMinhasFichas = async () => {
    try {
      const response = await api.get(`/characters/mesa/${tenantId}/minhas`);
      setMinhasFichas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar fichas do jogador:", error);
    }
  };

  const carregarMesa = async () => {
    try {
      const responseMesa = await api.get(`/mesas/${tenantId}`);
      setMesa(responseMesa.data);

      if (responseMesa.data.isMestre) {
        carregarSolicitacoes();
      } else {
        carregarMinhasFichas();
      }
    } catch {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, navigate]);

  // ==========================================
  // RADAR DO JOGADOR (SIGNALR NO LOBBY)
  // ==========================================
  useEffect(() => {
    if (!mesa || mesa.isMestre) return;

    const conexao = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await conexao.start();

        if (tenantId) {
          try {
            await conexao.invoke("EntrarNaMesa", tenantId);
          } catch (err) {
            console.error("Falha ao invocar EntrarNaMesa:", err);
          }
        }

        conexao.on("ReceberConvocacao", () => {
          setConviteAberto(true);
        });

        conexao.on("ModoBatalhaAlterado", (emBatalha) => {
          if (emBatalha) setConviteAberto(true);
        });

        conexao.onreconnected(async () => {
          if (tenantId) {
            try {
              await conexao.invoke("EntrarNaMesa", tenantId);
            } catch (err) {
              console.error("Erro ao reentrar no grupo após reconexão:", err);
            }
          }
        });
      } catch (err) {
        console.error("Erro no radar da Taverna:", err);
      }
    };

    startConnection();

    return () => {
      conexao.stop().catch(() => {});
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
      {/* MODAL DE CONVITE PARA O GRID */}
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
                  🔗 Gerenciar & Aprovar Fichas
                </button>
                <button
                  onClick={() => navigate("/sessao-ativa")}
                  className="bg-red-700 hover:bg-red-600 text-white py-4 px-6 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20"
                >
                  ⚔️ Iniciar Storytelling / Batalha
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
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-500 mb-1">
                    Seus Personagens ({minhasFichas.length})
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    Gerencie seus heróis desta campanha ou submeta uma nova ficha para o Mestre.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {minhasFichas.map((ficha) => (
                  <div
                    key={ficha.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white uppercase truncate">
                          {ficha.nome}
                        </h3>
                        {ficha.status === 0 ? (
                          <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Pendente
                          </span>
                        ) : ficha.status === 1 ? (
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Aprovado
                          </span>
                        ) : (
                          <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Rejeitado
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mb-4">
                        {ficha.raca || "Aventureiro"} • {ficha.classe || "Guerreiro"}{" "}
                        (Nv {ficha.nivel || 1})
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded">
                          <span className="block text-[9px] text-zinc-500 uppercase">
                            PV
                          </span>
                          <span className="text-sm font-bold text-emerald-400">
                            {ficha.pontosDeVidaAtuais}/{ficha.pontosDeVidaMaximos}
                          </span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded">
                          <span className="block text-[9px] text-zinc-500 uppercase">
                            CA
                          </span>
                          <span className="text-sm font-bold text-white">
                            🛡️ {ficha.classeArmadura}
                          </span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded">
                          <span className="block text-[9px] text-zinc-500 uppercase">
                            Desloc.
                          </span>
                          <span className="text-sm font-bold text-sky-400">
                            {ficha.deslocamento || 9}m
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800">
                      <button
                        onClick={() => navigate(`/ficha/${ficha.id}`)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded text-xs font-bold border border-zinc-700 transition-colors"
                      >
                        📜 Ver Ficha
                      </button>
                      <button
                        onClick={() => navigate(`/ficha/${ficha.id}/editar`)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 py-2 rounded text-xs font-bold border border-zinc-700 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                ))}

                <div
                  onClick={() => navigate("/criar-ficha")}
                  className="border-2 border-dashed border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer min-h-[190px]"
                >
                  <span className="text-3xl mb-2">+</span>
                  <span className="font-bold">Submeter Nova Ficha</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center space-y-4">
              <h3 className="text-xl font-bold text-zinc-300">
                Sessão & Tabuleiro de Batalha
              </h3>
              <p className="text-zinc-500">
                Mantenha seus machados afiados. Quando o mestre iniciar o
                encontro, o chamado surgirá nesta tela, ou você já pode entrar na sala ativa.
              </p>
              <button
                onClick={() => navigate("/sessao-ativa")}
                className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-red-900/20"
              >
                ⚔️ Entrar na Sessão / Tabuleiro
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
