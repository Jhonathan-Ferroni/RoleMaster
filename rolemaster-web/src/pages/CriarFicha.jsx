import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../services/api";

const ARMAS_RAPIDAS = [
  { name: "Espada Longa", damage: "1d8", properties: "Corpo a Corpo (1.5m) • Versátil (1d10)" },
  { name: "Machado Grande", damage: "1d12", properties: "Pesado, Corpo a Corpo (1.5m)" },
  { name: "Rapieira", damage: "1d8", properties: "Acuidade, Corpo a Corpo (1.5m)" },
  { name: "Adaga", damage: "1d4", properties: "Acuidade, Arremesso (6m)" },
  { name: "Arco Longo", damage: "1d8", properties: "Distância (18m)" },
  { name: "Besta Leve", damage: "1d8", properties: "Distância (12m)" },
  { name: "Maça Sagrada", damage: "1d6", properties: "Corpo a Corpo (1.5m)" },
  { name: "Cajado Arcano", damage: "1d6", properties: "Corpo a Corpo (1.5m)" },
];

const MAGIAS_RAPIDAS = [
  { name: "Raio de Fogo", slot: 0, properties: "ataque:1d10:18", description: "Disparo flamejante a até 18m (1d10 de dano de fogo)." },
  { name: "Chama Sagrada", slot: 0, properties: "ataque:1d8:18", description: "Luz radiante que causa 1d8 de dano a até 18m." },
  { name: "Mísseis Mágicos", slot: 1, properties: "ataque:3d4+3:18", description: "Dardos arcanos infalíveis (3d4+3 de dano de energia)." },
  { name: "Curar Ferimentos", slot: 1, properties: "cura:1d8+3:4.5", description: "Restaura 1d8 + Mod. de conjuração em PV." },
  { name: "Palavra Curativa", slot: 1, properties: "cura:1d4+3:18", description: "Cura rápida à distância (1d4+3 PV, Ação Bônus)." },
  { name: "Retomar o Fôlego", slot: 1, properties: "cura:1d10+3:1.5", description: "Habilidade de Guerreiro que recupera 1d10+Nível PV." },
  { name: "Bola de Fogo", slot: 3, properties: "ataque:8d6:18", description: "Explosão devastadora de chamas (8d6 de dano de fogo)." },
];

export function CriarFicha() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const tenantId = localStorage.getItem("tenantId");

  const isEdit = location.pathname.endsWith("/editar");
  const isReadOnly = id && !isEdit;

  const [carregando, setCarregando] = useState(!!id);
  const [enviando, setEnviando] = useState(false);

  const [ficha, setFicha] = useState({
    nome: "",
    classe: "",
    raca: "",
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
    classeArmadura: 10,
    iniciativa: 0,
    deslocamento: 9,
    sabedoriaPassivaPercepcao: 10,
    pontosDeVidaMaximos: 10,
    pontosDeVidaAtuais: 10,
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

  // Estados para adição de nova arma e nova magia
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
    if (!tenantId && !id) {
      alert("Selecione uma mesa antes de forjar um herói!");
      navigate("/lobby");
      return;
    }

    if (id) {
      buscarFicha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tenantId, navigate]);

  const buscarFicha = async () => {
    try {
      const response = await api.get(`/characters/${id}`);
      const dadosTratados = { ...response.data };
      Object.keys(dadosTratados).forEach((key) => {
        if (dadosTratados[key] === null) dadosTratados[key] = "";
      });
      if (!Array.isArray(dadosTratados.equipamento)) dadosTratados.equipamento = [];
      if (!Array.isArray(dadosTratados.magia)) dadosTratados.magia = [];
      setFicha(dadosTratados);
    } catch {
      alert("Erro ao ler os pergaminhos da ficha.");
      navigate(-1);
    } finally {
      setCarregando(false);
    }
  };

  const getMod = (valor) => Math.floor((valor - 10) / 2);
  const exibeMod = (valor) => {
    const mod = getMod(valor);
    return mod >= 0 ? `+${mod}` : mod;
  };

  const handleChange = (e) => {
    if (isReadOnly) return;
    const { name, value, type, checked } = e.target;
    setFicha((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  // === GERENCIAMENTO DE ARMAS (EQUIPAMENTO) ===
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

  // === GERENCIAMENTO DE MAGIAS (GRIMÓRIO) ===
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
            `${novaMagia.tipoAcao === "cura" ? "Restaura" : "Causa"} ${novaMagia.dados} (Alcance ${novaMagia.alcance}m)`,
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
        alert("Alterações gravadas na história!");
      } else {
        await api.post("/characters", payload);
        alert("A Lenda foi forjada e enviada ao Mestre!");
      }
      navigate(-1);
    } catch {
      alert("Falha ao salvar a ficha. Verifique os feitiços.");
      setEnviando(false);
    }
  };

  const atributos = [
    { key: "forca", label: "FOR", save: "salvaGuardaForca" },
    { key: "destreza", label: "DES", save: "salvaGuardaDestreza" },
    { key: "constituicao", label: "CON", save: "salvaGuardaConstituicao" },
    { key: "inteligencia", label: "INT", save: "salvaGuardaInteligencia" },
    { key: "sabedoria", label: "SAB", save: "salvaGuardaSabedoria" },
    { key: "carisma", label: "CAR", save: "salvaGuardaCarisma" },
  ];

  if (carregando)
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Lendo registros arcanos...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-2.5 sm:p-4">
      <div className="max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3.5 sm:p-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-zinc-800 pb-4 mb-5 sm:mb-6">
          <div className="w-full md:w-1/3 mb-3 md:mb-0">
            <div className="flex items-center justify-between mb-2 md:hidden">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-xs text-zinc-400 hover:text-white bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 font-semibold"
              >
                ← Voltar
              </button>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Ficha D&D 5e
              </span>
            </div>
            <input
              disabled={isReadOnly}
              type="text"
              name="nome"
              value={ficha.nome}
              onChange={handleChange}
              placeholder="Nome do Personagem"
              className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-red-500 placeholder-zinc-700 outline-none border-b border-transparent focus:border-red-900 transition-colors disabled:opacity-80"
            />
          </div>
          <div className="w-full md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
            {[
              "classe",
              "nivel",
              "raca",
              "antecedente",
              "alinhamento",
              "nomeDoJogador",
            ].map((campo) => (
              <div key={campo}>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block truncate">
                  {campo
                    .replace("raca", "Espécie/Raça")
                    .replace(/([A-Z])/g, " $1")
                    .trim()}
                </label>
                <input
                  disabled={isReadOnly}
                  type={campo === "nivel" ? "number" : "text"}
                  name={campo}
                  value={ficha[campo]}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm text-white outline-none border-b border-zinc-800 focus:border-red-500 py-0.5 disabled:opacity-80"
                />
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6"
        >
          {/* COLUNA 1: Atributos (em Mobile fica uma grade 3x2 super prática!) */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-1 gap-2.5 sm:gap-3">
              {atributos.map((attr) => (
                <div
                  key={attr.key}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center p-2.5 sm:p-3 relative overflow-hidden"
                >
                  <span className="text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                    {attr.label}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
                    {exibeMod(ficha[attr.key])}
                  </div>
                  <div className="w-12 bg-zinc-900 border border-zinc-700 rounded-full flex justify-center pb-0.5">
                    <input
                      disabled={isReadOnly}
                      type="number"
                      name={attr.key}
                      value={ficha[attr.key]}
                      onChange={handleChange}
                      className="w-9 bg-transparent text-center text-sm font-bold text-zinc-300 outline-none appearance-none disabled:opacity-80"
                    />
                  </div>
                  <label
                    className={`mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-400 transition-colors ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer hover:text-emerald-400"}`}
                  >
                    <input
                      disabled={isReadOnly}
                      type="checkbox"
                      name={attr.save}
                      checked={ficha[attr.save]}
                      onChange={handleChange}
                      className="accent-emerald-500 w-3 h-3 disabled:opacity-80"
                    />
                    <span className="truncate">Salva.</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-500 uppercase">
                Percepção Passiva
              </span>
              <input
                disabled={isReadOnly}
                type="number"
                name="sabedoriaPassivaPercepcao"
                value={ficha.sabedoriaPassivaPercepcao}
                onChange={handleChange}
                className="w-12 bg-zinc-900 border border-zinc-700 rounded p-1 text-center text-white font-bold disabled:opacity-80"
              />
            </div>
          </div>

          {/* COLUNA 2: Combate, Vida e Perícias */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-zinc-950/50 p-3.5 sm:p-4 rounded-xl border border-zinc-800/50">
              {["classeArmadura", "iniciativa", "deslocamento"].map(
                (status) => (
                  <div key={status} className="text-center">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold truncate">
                      {status.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <input
                      disabled={isReadOnly}
                      type="number"
                      name={status}
                      value={ficha[status]}
                      onChange={handleChange}
                      className="w-16 mx-auto bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xl sm:text-2xl font-bold text-white text-center mt-1 disabled:opacity-80"
                    />
                  </div>
                ),
              )}
            </div>

            <div className="bg-zinc-950/50 p-3.5 sm:p-4 rounded-xl border border-zinc-800/50 space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-red-500 uppercase">
                  Pontos de Vida
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">MÁX</span>
                  <input
                    disabled={isReadOnly}
                    type="number"
                    name="pontosDeVidaMaximos"
                    value={ficha.pontosDeVidaMaximos}
                    onChange={handleChange}
                    className="w-14 bg-zinc-900 border border-zinc-700 rounded p-1 text-center text-xs text-white font-bold disabled:opacity-80"
                  />
                </div>
              </div>
              <input
                disabled={isReadOnly}
                type="number"
                name="pontosDeVidaAtuais"
                value={ficha.pontosDeVidaAtuais}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-emerald-900/30 rounded-lg p-3 sm:p-4 text-3xl font-bold text-emerald-500 text-center outline-none focus:border-emerald-500 transition-colors disabled:opacity-80"
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase">
                    HP Temporário
                  </label>
                  <input
                    disabled={isReadOnly}
                    type="number"
                    name="pontosDeVidaTemporarios"
                    value={ficha.pontosDeVidaTemporarios}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-blue-900/30 rounded p-1.5 text-center text-blue-400 disabled:opacity-80"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase">
                    Dados de Vida
                  </label>
                  <input
                    disabled={isReadOnly}
                    type="text"
                    name="dadoDeVida"
                    value={ficha.dadoDeVida}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-center text-zinc-300 disabled:opacity-80"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3.5 sm:p-4 rounded-xl">
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 border-b border-zinc-800 pb-2">
                Perícias
              </h3>
              <div className="grid grid-cols-2 gap-x-2.5 sm:gap-x-4 gap-y-2">
                {Object.keys(ficha)
                  .filter((k) =>
                    [
                      "acrobacia",
                      "arcanismo",
                      "atletismo",
                      "atuacao",
                      "enganacao",
                      "furtividade",
                      "historia",
                      "intimidacao",
                      "intuicao",
                      "investigacao",
                      "lidarComAnimais",
                      "medicina",
                      "natureza",
                      "percepcao",
                      "persuasao",
                      "prestidigitacao",
                      "religiao",
                      "sobrevivencia",
                    ].includes(k),
                  )
                  .map((pericia) => (
                    <div
                      key={pericia}
                      className="flex justify-between items-center bg-zinc-900 p-1.5 rounded border border-zinc-800"
                    >
                      <span className="text-[10px] text-zinc-400 capitalize truncate pr-1">
                        {pericia.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <input
                        disabled={isReadOnly}
                        type="number"
                        name={pericia}
                        value={ficha[pericia]}
                        onChange={handleChange}
                        className="w-9 bg-zinc-950 border border-zinc-700 rounded p-1 text-center text-xs text-white outline-none disabled:opacity-80 shrink-0"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* COLUNA 3: Lore e Características */}
          <div className="lg:col-span-4 space-y-4 flex flex-col">
            <div className="grid grid-cols-3 gap-2 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
              {[
                "idade",
                "altura",
                "peso",
                "corDosOlhos",
                "corDaPele",
                "corDoCabelo",
              ].map((fisico) => (
                <div key={fisico}>
                  <label className="block text-[9px] text-zinc-500 uppercase truncate">
                    {fisico.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    disabled={isReadOnly}
                    type={fisico === "idade" ? "number" : "text"}
                    name={fisico}
                    value={ficha[fisico]}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border-b border-zinc-700 text-xs p-1 text-white outline-none focus:border-red-500 disabled:opacity-80"
                  />
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3.5 sm:p-4 rounded-xl flex-1 flex flex-col gap-3">
              {[
                {
                  name: "tracosDePersonalidade",
                  label: "Traços de Personalidade",
                },
                { name: "ideais", label: "Ideais" },
                { name: "vinculos", label: "Vínculos" },
                { name: "fraquezas", label: "Fraquezas" },
              ].map((trait) => (
                <div key={trait.name} className="flex-1 flex flex-col">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase">
                    {trait.label}
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    name={trait.name}
                    value={ficha[trait.name]}
                    onChange={handleChange}
                    className="w-full flex-1 min-h-[50px] bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 outline-none focus:border-red-500 custom-scrollbar disabled:opacity-80"
                  ></textarea>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3.5 sm:p-4 rounded-xl flex flex-col gap-3 h-48">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">
                Características e Talentos
              </label>
              <textarea
                disabled={isReadOnly}
                name="caracteristicasETalentos"
                value={ficha.caracteristicasETalentos}
                onChange={handleChange}
                className="w-full flex-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 outline-none focus:border-red-500 custom-scrollbar disabled:opacity-80"
              ></textarea>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SEÇÃO NOVA: ARMAS / EQUIPAMENTOS E GRIMÓRIO DE MAGIAS          */}
          {/* ============================================================== */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-4 border-t border-zinc-800">
            {/* COLUNA ARMAS E EQUIPAMENTOS */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">
                  ⚔️ Armas & Equipamentos de Combate ({(ficha.equipamento || []).length})
                </h3>
              </div>

              {!isReadOnly && (
                <>
                  {/* Atalhos Rápidos D&D 5e */}
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">
                      Adicionar Arma Clássica D&D (1 Toque):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ARMAS_RAPIDAS.map((a) => (
                        <button
                          key={a.name}
                          type="button"
                          onClick={() => adicionarArma(a)}
                          className="bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-colors"
                        >
                          + {a.name} ({a.damage})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formulário de Arma Customizada */}
                  <div className="grid grid-cols-12 gap-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <input
                      type="text"
                      placeholder="Nome da Arma (ex: Katana)"
                      value={novaArma.name}
                      onChange={(e) =>
                        setNovaArma({ ...novaArma, name: e.target.value })
                      }
                      className="col-span-8 sm:col-span-5 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Dano (1d8)"
                      value={novaArma.damage}
                      onChange={(e) =>
                        setNovaArma({ ...novaArma, damage: e.target.value })
                      }
                      className="col-span-4 sm:col-span-2 bg-zinc-950 border border-zinc-700 rounded px-2 py-2 text-xs text-white text-center font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Propriedades (ex: Acuidade, 1.5m)"
                      value={novaArma.properties}
                      onChange={(e) =>
                        setNovaArma({ ...novaArma, properties: e.target.value })
                      }
                      className="col-span-8 sm:col-span-3 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => adicionarArma()}
                      className="col-span-4 sm:col-span-2 bg-red-700 hover:bg-red-600 text-white rounded py-2 text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                </>
              )}

              {/* Lista de Armas Cadastradas */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {(ficha.equipamento || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-4">
                    Nenhuma arma vinculada ainda. Adicione acima para usá-la no Tabuleiro!
                  </p>
                ) : (
                  (ficha.equipamento || []).map((eq, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white mr-2">
                          ⚔️ {eq.name}
                        </span>
                        <span className="text-red-400 font-mono font-bold mr-2">
                          [{eq.damage}]
                        </span>
                        <span className="text-zinc-400 text-[11px] block sm:inline">
                          {eq.properties}
                        </span>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removerArma(i)}
                          className="text-zinc-500 hover:text-red-500 font-bold px-2 py-1 shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUNA GRIMÓRIO DE MAGIAS E HABILIDADES */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  ✨ Grimório de Magias & Habilidades ({(ficha.magia || []).length})
                </h3>
              </div>

              {!isReadOnly && (
                <>
                  {/* Atalhos Rápidos de Magias */}
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">
                      Adicionar Magia/Habilidade D&D (1 Toque):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MAGIAS_RAPIDAS.map((m) => (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => adicionarMagia(m)}
                          className="bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-700 text-purple-300 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-colors"
                        >
                          + {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formulário de Magia Customizada */}
                  <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Nome da Magia/Habilidade"
                        value={novaMagia.name}
                        onChange={(e) =>
                          setNovaMagia({ ...novaMagia, name: e.target.value })
                        }
                        className="col-span-12 sm:col-span-5 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-2 text-xs text-white"
                      />
                      <select
                        value={novaMagia.tipoAcao}
                        onChange={(e) =>
                          setNovaMagia({ ...novaMagia, tipoAcao: e.target.value })
                        }
                        className="col-span-5 sm:col-span-3 bg-zinc-950 border border-zinc-700 rounded px-2 py-2 text-xs text-white"
                      >
                        <option value="ataque">🔮 Dano</option>
                        <option value="cura">✨ Cura</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Dados (2d6)"
                        value={novaMagia.dados}
                        onChange={(e) =>
                          setNovaMagia({ ...novaMagia, dados: e.target.value })
                        }
                        className="col-span-4 sm:col-span-2 bg-zinc-950 border border-zinc-700 rounded px-2 py-2 text-xs text-white text-center font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Nv"
                        value={novaMagia.slot}
                        onChange={(e) =>
                          setNovaMagia({ ...novaMagia, slot: e.target.value })
                        }
                        className="col-span-3 sm:col-span-2 bg-zinc-950 border border-zinc-700 rounded px-2 py-2 text-xs text-white text-center"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Descrição do efeito..."
                        value={novaMagia.description}
                        onChange={(e) =>
                          setNovaMagia({
                            ...novaMagia,
                            description: e.target.value,
                          })
                        }
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => adicionarMagia()}
                        className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded text-xs font-bold shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Lista de Magias Cadastradas */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {(ficha.magia || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-4">
                    Nenhuma magia ou habilidade especial cadastrada.
                  </p>
                ) : (
                  (ficha.magia || []).map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-purple-300">
                            ✨ {m.name}
                          </span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 rounded font-mono">
                            Nv {m.slot ?? 0}
                          </span>
                          {m.properties && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              [{m.properties}]
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {m.description}
                          </p>
                        )}
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removerMagia(i)}
                          className="text-zinc-500 hover:text-red-500 font-bold px-2 py-1 shrink-0"
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

          {/* BOTÕES DE AÇÃO */}
          <div className="lg:col-span-12 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-4 sm:mt-6 pt-5 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-zinc-400 hover:text-white bg-zinc-950 sm:bg-transparent border border-zinc-800 sm:border-transparent transition-colors"
            >
              {isReadOnly ? "Voltar" : "Cancelar"}
            </button>

            {!isReadOnly && (
              <button
                type="submit"
                disabled={enviando}
                className="w-full sm:w-auto px-8 py-3 sm:py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-zinc-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20 uppercase tracking-widest text-sm"
              >
                {enviando
                  ? "Processando..."
                  : isEdit
                    ? "💾 Salvar Alterações"
                    : "⚔️ Forjar Herói"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
