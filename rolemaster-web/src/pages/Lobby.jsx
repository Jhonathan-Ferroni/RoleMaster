import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { api } from "../services/api";

const obterNomeUsuarioDoToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return "";
  try {
    const decoded = jwtDecode(token);
    const claimNome =
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
    return decoded[claimNome] || "Jogador";
  } catch {
    return "";
  }
};

export function Lobby() {
  const [nomeUsuario] = useState(obterNomeUsuarioDoToken);
  const [mesas, setMesas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [codigoCopiado, setCodigoCopiado] = useState("");

  // Modais limpos no lugar de window.prompt()
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [nomeNovaSala, setNomeNovaSala] = useState("");
  const [modalEntrarAberto, setModalEntrarAberto] = useState(false);
  const [codigoConviteInput, setCodigoConviteInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const navigate = useNavigate();

  const mostrarAviso = (texto, tipo = "sucesso") => {
    setFeedback({ texto, tipo });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchMesas = async () => {
    setCarregando(true);
    try {
      const response = await api.get("/mesas");
      setMesas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !nomeUsuario) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    let ativo = true;
    api
      .get("/mesas")
      .then((response) => {
        if (ativo) {
          setMesas(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar salas:", error);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [navigate, nomeUsuario]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    navigate("/login");
  };

  const abrirMesaDireto = (tenantId) => {
    if (!tenantId) return;
    localStorage.setItem("tenantId", tenantId);
    navigate("/sessao-ativa");
  };

  const abrirGestaoSala = (tenantId) => {
    if (!tenantId) return;
    localStorage.setItem("tenantId", tenantId);
    navigate("/campanha");
  };

  const handleCriarSala = async (e) => {
    e.preventDefault();
    if (!nomeNovaSala.trim()) return;
    setEnviando(true);
    try {
      await api.post("/mesas", { nome: nomeNovaSala.trim() });
      setNomeNovaSala("");
      setModalCriarAberto(false);
      await fetchMesas();
      mostrarAviso("Sala criada com sucesso!");
    } catch {
      mostrarAviso("Não foi possível criar a sala.", "erro");
    } finally {
      setEnviando(false);
    }
  };

  const handleSolicitarEntrada = async (e) => {
    e.preventDefault();
    const codigo = codigoConviteInput.trim().toUpperCase();
    if (!codigo) return;
    setEnviando(true);
    try {
      await api.post(`/mesas/solicitar-entrada/${codigo}`);
      setCodigoConviteInput("");
      setModalEntrarAberto(false);
      mostrarAviso("Pedido enviado! Aguarde o Mestre aceitar sua entrada.");
    } catch (error) {
      const msg =
        typeof error.response?.data === "string"
          ? error.response.data
          : "Código inválido ou solicitação já enviada.";
      mostrarAviso(msg, "erro");
    } finally {
      setEnviando(false);
    }
  };

  const copiarCodigo = async (codigo) => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCodigoCopiado(codigo);
      setTimeout(() => setCodigoCopiado(""), 1800);
    } catch {
      mostrarAviso(`Código da sala: ${codigo}`);
    }
  };

  return (
    <div className="min-h-screen owlbear-canvas-bg text-zinc-100">
      {/* Toast flutuante discreto */}
      {feedback && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md text-xs font-medium bg-zinc-900/95 border-white/10 text-zinc-100 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              feedback.tipo === "erro" ? "bg-red-400" : "bg-emerald-400"
            }`}
          />
          <span>{feedback.texto}</span>
        </div>
      )}

      {/* Modal Nova Sala */}
      {modalCriarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCriarSala}
            className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Nova Sala</h3>
              <button
                type="button"
                onClick={() => setModalCriarAberto(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Nome da sala ou aventura
              </label>
              <input
                autoFocus
                type="text"
                value={nomeNovaSala}
                onChange={(e) => setNomeNovaSala(e.target.value)}
                placeholder="Ex: Mina Perdida de Phandelver"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalCriarAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                {enviando ? "Criando..." : "Criar Sala"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Entrar com Código */}
      {modalEntrarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSolicitarEntrada}
            className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Entrar em uma Sala
              </h3>
              <button
                type="button"
                onClick={() => setModalEntrarAberto(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Código de convite (6 caracteres)
              </label>
              <input
                autoFocus
                type="text"
                maxLength={10}
                value={codigoConviteInput}
                onChange={(e) =>
                  setCodigoConviteInput(e.target.value.toUpperCase())
                }
                placeholder="Ex: 8F3A9C"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase tracking-widest text-center text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalEntrarAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                {enviando ? "Enviando..." : "Pedir Entrada"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra superior limpa */}
      <header className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-sm">
              🎲
            </div>
            <span className="font-bold text-white tracking-tight">
              RoleMaster
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Olá, <strong className="text-zinc-200">{nomeUsuario}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Suas Salas
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Escolha uma sala para abrir o tabuleiro ou entre com o código de um amigo.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setModalEntrarAberto(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl border border-white/10 transition-colors"
            >
              Entrar com Código
            </button>
            <button
              onClick={() => setModalCriarAberto(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-950/50"
            >
              + Nova Sala
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="text-center py-20 text-zinc-500 text-sm">
            Carregando salas...
          </div>
        ) : mesas.length === 0 ? (
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-10 text-center max-w-md mx-auto">
            <div className="text-3xl mb-3">🗺️</div>
            <h2 className="text-base font-bold text-white mb-1">
              Nenhuma sala por aqui ainda
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Crie uma sala para abrir seu mapa em segundos ou peça o código de convite ao Mestre.
            </p>
            <div className="flex justify-center gap-2.5">
              <button
                onClick={() => setModalEntrarAberto(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl"
              >
                Usar Código
              </button>
              <button
                onClick={() => setModalCriarAberto(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                + Nova Sala
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mesas.map((mesa) => {
              const codigo = mesa.codigoConvite || mesa.CodigoConvite;
              const nome = mesa.nome || mesa.Nome;
              const mestre = Boolean(mesa.isMestre || mesa.IsMestre);

              return (
                <div
                  key={codigo}
                  className="group bg-zinc-900/85 backdrop-blur-sm border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          mestre
                            ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                            : "bg-zinc-800 text-zinc-300 border-white/10"
                        }`}
                      >
                        {mestre ? "Mestre" : "Jogador"}
                      </span>

                      <button
                        type="button"
                        onClick={() => void copiarCodigo(codigo)}
                        title="Copiar código de convite"
                        className="text-[11px] font-mono bg-zinc-950/90 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
                      >
                        {codigoCopiado === codigo ? "✓ Copiado" : `#${codigo}`}
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-5">
                      {nome}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => abrirMesaDireto(codigo)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors"
                    >
                      Abrir Mesa
                    </button>
                    <button
                      onClick={() => abrirGestaoSala(codigo)}
                      title="Gerenciar personagens e jogadores"
                      className="bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-medium py-2.5 px-3 rounded-xl border border-white/5 transition-colors"
                    >
                      Fichas
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
