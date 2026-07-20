import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../services/api";

export function CriarFicha() {
  const navigate = useNavigate();
  const { id } = useParams(); // Pega o ID da ficha na URL (se existir)
  const location = useLocation(); // Lê o caminho atual
  const tenantId = localStorage.getItem("tenantId");

  // A mágica que define o modo da tela:
  const isEdit = location.pathname.endsWith("/editar");
  const isReadOnly = id && !isEdit;

  const [carregando, setCarregando] = useState(!!id); // Se tem ID, começa carregando
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
  });

  // Busca os dados do banco caso estejamos editando ou visualizando
  useEffect(() => {
    if (!tenantId && !id) {
      alert("Selecione uma mesa antes de forjar um herói!");
      navigate("/lobby");
      return;
    }

    if (id) {
      buscarFicha();
    }
  }, [id, tenantId, navigate]);

  const buscarFicha = async () => {
    try {
      const response = await api.get(`/characters/${id}`);
      // Pega os dados nulos do banco e transforma em string vazia para o React não reclamar
      const dadosTratados = { ...response.data };
      Object.keys(dadosTratados).forEach((key) => {
        if (dadosTratados[key] === null) dadosTratados[key] = "";
      });
      setFicha(dadosTratados);
    } catch (error) {
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
    if (isReadOnly) return; // Trava extra
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    setEnviando(true);

    const payload = {
      ...ficha,
      mesaId: ficha.mesaId || tenantId, // Mantém a mesa original se for edição
      strMod: getMod(ficha.forca),
      dexMod: getMod(ficha.destreza),
      conMod: getMod(ficha.constituicao),
      intMod: getMod(ficha.inteligencia),
      wisMod: getMod(ficha.sabedoria),
      chaMod: getMod(ficha.carisma),
      idade: ficha.idade ? Number(ficha.idade) : null,
    };

    try {
      if (isEdit) {
        await api.put(`/characters/${id}`, payload);
        alert("Alterações gravadas na história!");
      } else {
        await api.post("/characters", payload);
        alert("A Lenda foi forjada e enviada ao Mestre!");
      }
      navigate(-1); // Volta para a tela anterior (Campanha ou Gestão)
    } catch (error) {
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <div className="max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded shadow-2xl p-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-zinc-800 pb-4 mb-6">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <input
              disabled={isReadOnly}
              type="text"
              name="nome"
              value={ficha.nome}
              onChange={handleChange}
              placeholder="Nome do Personagem"
              className="w-full bg-transparent text-3xl font-bold text-red-500 placeholder-zinc-700 outline-none border-b border-transparent focus:border-red-900 transition-colors disabled:opacity-80"
            />
          </div>
          <div className="w-full md:w-2/3 grid grid-cols-3 gap-2 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
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
                  className="w-full bg-transparent text-sm text-white outline-none border-b border-zinc-800 focus:border-red-500 disabled:opacity-80"
                />
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* COLUNA 1: Atributos */}
          <div className="lg:col-span-3 space-y-4">
            {atributos.map((attr) => (
              <div
                key={attr.key}
                className="bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden"
              >
                <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  {attr.label}
                </span>
                <div className="text-3xl font-bold text-white mb-2">
                  {exibeMod(ficha[attr.key])}
                </div>
                <div className="w-12 bg-zinc-900 border border-zinc-700 rounded-full flex justify-center pb-1">
                  <input
                    disabled={isReadOnly}
                    type="number"
                    name={attr.key}
                    value={ficha[attr.key]}
                    onChange={handleChange}
                    className="w-8 bg-transparent text-center text-sm font-bold text-zinc-300 outline-none appearance-none disabled:opacity-80"
                  />
                </div>
                <label
                  className={`mt-3 flex items-center gap-2 text-xs text-zinc-400 transition-colors ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer hover:text-emerald-400"}`}
                >
                  <input
                    disabled={isReadOnly}
                    type="checkbox"
                    name={attr.save}
                    checked={ficha[attr.save]}
                    onChange={handleChange}
                    className="accent-emerald-500 w-3 h-3 disabled:opacity-80"
                  />
                  Salvaguarda
                </label>
              </div>
            ))}

            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-500 uppercase">
                Percepção Passiva
              </span>
              <input
                disabled={isReadOnly}
                type="number"
                name="sabedoriaPassivaPercepcao"
                value={ficha.sabedoriaPassivaPercepcao}
                onChange={handleChange}
                className="w-10 bg-zinc-900 border border-zinc-700 rounded p-1 text-center text-white disabled:opacity-80"
              />
            </div>
          </div>

          {/* COLUNA 2: Combate, Vida e Perícias */}
          <div className="lg:col-span-5 space-y-6">
            <div className="grid grid-cols-3 gap-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
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
                      className="w-16 mx-auto bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-2xl font-bold text-white text-center mt-1 disabled:opacity-80"
                    />
                  </div>
                ),
              )}
            </div>

            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 space-y-3">
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
                    className="w-12 bg-zinc-900 border border-zinc-700 rounded p-1 text-center text-xs text-white disabled:opacity-80"
                  />
                </div>
              </div>
              <input
                disabled={isReadOnly}
                type="number"
                name="pontosDeVidaAtuais"
                value={ficha.pontosDeVidaAtuais}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-emerald-900/30 rounded-lg p-4 text-3xl font-bold text-emerald-500 text-center outline-none focus:border-emerald-500 transition-colors disabled:opacity-80"
              />
              <div className="grid grid-cols-2 gap-3 pt-2">
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
                    className="w-full bg-zinc-900 border border-blue-900/30 rounded p-1 text-center text-blue-400 disabled:opacity-80"
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
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-1 text-center text-zinc-300 disabled:opacity-80"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 border-b border-zinc-800 pb-2">
                Perícias
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                      <span className="text-[10px] text-zinc-400 capitalize truncate w-3/4">
                        {pericia.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <input
                        disabled={isReadOnly}
                        type="number"
                        name={pericia}
                        value={ficha[pericia]}
                        onChange={handleChange}
                        className="w-8 bg-zinc-950 border border-zinc-700 rounded p-1 text-center text-xs text-white outline-none disabled:opacity-80"
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

            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex-1 flex flex-col gap-3">
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

            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3 h-48">
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

          {/* BOTÕES DE AÇÃO (Escondidos se for Visualização) */}
          <div className="lg:col-span-12 flex justify-end gap-4 mt-6 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded font-bold text-zinc-400 hover:text-white transition-colors"
            >
              {isReadOnly ? "Voltar" : "Cancelar"}
            </button>

            {!isReadOnly && (
              <button
                type="submit"
                disabled={enviando}
                className="px-8 py-2 bg-red-700 hover:bg-red-600 disabled:bg-zinc-700 text-white font-bold rounded transition-colors shadow-lg shadow-red-900/20 uppercase tracking-widest text-sm"
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
