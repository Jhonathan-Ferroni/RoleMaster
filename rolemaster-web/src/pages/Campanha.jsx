import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { api, HUB_URL } from "../services/api";

export function Campanha() {
  const [mesa, setMesa] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [jogadoresMesa, setJogadoresMesa] = useState([]);
  const [conviteAberto, setConviteAberto] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [gerandoPadroes, setGerandoPadroes] = useState(false);

  const navigate = useNavigate();
  const tenantId = localStorage.getItem("tenantId");

  const carregarDados = useCallback(async () => {
    try {
      const responseMesa = await api.get(`/mesas/${tenantId}`);
      const dadosMesa = responseMesa.data;
      setMesa(dadosMesa);

      if (dadosMesa.isMestre) {
        const [resSol, resFichas, resJogadores] = await Promise.allSettled([
          api.get(`/mesas/${tenantId}/solicitacoes`),
          api.get(`/characters/mesa/${tenantId}`),
          api.get(`/mesas/${tenantId}/jogadores`),
        ]);
        if (resSol.status === "fulfilled") {
          setSolicitacoes(Array.isArray(resSol.value.data) ? resSol.value.data : []);
        }
        if (resFichas.status === "fulfilled") {
          setFichas(Array.isArray(resFichas.value.data) ? resFichas.value.data : []);
        }
        if (resJogadores.status === "fulfilled") {
          setJogadoresMesa(
            Array.isArray(resJogadores.value.data) ? resJogadores.value.data : []
          );
        }
      } else {
        const resMinhas = await api.get(`/characters/mesa/${tenantId}/minhas`);
        setFichas(Array.isArray(resMinhas.data) ? resMinhas.data : []);
      }
    } catch {
      navigate("/lobby");
    }
  }, [tenantId, navigate]);

  useEffect(() => {
    if (!tenantId) {
      navigate("/lobby");
      return;
    }

    let ativo = true;
    const inicializar = async () => {
      await Promise.resolve();
      if (ativo) {
        await carregarDados();
      }
    };
    void inicializar();

    return () => {
      ativo = false;
    };
  }, [tenantId, navigate, carregarDados]);

  useEffect(() => {
    if (!mesa || mesa.isMestre) return;

    const conexao = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    conexao
      .start()
      .then(async () => {
        if (tenantId) {
          await conexao.invoke("EntrarNaMesa", tenantId).catch(() => {});
        }
        conexao.on("ReceberConvocacao", () => setConviteAberto(true));
        conexao.on("ModoBatalhaAlterado", (emBatalha) => {
          if (emBatalha) setConviteAberto(true);
        });
      })
      .catch(() => {});

    return () => {
      conexao.stop().catch(() => {});
    };
  }, [mesa, tenantId]);

  const avaliarJogador = async (solicitacaoId, aprovar) => {
    try {
      await api.put(
        `/mesas/avaliar-solicitacao/${solicitacaoId}?aprovar=${aprovar}`
      );
      setSolicitacoes((prev) => prev.filter((s) => s.id !== solicitacaoId));
      if (aprovar) {
        const resJog = await api.get(`/mesas/${tenantId}/jogadores`).catch(() => null);
        if (resJog?.data) setJogadoresMesa(resJog.data);
      }
    } catch {
      // ignora
    }
  };

  const alterarStatusFicha = async (id, status) => {
    try {
      await api.patch(`/characters/${id}/status`, status, {
        headers: { "Content-Type": "application/json" },
      });
      setFichas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    } catch {
      // ignora
    }
  };

  const atribuirJogador = async (fichaId, usuarioId) => {
    try {
      await api.patch(`/characters/${fichaId}/atribuir`, usuarioId, {
        headers: { "Content-Type": "application/json" },
      });
      setFichas((prev) =>
        prev.map((p) => (p.id === fichaId ? { ...p, usuarioId } : p))
      );
    } catch {
      // ignora
    }
  };

  const carregarExemplosProntos = async () => {
    setGerandoPadroes(true);
    try {
      const res = await api.post(`/characters/mesa/${tenantId}/padroes`);
      if (Array.isArray(res.data)) setFichas(res.data);
    } catch {
      await carregarDados();
    } finally {
      setGerandoPadroes(false);
    }
  };

  const copiarCodigo = async () => {
    if (!mesa?.codigoConvite) return;
    try {
      await navigator.clipboard.writeText(mesa.codigoConvite);
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 1800);
    } catch {
      // ignora
    }
  };

  if (!mesa) {
    return (
      <div className="min-h-screen owlbear-canvas-bg text-zinc-400 flex items-center justify-center text-sm">
        Carregando sala...
      </div>
    );
  }

  return (
    <div className="min-h-screen owlbear-canvas-bg text-zinc-100 flex flex-col">
      {/* Aviso quando o Mestre chama para a mesa */}
      {conviteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-indigo-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">
              Sessão em andamento
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              O Mestre iniciou uma cena na mesa virtual. Deseja entrar agora?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConviteAberto(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl text-xs font-medium"
              >
                Depois
              </button>
              <button
                onClick={() => navigate("/sessao-ativa")}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs"
              >
                Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho Unificado */}
      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/lobby")}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors shrink-0"
            >
              ← Salas
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                {mesa.nome}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void copiarCodigo()}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 transition-colors"
              title="Copiar código para convidar amigos"
            >
              {codigoCopiado
                ? "✓ Código copiado"
                : `Convite: #${mesa.codigoConvite}`}
            </button>

            <button
              onClick={() => navigate("/sessao-ativa")}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-950/40"
            >
              Abrir Mesa →
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Solicitações de entrada pendentes (Mestre) */}
        {mesa.isMestre && solicitacoes.length > 0 && (
          <section className="bg-indigo-950/25 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-indigo-300">
                Pedidos para entrar na sala ({solicitacoes.length})
              </h2>
            </div>
            <div className="space-y-2">
              {solicitacoes.map((solic) => (
                <div
                  key={solic.id}
                  className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 border border-white/10 px-4 py-3 rounded-xl"
                >
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong>{solic.nomeJogador}</strong> pediu para participar
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void avaliarJogador(solic.id, false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => void avaliarJogador(solic.id, true)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Aceitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lista de Fichas / Personagens da Sala */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                {mesa.isMestre
                  ? `Personagens & Monstros (${fichas.length})`
                  : `Seus Personagens (${fichas.length})`}
              </h2>
              <p className="text-xs text-zinc-400">
                {mesa.isMestre
                  ? "Crie fichas, aprove personagens dos jogadores ou carregue exemplos prontos para usar no mapa."
                  : "Crie ou edite sua ficha para utilizá-la no tabuleiro."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {mesa.isMestre && (
                <button
                  onClick={() => void carregarExemplosProntos()}
                  disabled={gerandoPadroes}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-xs font-medium transition-colors"
                >
                  {gerandoPadroes ? "Carregando..." : "Carregar Exemplos Prontos"}
                </button>
              )}
              <button
                onClick={() => navigate("/criar-ficha?sistema=ano1")}
                className="px-4 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/50 border border-red-500/40 text-red-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>🧟</span>
                <span>+ Ficha Ano 1 (1950)</span>
              </button>
              <button
                onClick={() => navigate("/criar-ficha")}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                + Novo Personagem (D&D)
              </button>
            </div>
          </div>

          {fichas.length === 0 ? (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-10 text-center">
              <p className="text-sm text-zinc-300 font-medium mb-1">
                Nenhum personagem cadastrado ainda
              </p>
              <p className="text-xs text-zinc-500 mb-5">
                Você já pode abrir a mesa virtual livremente ou criar uma ficha agora.
              </p>
              <div className="flex justify-center gap-2">
                {mesa.isMestre && (
                  <button
                    onClick={() => void carregarExemplosProntos()}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
                  >
                    Adicionar Heróis & Monstros Prontos
                  </button>
                )}
                <button
                  onClick={() => navigate("/criar-ficha")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  + Criar Personagem
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fichas.map((ficha) => (
                <div
                  key={ficha.id}
                  className="bg-zinc-900/85 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">
                          {ficha.nome}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">
                          {ficha.raca || "Aventureiro"} • {ficha.classe || "Guerreiro"} (Nv{" "}
                          {ficha.nivel || 1})
                        </p>
                      </div>

                      {ficha.status === 0 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                          Aguardando
                        </span>
                      ) : ficha.status === 2 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 shrink-0">
                          Recusado
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Pronto
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-zinc-950/80 border border-white/5 py-1.5 rounded-xl">
                        <span className="block text-[10px] text-zinc-500">PV</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {ficha.pontosDeVidaAtuais}/{ficha.pontosDeVidaMaximos}
                        </span>
                      </div>
                      <div className="bg-zinc-950/80 border border-white/5 py-1.5 rounded-xl">
                        <span className="block text-[10px] text-zinc-500">CA</span>
                        <span className="text-xs font-bold text-zinc-100">
                          {ficha.classeArmadura}
                        </span>
                      </div>
                      <div className="bg-zinc-950/80 border border-white/5 py-1.5 rounded-xl">
                        <span className="block text-[10px] text-zinc-500">Mov.</span>
                        <span className="text-xs font-bold text-sky-400">
                          {ficha.deslocamento || 9}m
                        </span>
                      </div>
                    </div>

                    {/* Controle de dono da ficha (apenas Mestre) */}
                    {mesa.isMestre && (
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1">
                          Controlado por
                        </label>
                        <select
                          value={ficha.usuarioId || ""}
                          onChange={(e) =>
                            void atribuirJogador(
                              ficha.id,
                              e.target.value ? parseInt(e.target.value, 10) : null
                            )
                          }
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Mestre (NPC / Monstro)</option>
                          {jogadoresMesa.map((jog) => (
                            <option key={jog.id} value={jog.id}>
                              {jog.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate(`/ficha/${ficha.id}`)}
                        className="py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => navigate(`/ficha/${ficha.id}/editar`)}
                        className="py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-indigo-300 text-xs font-medium transition-colors"
                      >
                        Editar
                      </button>
                    </div>

                    {mesa.isMestre && ficha.status === 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => void alterarStatusFicha(ficha.id, 2)}
                          className="py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => void alterarStatusFicha(ficha.id, 1)}
                          className="py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          Aprovar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
