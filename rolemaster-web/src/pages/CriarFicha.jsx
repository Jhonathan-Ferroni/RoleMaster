import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { CriadorFichaAnoUm } from "../components/CriadorFichaAnoUm";
import { ESTADO_INICIAL_ANO_UM } from "../data/anoUmPresets";

const MODELOS_RAPIDOS = [
  {
    id: "guerreiro",
    icone: "🛡️",
    rotulo: "Guerreiro",
    dados: {
      classe: "Guerreiro",
      raca: "Humano",
      nivel: 1,
      forca: 16,
      destreza: 12,
      constituicao: 15,
      inteligencia: 10,
      sabedoria: 11,
      carisma: 10,
      classeArmadura: 17,
      iniciativa: 1,
      deslocamento: 9,
      pontosDeVidaMaximos: 14,
      pontosDeVidaAtuais: 14,
      dadoDeVida: "1d10",
      equipamento: [
        { name: "Espada Longa", damage: "1d8", properties: "Corpo a Corpo (1.5m)" },
        { name: "Besta Leve", damage: "1d8", properties: "Distância (12m)" },
      ],
      magia: [
        {
          name: "Retomar o Fôlego",
          slot: 1,
          properties: "cura:1d10+1:1.5",
          description: "Recupera 1d10+1 PV no combate.",
        },
      ],
    },
  },
  {
    id: "mago",
    icone: "🧙‍♂️",
    rotulo: "Mago",
    dados: {
      classe: "Mago",
      raca: "Elfo",
      nivel: 1,
      forca: 8,
      destreza: 14,
      constituicao: 12,
      inteligencia: 16,
      sabedoria: 12,
      carisma: 10,
      classeArmadura: 13,
      iniciativa: 2,
      deslocamento: 9,
      pontosDeVidaMaximos: 9,
      pontosDeVidaAtuais: 9,
      dadoDeVida: "1d6",
      equipamento: [
        { name: "Cajado Arcano", damage: "1d6", properties: "Corpo a Corpo (1.5m)" },
      ],
      magia: [
        {
          name: "Raio de Fogo",
          slot: 0,
          properties: "ataque:1d10:18",
          description: "Disparo flamejante a até 18m (1d10).",
        },
        {
          name: "Mísseis Mágicos",
          slot: 1,
          properties: "ataque:3d4+3:18",
          description: "Dardos arcanos certeiros (3d4+3).",
        },
      ],
    },
  },
  {
    id: "clerigo",
    icone: "✨",
    rotulo: "Clérigo",
    dados: {
      classe: "Clérigo",
      raca: "Anão",
      nivel: 1,
      forca: 14,
      destreza: 10,
      constituicao: 14,
      inteligencia: 10,
      sabedoria: 16,
      carisma: 12,
      classeArmadura: 16,
      iniciativa: 0,
      deslocamento: 7.5,
      pontosDeVidaMaximos: 12,
      pontosDeVidaAtuais: 12,
      dadoDeVida: "1d8",
      equipamento: [
        { name: "Maça Sagrada", damage: "1d6", properties: "Corpo a Corpo (1.5m)" },
      ],
      magia: [
        {
          name: "Curar Ferimentos",
          slot: 1,
          properties: "cura:1d8+3:4.5",
          description: "Restaura 1d8+3 PV de um aliado.",
        },
        {
          name: "Chama Sagrada",
          slot: 0,
          properties: "ataque:1d8:18",
          description: "Luz radiante a até 18m (1d8).",
        },
      ],
    },
  },
  {
    id: "ladino",
    icone: "🗡️",
    rotulo: "Ladino",
    dados: {
      classe: "Ladino",
      raca: "Halfling",
      nivel: 1,
      forca: 10,
      destreza: 16,
      constituicao: 12,
      inteligencia: 13,
      sabedoria: 12,
      carisma: 14,
      classeArmadura: 14,
      iniciativa: 3,
      deslocamento: 9,
      pontosDeVidaMaximos: 10,
      pontosDeVidaAtuais: 10,
      dadoDeVida: "1d8",
      equipamento: [
        { name: "Rapieira", damage: "1d8", properties: "Acuidade, Corpo a Corpo (1.5m)" },
        { name: "Arco Curto", damage: "1d6", properties: "Distância (15m)" },
      ],
      magia: [],
    },
  },
  {
    id: "monstro",
    icone: "👹",
    rotulo: "Monstro / NPC",
    dados: {
      classe: "Inimigo",
      raca: "Criatura",
      nivel: 1,
      forca: 14,
      destreza: 13,
      constituicao: 13,
      inteligencia: 8,
      sabedoria: 10,
      carisma: 8,
      classeArmadura: 13,
      iniciativa: 1,
      deslocamento: 9,
      pontosDeVidaMaximos: 15,
      pontosDeVidaAtuais: 15,
      dadoDeVida: "2d8",
      equipamento: [
        { name: "Cimitarra", damage: "1d6", properties: "Corpo a Corpo (1.5m)" },
        { name: "Arco Curto", damage: "1d6", properties: "Distância (12m)" },
      ],
      magia: [],
    },
  },
];

const ARMAS_RAPIDAS = [
  { name: "Espada Longa", damage: "1d8", properties: "Corpo a Corpo (1.5m)" },
  { name: "Machado Grande", damage: "1d12", properties: "Pesado, Corpo a Corpo (1.5m)" },
  { name: "Rapieira", damage: "1d8", properties: "Acuidade, Corpo a Corpo (1.5m)" },
  { name: "Adaga", damage: "1d4", properties: "Acuidade, Arremesso (6m)" },
  { name: "Arco Longo", damage: "1d8", properties: "Distância (18m)" },
  { name: "Besta Leve", damage: "1d8", properties: "Distância (12m)" },
];

const MAGIAS_RAPIDAS = [
  { name: "Raio de Fogo", slot: 0, properties: "ataque:1d10:18", description: "Disparo de fogo a até 18m (1d10)." },
  { name: "Mísseis Mágicos", slot: 1, properties: "ataque:3d4+3:18", description: "Dardos arcanos certeiros (3d4+3)." },
  { name: "Curar Ferimentos", slot: 1, properties: "cura:1d8+3:4.5", description: "Restaura 1d8+3 PV." },
  { name: "Palavra Curativa", slot: 1, properties: "cura:1d4+3:18", description: "Cura rápida a 18m (1d4+3 PV)." },
  { name: "Bola de Fogo", slot: 3, properties: "ataque:8d6:18", description: "Explosão de chamas (8d6)." },
];

const PERICIAS_LISTA = [
  { key: "acrobacia", label: "Acrobacia" },
  { key: "arcanismo", label: "Arcanismo" },
  { key: "atletismo", label: "Atletismo" },
  { key: "atuacao", label: "Atuação" },
  { key: "enganacao", label: "Enganação" },
  { key: "furtividade", label: "Furtividade" },
  { key: "historia", label: "História" },
  { key: "intimidacao", label: "Intimidação" },
  { key: "intuicao", label: "Intuição" },
  { key: "investigacao", label: "Investigação" },
  { key: "lidarComAnimais", label: "Lidar com Animais" },
  { key: "medicina", label: "Medicina" },
  { key: "natureza", label: "Natureza" },
  { key: "percepcao", label: "Percepção" },
  { key: "persuasao", label: "Persuasão" },
  { key: "prestidigitacao", label: "Prestidigitação" },
  { key: "religiao", label: "Religião" },
  { key: "sobrevivencia", label: "Sobrevivência" },
];

export function CriarFicha() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const tenantId = localStorage.getItem("tenantId");

  const isEdit = location.pathname.endsWith("/editar");
  const isReadOnly = Boolean(id && !isEdit);

  const queryParams = new URLSearchParams(location.search);
  const [sistemaFicha, setSistemaFicha] = useState(() =>
    queryParams.get("sistema") === "ano1" ? "ano1" : "dnd5e"
  );
  const [dadosAnoUmCarregados, setDadosAnoUmCarregados] = useState(null);

  const [abaAtiva, setAbaAtiva] = useState("essencial"); // 'essencial' | 'combate' | 'detalhes'
  const [carregando, setCarregando] = useState(Boolean(id));
  const [enviando, setEnviando] = useState(false);

  const [ficha, setFicha] = useState({
    nome: "",
    classe: "Guerreiro",
    raca: "Humano",
    nivel: 1,
    alinhamento: "",
    antecedente: "",
    nomeDoJogador: "",
    pontosDeExperiencia: 0,
    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    carisma: 10,
    inspiracao: 0,
    bonusProficiencia: 2,
    classeArmadura: 12,
    iniciativa: 0,
    deslocamento: 9,
    sabedoriaPassivaPercepcao: 10,
    pontosDeVidaMaximos: 12,
    pontosDeVidaAtuais: 12,
    pontosDeVidaTemporarios: 0,
    dadoDeVida: "1d8",
    salvaGuardaForca: false,
    salvaGuardaDestreza: false,
    salvaGuardaConstituicao: false,
    salvaGuardaInteligencia: false,
    salvaGuardaSabedoria: false,
    salvaGuardaCarisma: false,
    acrobacia: 0,
    arcanismo: 0,
    atletismo: 0,
    atuacao: 0,
    enganacao: 0,
    furtividade: 0,
    historia: 0,
    intimidacao: 0,
    intuicao: 0,
    investigacao: 0,
    lidarComAnimais: 0,
    medicina: 0,
    natureza: 0,
    percepcao: 0,
    persuasao: 0,
    prestidigitacao: 0,
    religiao: 0,
    sobrevivencia: 0,
    tracosDePersonalidade: "",
    ideais: "",
    vinculos: "",
    fraquezas: "",
    idade: "",
    altura: "",
    peso: "",
    corDosOlhos: "",
    corDaPele: "",
    corDoCabelo: "",
    aparenciaDoPersonagem: "",
    aliadosEOrganizacoes: "",
    historiaDoPersonagem: "",
    outrasProficienciasEIdiomas: "",
    tesouros: "",
    caracteristicasETalentos: "",
    equipamento: [],
    magia: [],
  });

  const [novaArma, setNovaArma] = useState({
    name: "",
    damage: "1d8",
    properties: "Corpo a Corpo (1.5m)",
  });

  const [novaMagia, setNovaMagia] = useState({
    name: "",
    slot: 1,
    tipoAcao: "ataque",
    dados: "2d6",
    alcance: "15",
    description: "",
  });

  useEffect(() => {
    if (!tenantId && !id && sistemaFicha !== "ano1") {
      navigate("/lobby");
      return;
    }
    if (!id) return;

    let ativo = true;
    api
      .get(`/characters/${id}`)
      .then((response) => {
        if (!ativo) return;
        const dadosTratados = { ...response.data };
        Object.keys(dadosTratados).forEach((key) => {
          if (dadosTratados[key] === null) dadosTratados[key] = "";
        });
        if (!Array.isArray(dadosTratados.equipamento))
          dadosTratados.equipamento = [];
        if (!Array.isArray(dadosTratados.magia)) dadosTratados.magia = [];
        setFicha(dadosTratados);

        // Detecta automaticamente se a ficha salva pertence ao sistema Ano Um (1950)
        try {
          if (
            dadosTratados.outrasProficienciasEIdiomas &&
            String(dadosTratados.outrasProficienciasEIdiomas).startsWith("{")
          ) {
            const parsedAno1 = JSON.parse(
              dadosTratados.outrasProficienciasEIdiomas
            );
            if (parsedAno1?.sistema === "ano1") {
              setDadosAnoUmCarregados({
                ...ESTADO_INICIAL_ANO_UM,
                ...parsedAno1,
                nome: dadosTratados.nome || parsedAno1.nome,
                retratoBase64:
                  dadosTratados.aparenciaDoPersonagem ||
                  parsedAno1.retratoBase64 ||
                  "",
              });
              setSistemaFicha("ano1");
            }
          }
        } catch {
          // Ficha D&D padrão
        }
      })
      .catch(() => {
        if (ativo) navigate(-1);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, tenantId, navigate, sistemaFicha]);

  const getMod = (valor) => Math.floor((Number(valor || 10) - 10) / 2);
  const exibeMod = (valor) => {
    const mod = getMod(valor);
    return mod >= 0 ? `+${mod}` : mod;
  };

  const aplicarModeloRapido = (modelo) => {
    if (isReadOnly) return;
    setFicha((prev) => ({
      ...prev,
      ...modelo.dados,
      nome: prev.nome || modelo.rotulo,
    }));
  };

  const handleChange = (e) => {
    if (isReadOnly) return;
    const { name, value, type, checked } = e.target;
    setFicha((prev) => {
      const atualizado = {
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
              ? Number(value)
              : value,
      };
      if (name === "pontosDeVidaMaximos" && !id) {
        atualizado.pontosDeVidaAtuais = Number(value);
      }
      return atualizado;
    });
  };

  const adicionarArma = (armaObj) => {
    if (isReadOnly) return;
    const item = armaObj || novaArma;
    if (!item.name.trim()) return;

    setFicha((prev) => ({
      ...prev,
      equipamento: [
        ...(prev.equipamento || []),
        {
          name: item.name.trim(),
          damage: item.damage.trim() || "1d6",
          properties: item.properties.trim() || "Corpo a Corpo (1.5m)",
        },
      ],
    }));

    if (!armaObj) {
      setNovaArma({ name: "", damage: "1d8", properties: "Corpo a Corpo (1.5m)" });
    }
  };

  const removerArma = (idx) => {
    if (isReadOnly) return;
    setFicha((prev) => ({
      ...prev,
      equipamento: (prev.equipamento || []).filter((_, i) => i !== idx),
    }));
  };

  const adicionarMagia = (magiaPreset) => {
    if (isReadOnly) return;
    if (magiaPreset) {
      setFicha((prev) => ({
        ...prev,
        magia: [...(prev.magia || []), { ...magiaPreset }],
      }));
      return;
    }

    if (!novaMagia.name.trim()) return;
    const propFormatada = `${novaMagia.tipoAcao}:${novaMagia.dados || "1d8"}:${novaMagia.alcance || "15"}`;

    setFicha((prev) => ({
      ...prev,
      magia: [
        ...(prev.magia || []),
        {
          name: novaMagia.name.trim(),
          slot: Number(novaMagia.slot || 0),
          properties: propFormatada,
          description:
            novaMagia.description.trim() ||
            `${novaMagia.tipoAcao === "cura" ? "Restaura" : "Causa"} ${novaMagia.dados} (${novaMagia.alcance}m)`,
        },
      ],
    }));

    setNovaMagia({
      name: "",
      slot: 1,
      tipoAcao: "ataque",
      dados: "2d6",
      alcance: "15",
      description: "",
    });
  };

  const removerMagia = (idx) => {
    if (isReadOnly) return;
    setFicha((prev) => ({
      ...prev,
      magia: (prev.magia || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!ficha.nome.trim()) {
      setAbaAtiva("essencial");
      return;
    }

    setEnviando(true);
    const payload = {
      ...ficha,
      mesaId: ficha.mesaId || tenantId,
      strMod: getMod(ficha.forca),
      dexMod: getMod(ficha.destreza),
      conMod: getMod(ficha.constituicao),
      intMod: getMod(ficha.inteligencia),
      wisMod: getMod(ficha.sabedoria),
      chaMod: getMod(ficha.carisma),
      idade: ficha.idade ? Number(ficha.idade) : null,
      equipamento: Array.isArray(ficha.equipamento) ? ficha.equipamento : [],
      magia: Array.isArray(ficha.magia) ? ficha.magia : [],
    };

    try {
      if (isEdit) {
        await api.put(`/characters/${id}`, payload);
      } else {
        await api.post("/characters", payload);
      }
      navigate(-1);
    } catch {
      setEnviando(false);
    }
  };

  const atributos = [
    { key: "forca", label: "Força", sigla: "FOR" },
    { key: "destreza", label: "Destreza", sigla: "DES" },
    { key: "constituicao", label: "Constituição", sigla: "CON" },
    { key: "inteligencia", label: "Inteligência", sigla: "INT" },
    { key: "sabedoria", label: "Sabedoria", sigla: "SAB" },
    { key: "carisma", label: "Carisma", sigla: "CAR" },
  ];

  const handleSalvarFichaAnoUm = async (dadosAno1, calcAno1) => {
    if (isReadOnly) return;
    if (!tenantId && !ficha.mesaId) {
      // Se não estiver dentro de uma sala ativa, salva localmente no navegador
      localStorage.setItem(
        "rolemaster_ultima_ficha_ano1",
        JSON.stringify(dadosAno1)
      );
      return;
    }

    setEnviando(true);
    const pvTorso =
      calcAno1.partesCorpoCalculadas.find((p) => p.id === "torso")?.pvMax ||
      35 + calcAno1.atributosFinais.fisico;

    const payload = {
      ...ficha,
      mesaId: ficha.mesaId || tenantId,
      nome: (dadosAno1.nome || "Sobrevivente de 1950").trim(),
      raca: "Ano Um (1950)",
      classe: `${calcAno1.profissaoObj.nome.split(" (")[0]} • ${
        calcAno1.origemObj?.nome?.split(" (")[0] ||
        calcAno1.subclasse1Obj?.nome?.split(" (")[0] ||
        "Sobrevivente"
      }`,
      nivel: 1,
      alinhamento: `Certo: ${dadosAno1.alinhamentoCerto || "-"} | Repudia: ${dadosAno1.alinhamentoRepudia || "-"}`.slice(
        0,
        180
      ),
      antecedente: `Gancho #${dadosAno1.ganchoId} (1950)`,
      nomeDoJogador: dadosAno1.nomeJogador || "",
      forca: calcAno1.atributosFinais.fisico,
      strMod: calcAno1.conversao.fisico.bonus ?? 0,
      destreza: calcAno1.atributosFinais.fisico,
      dexMod: calcAno1.conversao.fisico.bonus ?? 0,
      constituicao: calcAno1.atributosFinais.fisico,
      conMod: calcAno1.conversao.fisico.bonus ?? 0,
      inteligencia: calcAno1.atributosFinais.inteligencia,
      intMod: calcAno1.conversao.inteligencia.bonus ?? 0,
      sabedoria: calcAno1.atributosFinais.inteligencia,
      wisMod: calcAno1.conversao.inteligencia.bonus ?? 0,
      carisma: calcAno1.atributosFinais.social,
      chaMod: calcAno1.conversao.social.bonus ?? 0,
      classeArmadura: 10 + (calcAno1.conversao.fisico.bonus ?? 0),
      iniciativa: calcAno1.conversao.fisico.bonus ?? 0,
      deslocamento: 9,
      pontosDeVidaMaximos: pvTorso,
      pontosDeVidaAtuais: pvTorso,
      dadoDeVida: "2d6",
      idade: parseInt(dadosAno1.idade, 10) || 28,
      aparenciaDoPersonagem: dadosAno1.retratoBase64 || "",
      historiaDoPersonagem: dadosAno1.ganchoResposta || "",
      outrasProficienciasEIdiomas: JSON.stringify({
        ...dadosAno1,
        sistema: "ano1",
      }),
      equipamento: [
        {
          name: dadosAno1.kitUtensilioProfissao || "Utensílio de Profissão",
          damage: "1d6",
          properties: "Corpo a Corpo (1.5m)",
        },
        {
          name: dadosAno1.kitObjetoSentimental || "Objeto Sentimental",
          damage: "1d4",
          properties: "Âncora de Moral (1950)",
        },
      ],
      magia: [],
    };

    try {
      if (isEdit && id) {
        await api.put(`/characters/${id}`, payload);
      } else {
        await api.post("/characters", payload);
      }
      navigate(-1);
    } catch {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen owlbear-canvas-bg text-zinc-400 flex items-center justify-center text-sm">
        Carregando ficha...
      </div>
    );
  }

  return (
    <div className="min-h-screen owlbear-canvas-bg text-zinc-100 p-3 sm:p-6">
      <div
        className={`${sistemaFicha === "ano1" ? "max-w-5xl" : "max-w-3xl"} mx-auto`}
      >
        {/* Topo de navegação + Seletor de Sistema (D&D 5e vs Ano Um 1950) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors"
          >
            ← Voltar
          </button>

          {!id && (
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setSistemaFicha("dnd5e")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  sistemaFicha === "dnd5e"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🐉 Ficha D&D 5e
              </button>
              <button
                type="button"
                onClick={() => setSistemaFicha("ano1")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  sistemaFicha === "ano1"
                    ? "bg-red-700 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>🧟</span>
                <span>Ficha Ano 1 (1950 • PDF Zumbi)</span>
              </button>
            </div>
          )}

          {isReadOnly && id && (
            <button
              type="button"
              onClick={() => navigate(`/ficha/${id}/editar`)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              Editar Personagem
            </button>
          )}
        </div>

        {sistemaFicha === "ano1" ? (
          <CriadorFichaAnoUm
            dadosIniciais={dadosAnoUmCarregados}
            isReadOnly={isReadOnly}
            enviando={enviando}
            temSalaAtiva={Boolean(tenantId || ficha.mesaId)}
            onSalvarNaSala={
              tenantId || ficha.mesaId ? handleSalvarFichaAnoUm : null
            }
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
          {/* Modelos rápidos (apenas ao criar nova ficha) */}
          {!id && !isReadOnly && (
            <div className="px-5 py-4 bg-zinc-950/60 border-b border-white/5">
              <span className="block text-[11px] font-medium text-zinc-400 mb-2">
                Preencher rápido com um modelo pronto:
              </span>
              <div className="flex flex-wrap gap-2">
                {MODELOS_RAPIDOS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => aplicarModeloRapido(m)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>{m.icone}</span>
                    <span>{m.rotulo}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cabeçalho principal do personagem */}
          <div className="p-5 sm:p-6 border-b border-white/5 space-y-4">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                Nome do Personagem
              </label>
              <input
                disabled={isReadOnly}
                type="text"
                name="nome"
                value={ficha.nome}
                onChange={handleChange}
                placeholder="Ex: Thorin Escudo-de-Ferro"
                required
                className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-lg font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-80"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Classe / Tipo
                </label>
                <input
                  disabled={isReadOnly}
                  type="text"
                  name="classe"
                  value={ficha.classe}
                  onChange={handleChange}
                  placeholder="Guerreiro"
                  className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Espécie / Raça
                </label>
                <input
                  disabled={isReadOnly}
                  type="text"
                  name="raca"
                  value={ficha.raca}
                  onChange={handleChange}
                  placeholder="Humano"
                  className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Nível
                </label>
                <input
                  disabled={isReadOnly}
                  type="number"
                  min="1"
                  max="20"
                  name="nivel"
                  value={ficha.nivel}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white text-center font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Navegação limpa em 3 abas */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-950/80 p-1 rounded-xl border border-white/5">
              {[
                { id: "essencial", label: "Essencial" },
                {
                  id: "combate",
                  label: `Armas & Magias (${
                    (ficha.equipamento?.length || 0) + (ficha.magia?.length || 0)
                  })`,
                },
                { id: "detalhes", label: "Perícias & História" },
              ].map((aba) => (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    abaAtiva === aba.id
                      ? "bg-indigo-600 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {aba.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTEÚDO DA ABA ATIVA */}
          <div className="p-5 sm:p-6">
            {abaAtiva === "essencial" && (
              <div className="space-y-6">
                {/* Status de Mesa (PV, CA, Iniciativa, Deslocamento) */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 mb-3">
                    Status no Tabuleiro
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-950/70 border border-white/10 rounded-xl p-3 text-center">
                      <label className="block text-[11px] text-emerald-400 font-medium mb-1">
                        Vida Atual (PV)
                      </label>
                      <input
                        disabled={isReadOnly}
                        type="number"
                        name="pontosDeVidaAtuais"
                        value={ficha.pontosDeVidaAtuais}
                        onChange={handleChange}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 text-center text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="bg-zinc-950/70 border border-white/10 rounded-xl p-3 text-center">
                      <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                        Vida Máxima
                      </label>
                      <input
                        disabled={isReadOnly}
                        type="number"
                        name="pontosDeVidaMaximos"
                        value={ficha.pontosDeVidaMaximos}
                        onChange={handleChange}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 text-center text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="bg-zinc-950/70 border border-white/10 rounded-xl p-3 text-center">
                      <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                        Defesa (CA)
                      </label>
                      <input
                        disabled={isReadOnly}
                        type="number"
                        name="classeArmadura"
                        value={ficha.classeArmadura}
                        onChange={handleChange}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 text-center text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="bg-zinc-950/70 border border-white/10 rounded-xl p-3 text-center">
                      <label className="block text-[11px] text-sky-400 font-medium mb-1">
                        Movimento (m)
                      </label>
                      <input
                        disabled={isReadOnly}
                        type="number"
                        step="1.5"
                        name="deslocamento"
                        value={ficha.deslocamento}
                        onChange={handleChange}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg py-1.5 text-center text-lg font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 6 Atributos */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 mb-3">
                    Atributos Principais
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {atributos.map((attr) => (
                      <div
                        key={attr.key}
                        className="bg-zinc-950/70 border border-white/10 rounded-xl p-3 flex flex-col items-center text-center"
                      >
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {attr.sigla}
                        </span>
                        <span className="text-xl font-bold text-indigo-300 my-1">
                          {exibeMod(ficha[attr.key])}
                        </span>
                        <input
                          disabled={isReadOnly}
                          type="number"
                          name={attr.key}
                          value={ficha[attr.key]}
                          onChange={handleChange}
                          className="w-14 bg-zinc-900 border border-white/10 rounded-lg py-1 text-center text-xs font-semibold text-zinc-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === "combate" && (
              <div className="space-y-6">
                {/* Armas */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-300">
                    Armas & Ataques ({(ficha.equipamento || []).length})
                  </h3>

                  {!isReadOnly && (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {ARMAS_RAPIDAS.map((a) => (
                          <button
                            key={a.name}
                            type="button"
                            onClick={() => adicionarArma(a)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-white/10 text-[11px] text-zinc-300 transition-colors"
                          >
                            + {a.name} ({a.damage})
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="Nome da arma"
                          value={novaArma.name}
                          onChange={(e) =>
                            setNovaArma({ ...novaArma, name: e.target.value })
                          }
                          className="col-span-6 sm:col-span-5 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="1d8"
                          value={novaArma.damage}
                          onChange={(e) =>
                            setNovaArma({ ...novaArma, damage: e.target.value })
                          }
                          className="col-span-3 sm:col-span-2 bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white text-center font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Alcance (ex: 1.5m ou 12m)"
                          value={novaArma.properties}
                          onChange={(e) =>
                            setNovaArma({ ...novaArma, properties: e.target.value })
                          }
                          className="col-span-9 sm:col-span-3 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => adicionarArma()}
                          className="col-span-3 sm:col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-xs font-semibold"
                        >
                          Adicionar
                        </button>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    {(ficha.equipamento || []).length === 0 ? (
                      <p className="text-xs text-zinc-500 py-2">
                        Nenhuma arma adicionada.
                      </p>
                    ) : (
                      (ficha.equipamento || []).map((eq, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-zinc-950/80 border border-white/10 px-3.5 py-2.5 rounded-xl text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white mr-2">
                              {eq.name}
                            </span>
                            <span className="font-mono text-indigo-300 mr-2">
                              {eq.damage}
                            </span>
                            <span className="text-zinc-500">{eq.properties}</span>
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => removerArma(i)}
                              className="text-zinc-500 hover:text-red-400 px-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Magias e Habilidades */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h3 className="text-xs font-semibold text-zinc-300">
                    Magias & Habilidades ({(ficha.magia || []).length})
                  </h3>

                  {!isReadOnly && (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {MAGIAS_RAPIDAS.map((m) => (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => adicionarMagia(m)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-white/10 text-[11px] text-zinc-300 transition-colors"
                          >
                            + {m.name}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="Nome da magia/habilidade"
                          value={novaMagia.name}
                          onChange={(e) =>
                            setNovaMagia({ ...novaMagia, name: e.target.value })
                          }
                          className="col-span-7 sm:col-span-5 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <select
                          value={novaMagia.tipoAcao}
                          onChange={(e) =>
                            setNovaMagia({ ...novaMagia, tipoAcao: e.target.value })
                          }
                          className="col-span-5 sm:col-span-3 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white"
                        >
                          <option value="ataque">Dano</option>
                          <option value="cura">Cura</option>
                        </select>
                        <input
                          type="text"
                          placeholder="2d6"
                          value={novaMagia.dados}
                          onChange={(e) =>
                            setNovaMagia({ ...novaMagia, dados: e.target.value })
                          }
                          className="col-span-6 sm:col-span-2 bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white text-center font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => adicionarMagia()}
                          className="col-span-6 sm:col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-xs font-semibold"
                        >
                          Adicionar
                        </button>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    {(ficha.magia || []).length === 0 ? (
                      <p className="text-xs text-zinc-500 py-2">
                        Nenhuma magia ou habilidade adicionada.
                      </p>
                    ) : (
                      (ficha.magia || []).map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-zinc-950/80 border border-white/10 px-3.5 py-2.5 rounded-xl text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-white mr-2">
                              {m.name}
                            </span>
                            {m.description && (
                              <span className="text-zinc-400">
                                {m.description}
                              </span>
                            )}
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => removerMagia(i)}
                              className="text-zinc-500 hover:text-red-400 px-2 shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === "detalhes" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 mb-3">
                    Bônus de Perícias (opcional)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PERICIAS_LISTA.map((p) => (
                      <div
                        key={p.key}
                        className="flex items-center justify-between bg-zinc-950/70 border border-white/10 px-3 py-1.5 rounded-xl"
                      >
                        <span className="text-xs text-zinc-300 truncate pr-2">
                          {p.label}
                        </span>
                        <input
                          disabled={isReadOnly}
                          type="number"
                          name={p.key}
                          value={ficha[p.key]}
                          onChange={handleChange}
                          className="w-11 bg-zinc-900 border border-white/10 rounded-lg py-0.5 text-center text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      História & Notas do Personagem
                    </label>
                    <textarea
                      disabled={isReadOnly}
                      name="historiaDoPersonagem"
                      value={ficha.historiaDoPersonagem}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Origens, motivações ou anotações rápidas..."
                      className="w-full bg-zinc-950/70 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 custom-scrollbar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Talentos, Idiomas & Inventário Extra
                    </label>
                    <textarea
                      disabled={isReadOnly}
                      name="caracteristicasETalentos"
                      value={ficha.caracteristicasETalentos}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Itens de mochila, talentos especiais..."
                      className="w-full bg-zinc-950/70 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 custom-scrollbar"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé de Ação */}
          {!isReadOnly && (
            <div className="px-5 sm:px-6 py-4 bg-zinc-950/60 border-t border-white/5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-950/40"
              >
                {enviando
                  ? "Salvando..."
                  : isEdit
                    ? "Salvar Alterações"
                    : "Salvar Personagem"}
              </button>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  );
}
