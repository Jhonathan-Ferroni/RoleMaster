import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function AprovacaoFichas() {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem("tenantId");

  const [personagens, setPersonagens] = useState([]);
  const [jogadoresMesa, setJogadoresMesa] = useState([]); // Lista de jogadores reais da mesa
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      navigate("/lobby");
      return;
    }
    carregarDados();
  }, [tenantId]);

  const carregarDados = async () => {
    try {
      // 1. Busca todas as fichas da mesa (Pendentes e Aprovadas)
      const respFichas = await api.get(
        `/characters/mesa/${tenantId}/pendentes`,
      );
      // OBS: Você precisará ajustar sua API para retornar TODOS da mesa, não só os pendentes!
      // Ex: await api.get(`/characters/mesa/${tenantId}`);
      setPersonagens(respFichas.data);

      // 2. Busca os jogadores aprovados na mesa para popular o Dropdown
      // Supondo que você tenha uma rota para listar quem está na mesa:
      const respJogadores = await api.get(`/mesas/${tenantId}/jogadores`);
      setJogadoresMesa(respJogadores.data);
    } catch (error) {
      console.error("Erro ao carregar dados da mesa:", error);
    } finally {
      setCarregando(false);
    }
  };

  const alterarStatus = async (id, status) => {
    try {
      await api.patch(`/characters/${id}/status`, status, {
        headers: { "Content-Type": "application/json" },
      });
      setPersonagens(
        personagens.map((p) => (p.id === id ? { ...p, status: status } : p)),
      );
    } catch (error) {
      alert("Falha ao julgar o personagem.");
    }
  };

  const atribuirJogador = async (fichaId, usuarioId) => {
    try {
      // Envia null se for "NPC", ou o ID do jogador
      await api.patch(`/characters/${fichaId}/atribuir`, usuarioId, {
        headers: { "Content-Type": "application/json" },
      });
      setPersonagens(
        personagens.map((p) =>
          p.id === fichaId ? { ...p, usuarioId: usuarioId } : p,
        ),
      );
      alert("Atribuição atualizada!");
    } catch (error) {
      alert("Erro ao transferir a posse da ficha.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-600 uppercase tracking-widest">
              Gestão de Personagens
            </h1>
            <p className="text-zinc-400 mt-2">
              Aprove, edite e delegue o controle das fichas da sua campanha.
            </p>
          </div>
          <button
            onClick={() => navigate("/campanha")}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            Voltar para Campanha
          </button>
        </div>

        {carregando ? (
          <p className="text-center text-zinc-500 animate-pulse mt-20">
            Consultando os pergaminhos...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personagens.map((ficha) => (
              <div
                key={ficha.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col shadow-xl overflow-hidden"
              >
                {/* CABEÇALHO DO CARD */}
                <div className="p-5 border-b border-zinc-800">
                  <div className="flex justify-between items-start mb-2">
                    <h2
                      className="text-xl font-bold text-white uppercase tracking-wider truncate"
                      title={ficha.nome}
                    >
                      {ficha.nome}
                    </h2>
                    {ficha.status === 0 ? (
                      <span className="bg-yellow-900/30 text-yellow-500 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-widest border border-yellow-900/50">
                        Pendente
                      </span>
                    ) : (
                      <span className="bg-emerald-900/30 text-emerald-500 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-widest border border-emerald-900/50">
                        Aprovado
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-500 text-xs font-semibold">
                    {ficha.classe} • Nível {ficha.nivel}
                  </p>
                </div>

                {/* ATRIBUIÇÃO DE JOGADOR */}
                <div className="p-4 bg-zinc-950/50 flex flex-col gap-2 border-b border-zinc-800">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">
                    Controlado por:
                  </label>
                  <select
                    value={ficha.usuarioId || ""}
                    onChange={(e) =>
                      atribuirJogador(
                        ficha.id,
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 text-sm rounded p-2 text-white outline-none focus:border-red-500"
                  >
                    <option value="">Ninguém (NPC / Sem Dono)</option>
                    {jogadoresMesa.map((jog) => (
                      <option key={jog.id} value={jog.id}>
                        {jog.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AÇÕES DA FICHA */}
                <div className="p-4 flex flex-col gap-3 mt-auto">
                  {/* Botões de Ver/Editar */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/ficha/${ficha.id}`)}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded transition-colors border border-zinc-700"
                    >
                      👁️ Ver Ficha
                    </button>
                    <button
                      onClick={() => navigate(`/ficha/${ficha.id}/editar`)}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded transition-colors border border-zinc-700"
                    >
                      ✏️ Editar
                    </button>
                  </div>

                  {/* Botões de Status */}
                  {ficha.status === 0 ? (
                    <div className="flex gap-2 pt-2 border-t border-zinc-800/50">
                      <button
                        onClick={() => alterarStatus(ficha.id, 2)}
                        className="flex-1 py-2 text-xs font-bold text-red-500 hover:bg-red-950/30 rounded transition-colors"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => alterarStatus(ficha.id, 1)}
                        className="flex-1 py-2 text-xs font-bold bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        Aprovar
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-zinc-800/50">
                      <button
                        onClick={() => alterarStatus(ficha.id, 0)}
                        className="w-full py-2 text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                      >
                        Voltar para Pendente
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
