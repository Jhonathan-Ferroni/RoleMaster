import { useState, useMemo } from "react";
import {
  CONTEXTO_1950,
  GANCHOS_1950,
  ATRIBUTOS_INFO,
  TABELA_CONVERSAO_ATRIBUTO,
  PROFISSOES_1950,
  ORIGENS_LIVRO,
  SUBCLASSES_LIVRO,
  QUALIDADES_LIVRO,
  DEFEITOS_LIVRO,
  PARTES_DO_CORPO,
  ESTADO_INICIAL_ANO_UM,
  calcularFichaAnoUm,
  gerarPdfFichaAnoUm,
} from "../data/anoUmPresets";

const ETAPAS_WIZARD = [
  { id: "contexto", curto: "1. 1950 & Foto", titulo: "1. Identidade, Foto 3×4 & Gancho (1950)" },
  { id: "passo3", curto: "2. Profissão", titulo: "2. Profissão ou Ex-Profissão de 1950" },
  { id: "passo4", curto: "3. Origem/Sub", titulo: "3. Origem e Subclasses" },
  { id: "passo5", curto: "4. Moral & Traços", titulo: "4. Moral, Âncoras, Qualidades e Defeitos" },
  { id: "passo1", curto: "5. Atributos (+6)", titulo: "5. Distribuição Final de Atributos (+6 pts)" },
  { id: "passo2", curto: "6. Perícias (+10)", titulo: "6. Distribuição de Perícias" },
  { id: "passo6", curto: "7. PV, Kit & PDF 🧟", titulo: "7. Vida por Membro, Kit & PDF Zumbi" },
];

function redimensionarImagemParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
}

export function CriadorFichaAnoUm({
  dadosIniciais,
  isReadOnly = false,
  enviando = false,
  onSalvarNaSala,
  temSalaAtiva = false,
}) {
  const [dados, setDados] = useState(() => ({
    ...ESTADO_INICIAL_ANO_UM,
    ...(dadosIniciais || {}),
  }));
  const [etapaAtiva, setEtapaAtiva] = useState("contexto");
  const [mostrarTextoAmbientacao, setMostrarTextoAmbientacao] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const calc = useMemo(() => calcularFichaAnoUm(dados), [dados]);

  const atualizarCampo = (chave, valor) => {
    if (isReadOnly) return;
    setDados((prev) => ({ ...prev, [chave]: valor }));
  };

  const handleUploadFoto = async (e) => {
    const arq = e.target.files?.[0];
    if (!arq || isReadOnly) return;
    try {
      const dataUrl = await redimensionarImagemParaBase64(arq);
      atualizarCampo("retratoBase64", dataUrl);
    } catch {
      // ignora erro de leitura
    }
  };

  const alterarPontoAtributo = (attr, delta) => {
    if (isReadOnly) return;
    const atual = Number(dados.pontosAtributoDist?.[attr] ?? 0);
    const novo = atual + delta;
    if (novo < 0) return;
    if (delta > 0 && calc.pontosAtributoRestantes <= 0) return;

    setDados((prev) => ({
      ...prev,
      pontosAtributoDist: {
        ...prev.pontosAtributoDist,
        [attr]: novo,
      },
    }));
  };

  const alterarPontoPericia = (periciaId, delta) => {
    if (isReadOnly) return;
    const atual = Number(dados.periciasPontos?.[periciaId] ?? 0);
    const novo = atual + delta;
    if (novo < 0 || novo > 6) return;
    if (delta > 0 && calc.pontosPericiaRestantes <= 0) return;

    setDados((prev) => ({
      ...prev,
      periciasPontos: {
        ...prev.periciasPontos,
        [periciaId]: novo,
      },
    }));
  };

  const selecionarProfissao = (prof) => {
    if (isReadOnly) return;
    setDados((prev) => ({
      ...prev,
      profissaoId: prof.id,
    }));
  };

  const selecionarModoEstilo = (novoModo) => {
    if (isReadOnly) return;
    setDados((prev) => {
      if (novoModo === "polivalente") {
        return {
          ...prev,
          modoEstilo: "polivalente",
          origemId: "polivalente",
        };
      }
      if (novoModo === "duas_subclasses") {
        const s1 = prev.subclasse1Id || "furtivo";
        const s2 =
          prev.subclasse2Id && prev.subclasse2Id !== s1
            ? prev.subclasse2Id
            : s1 === "galeno"
              ? "fabricante"
              : "galeno";
        return {
          ...prev,
          modoEstilo: "duas_subclasses",
          origemId:
            prev.origemId === "polivalente" ? "imparavel" : prev.origemId,
          subclasse1Id: s1,
          subclasse2Id: s2,
        };
      }
      return {
        ...prev,
        modoEstilo: "origem_subclasse",
        origemId: prev.origemId === "polivalente" ? "imparavel" : prev.origemId,
        subclasse1Id: prev.subclasse1Id || "furtivo",
      };
    });
  };

  const clicarCardSubclasse = (subId) => {
    if (isReadOnly) return;
    setDados((prev) => {
      if (prev.modoEstilo !== "duas_subclasses") {
        return { ...prev, subclasse1Id: subId };
      }

      const s1 = prev.subclasse1Id;
      const s2 = prev.subclasse2Id;

      // Se clicou em uma subclasse já marcada, desmarca ela para abrir vaga
      if (s1 === subId) {
        return {
          ...prev,
          subclasse1Id: s2 || "",
          subclasse2Id: "",
        };
      }
      if (s2 === subId) {
        return {
          ...prev,
          subclasse2Id: "",
        };
      }

      // Se houver vaga na 1ª ou 2ª subclasse, preenche a vaga livre
      if (!s1) {
        return { ...prev, subclasse1Id: subId };
      }
      if (!s2) {
        return { ...prev, subclasse2Id: subId };
      }

      // Se já tinha 2 marcadas e clicou em uma 3ª diferente, substitui a 2ª
      return { ...prev, subclasse2Id: subId };
    });
  };

  const definirSlotSubclasse = (slotNum, subId) => {
    if (isReadOnly) return;
    setDados((prev) => {
      if (slotNum === 1) {
        return {
          ...prev,
          subclasse1Id: subId,
          subclasse2Id: prev.subclasse2Id === subId ? prev.subclasse1Id : prev.subclasse2Id,
        };
      }
      return {
        ...prev,
        subclasse2Id: subId,
        subclasse1Id: prev.subclasse1Id === subId ? prev.subclasse2Id : prev.subclasse1Id,
      };
    });
  };

  const alternarQualidade = (qualId) => {
    if (isReadOnly) return;
    setDados((prev) => {
      const lista = prev.qualidadesIds || [];
      if (lista.includes(qualId)) {
        return { ...prev, qualidadesIds: lista.filter((id) => id !== qualId) };
      }
      const limiteMax = Math.min(3, Number(prev.moralAtual) || 3);
      if (lista.length >= limiteMax) return prev;
      return { ...prev, qualidadesIds: [...lista, qualId] };
    });
  };

  const alternarDefeito = (defId) => {
    if (isReadOnly) return;
    setDados((prev) => {
      const lista = prev.defeitosIds || [];
      if (lista.includes(defId)) {
        return { ...prev, defeitosIds: lista.filter((id) => id !== defId) };
      }
      return { ...prev, defeitosIds: [...lista, defId] };
    });
  };

  const handleBaixarPdfZumbi = async () => {
    setGerandoPdf(true);
    try {
      await gerarPdfFichaAnoUm(dados, calc);
    } finally {
      setGerandoPdf(false);
    }
  };

  const ganchoSelecionado =
    GANCHOS_1950.find((g) => Number(g.id) === Number(dados.ganchoId)) ||
    GANCHOS_1950[0];

  const indiceEtapaAtual = ETAPAS_WIZARD.findIndex((e) => e.id === etapaAtiva);

  return (
    <div className="space-y-6">
      {/* BARRA DE RESUMO VIVO DO SOBREVIVENTE DE 1950 */}
      <div className="bg-gradient-to-r from-red-950/60 via-zinc-900/95 to-stone-900/90 border border-red-500/30 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <label
            title={isReadOnly ? "Foto do Sobrevivente" : "Clique para enviar foto 3×4"}
            className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-500/50 bg-zinc-950 flex items-center justify-center shrink-0 ${
              isReadOnly ? "" : "cursor-pointer hover:border-red-400"
            }`}
          >
            {dados.retratoBase64 ? (
              <img
                src={dados.retratoBase64}
                alt={dados.nome || "Sobrevivente"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <span className="text-xl block">🧟</span>
                <span className="text-[9px] text-zinc-400 font-mono">FOTO</span>
              </div>
            )}
            {!isReadOnly && (
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFoto}
                className="hidden"
              />
            )}
          </label>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                ☣ Ano Um • São Paulo 1950
              </span>
              <span className="text-[11px] text-zinc-400 truncate">
                {calc.profissaoObj.nome}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white truncate mt-0.5">
              {dados.nome || "Sobrevivente Sem Nome"}
            </h2>
            <p className="text-xs text-zinc-400">
              FIS <strong className="text-red-300">{calc.atributosFinais.fisico}</strong> ({calc.conversao.fisico.bonusTexto}) • INT{" "}
              <strong className="text-sky-300">{calc.atributosFinais.inteligencia}</strong> ({calc.conversao.inteligencia.bonusTexto}) • SOC{" "}
              <strong className="text-amber-300">{calc.atributosFinais.social}</strong> ({calc.conversao.social.bonusTexto}) • Moral{" "}
              <strong className="text-lime-300">{dados.moralAtual}/6</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void handleBaixarPdfZumbi()}
            disabled={gerandoPdf}
            className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-950/50 transition-colors flex items-center gap-1.5"
          >
            <span>🧟</span>
            <span>{gerandoPdf ? "Gerando PDF..." : "Baixar PDF (Tema Zumbi)"}</span>
          </button>

          {!isReadOnly && onSalvarNaSala && (
            <button
              type="button"
              onClick={() => onSalvarNaSala(dados, calc)}
              disabled={enviando}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-100 text-xs font-semibold transition-colors"
            >
              {enviando
                ? "Salvando..."
                : temSalaAtiva
                  ? "💾 Salvar na Sala"
                  : "💾 Salvar Ficha"}
            </button>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO DOS PASSOS DO GUIA (SESSÃO 0) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 bg-zinc-900/90 border border-white/10 p-1.5 rounded-2xl">
        {ETAPAS_WIZARD.map((etapa) => {
          const ativa = etapaAtiva === etapa.id;
          return (
            <button
              key={etapa.id}
              type="button"
              onClick={() => setEtapaAtiva(etapa.id)}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all text-center truncate ${
                ativa
                  ? "bg-red-700 text-white shadow"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/70"
              }`}
            >
              {etapa.curto}
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* ETAPA 0: CONTEXTO DE 1950, RETRATO DO SOBREVIVENTE & GANCHO         */}
      {/* =================================================================== */}
      {etapaAtiva === "contexto" && (
        <div className="space-y-5">
          {/* Caixa do Texto de Ambientação de 1950 (Seção 1 do Guia) */}
          <div className="bg-zinc-900/80 border border-red-500/25 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[11px] font-mono uppercase text-red-400">
                  Seção 1 do Guia • Ambientação de Sessão 0
                </span>
                <h3 className="text-base font-bold text-white">
                  {CONTEXTO_1950.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarTextoAmbientacao(!mostrarTextoAmbientacao)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200"
              >
                {mostrarTextoAmbientacao
                  ? "Recolher Texto de 1950"
                  : "📖 Ler Texto Completo de 1950"}
              </button>
            </div>

            {mostrarTextoAmbientacao && (
              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed border-t border-white/10 pt-3">
                {CONTEXTO_1950.paragrafos.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <div className="bg-zinc-950/90 border border-red-500/20 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-red-300 block">
                    Boatos nos botequins e filas das paróquias sobre a Dr. Ray Grave & CIA:
                  </span>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    {CONTEXTO_1950.boatos.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                <p className="italic text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  {CONTEXTO_1950.radioComicio}
                </p>
              </div>
            )}
          </div>

          {/* Dados básicos + Upload de Imagem do Personagem */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Upload de Foto */}
            <div className="flex flex-col items-center justify-center bg-zinc-950/80 border border-dashed border-red-500/30 rounded-2xl p-4 text-center space-y-3">
              <div className="w-36 h-44 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                {dados.retratoBase64 ? (
                  <img
                    src={dados.retratoBase64}
                    alt="Retrato 3x4"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-3 text-zinc-500 space-y-1">
                    <span className="text-3xl block">📷</span>
                    <span className="text-[11px] block">
                      Adicione a foto do seu sobrevivente (sai no PDF Zumbi)
                    </span>
                  </div>
                )}
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer transition-colors">
                    {dados.retratoBase64 ? "Trocar Imagem" : "+ Adicionar Imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFoto}
                      className="hidden"
                    />
                  </label>
                  {dados.retratoBase64 && (
                    <button
                      type="button"
                      onClick={() => atualizarCampo("retratoBase64", "")}
                      className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs"
                    >
                      Remover
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Campos de Identificação em 1950 */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nome do Personagem (1950) *
                </label>
                <input
                  type="text"
                  value={dados.nome}
                  disabled={isReadOnly}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Ex.: Joaquim Ferreira da Silva, Dra. Helena Prado..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nome do Jogador
                </label>
                <input
                  type="text"
                  value={dados.nomeJogador}
                  disabled={isReadOnly}
                  onChange={(e) => atualizarCampo("nomeJogador", e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Idade em Fevereiro de 1950
                </label>
                <input
                  type="text"
                  value={dados.idade}
                  disabled={isReadOnly}
                  onChange={(e) => atualizarCampo("idade", e.target.value)}
                  placeholder="Ex.: 28"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Conexão com outros personagens (do bairro, fábrica, igreja ou família)
                </label>
                <input
                  type="text"
                  value={dados.conexaoComGrupo}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    atualizarCampo("conexaoComGrupo", e.target.value)
                  }
                  placeholder="Pelo menos 2 pares de personagens já se conhecem em São Miguel Paulista..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Ganchos para os Jogadores (Sem Spoilers da Sessão 1) */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Tabela de Ganchos para os Jogadores (Por que você está em São Miguel Paulista no dia do comício?)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha um dos 5 motivos cotidianos da tabela oficial e responda à pergunta da Sessão 0:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {GANCHOS_1950.map((g) => {
                const ativo = Number(dados.ganchoId) === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => atualizarCampo("ganchoId", g.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                      ativo
                        ? "bg-red-950/40 border-red-500 text-white shadow"
                        : "bg-zinc-950/70 hover:bg-zinc-900 border-white/10 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-red-400 font-mono">
                        GANCHO #{g.id}
                      </span>
                      {ativo && (
                        <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">
                          Escolhido
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white">
                      {g.titulo}
                    </span>
                    <span className="text-[11px] text-zinc-400 leading-relaxed">
                      {g.pergunta}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-red-300 mb-1.5">
                Sua Resposta para o Gancho #{ganchoSelecionado.id} ({ganchoSelecionado.titulo}):
              </label>
              <p className="text-xs text-zinc-400 mb-2 italic">
                &ldquo;{ganchoSelecionado.pergunta}&rdquo;
              </p>
              <textarea
                rows="2"
                disabled={isReadOnly}
                value={dados.ganchoResposta}
                onChange={(e) =>
                  atualizarCampo("ganchoResposta", e.target.value)
                }
                placeholder="Escreva a resposta do seu personagem para a Sessão 0..."
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ETAPA 5 — ATRIBUTOS BASE (DEIXADOS PARA O FINAL COM EXTRATO CLARO)  */}
      {/* =================================================================== */}
      {etapaAtiva === "passo1" && (
        <div className="space-y-5">
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase text-red-400">
                  Etapa 5 • Consolidação Final de Atributos (Pág. 8)
                </span>
                <h3 className="text-base font-bold text-white">
                  Distribuição Final dos 6 Pontos Livres de Atributo Base
                </h3>
                <p className="text-xs text-zinc-400">
                  Todos os bônus de <strong>Profissão</strong>, <strong>Origem/Subclasses</strong> e <strong>Qualidades/Defeitos</strong> já estão detalhados abaixo. Agora basta distribuir os seus <strong>6 pontos livres</strong> finais!
                </p>
              </div>
              <div
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold font-mono ${
                  calc.pontosAtributoRestantes === 0
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                }`}
              >
                Pontos Livres Restantes: {calc.pontosAtributoRestantes} / 6
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["fisico", "inteligencia", "social"].map((chave) => {
                const info = ATRIBUTOS_INFO[chave];
                const dist = Number(dados.pontosAtributoDist?.[chave] ?? 0);
                const finalVal = calc.atributosFinais[chave];
                const det = calc.detalhamentoAtributos;
                const conv = calc.conversao[chave];

                return (
                  <div
                    key={chave}
                    className="bg-zinc-950/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {info.nome}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 font-bold">
                          Bônus 2d6: {conv.bonusTexto}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                        {info.descricao}
                      </p>

                      {/* Extrato transparente de cada fonte de ponto */}
                      <div className="mt-3 bg-zinc-900/70 border border-white/5 rounded-xl p-2.5 space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between text-zinc-400">
                          <span>Base Inicial:</span>
                          <span className="text-zinc-200">+1</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Profissão (Etapa 2):</span>
                          <span
                            className={
                              det.profissao[chave] > 0
                                ? "text-emerald-300 font-bold"
                                : "text-zinc-500"
                            }
                          >
                            +{det.profissao[chave]}
                          </span>
                        </div>
                        {calc.modoEstilo !== "duas_subclasses" && (
                          <div className="flex justify-between text-zinc-400">
                            <span>Origem ({calc.origemObj?.nome?.split(" (")[0] || "—"}):</span>
                            <span
                              className={
                                det.origem[chave] > 0
                                  ? "text-amber-300 font-bold"
                                  : "text-zinc-500"
                              }
                            >
                              +{det.origem[chave]}
                            </span>
                          </div>
                        )}
                        {calc.modoEstilo !== "polivalente" && (
                          <div className="flex justify-between text-zinc-400">
                            <span>
                              {calc.modoEstilo === "duas_subclasses"
                                ? `1ª Sub (${calc.subclasse1Obj?.nome?.split(" (")[0] || "—"}):`
                                : `Subclasse (${calc.subclasse1Obj?.nome?.split(" (")[0] || "—"}):`}
                            </span>
                            <span
                              className={
                                det.subclasse1[chave] > 0
                                  ? "text-sky-300 font-bold"
                                  : "text-zinc-500"
                              }
                            >
                              +{det.subclasse1[chave]}
                            </span>
                          </div>
                        )}
                        {calc.modoEstilo === "duas_subclasses" && (
                          <div className="flex justify-between text-zinc-400">
                            <span>
                              2ª Sub ({calc.subclasse2Obj?.nome?.split(" (")[0] || "—"}):
                            </span>
                            <span
                              className={
                                det.subclasse2[chave] > 0
                                  ? "text-sky-300 font-bold"
                                  : "text-zinc-500"
                              }
                            >
                              +{det.subclasse2[chave]}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-zinc-400">
                          <span>Qualidades / Defeitos:</span>
                          <span
                            className={
                              det.qualidadesDefeitos[chave] > 0
                                ? "text-lime-300 font-bold"
                                : det.qualidadesDefeitos[chave] < 0
                                  ? "text-rose-400 font-bold"
                                  : "text-zinc-500"
                            }
                          >
                            {det.qualidadesDefeitos[chave] >= 0
                              ? `+${det.qualidadesDefeitos[chave]}`
                              : det.qualidadesDefeitos[chave]}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-1 text-zinc-200 font-bold">
                          <span>Subtotal Fixo:</span>
                          <span>{det.baseAntesLivres[chave]}</span>
                        </div>
                        <div className="flex justify-between text-red-300 font-bold">
                          <span>+ Seus Pontos Livres:</span>
                          <span>+{dist}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase font-mono">
                          Atributo Final ({det.baseAntesLivres[chave]} + {dist})
                        </span>
                        <span className="text-2xl font-bold text-white font-mono">
                          Total: {finalVal}
                        </span>
                        <span className="block text-[11px] text-amber-300 mt-0.5">
                          {conv.nivel}
                        </span>
                      </div>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => alterarPontoAtributo(chave, -1)}
                            disabled={dist <= 0}
                            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-base"
                          >
                            −
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-sm text-white">
                            +{dist}
                          </span>
                          <button
                            type="button"
                            onClick={() => alterarPontoAtributo(chave, 1)}
                            disabled={calc.pontosAtributoRestantes <= 0}
                            className="w-9 h-9 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-30 text-white font-bold text-base"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela Oficial de Conversão: Valor do Atributo Base -> Bônus no Dado (2d6) e Ações */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Tabela de Conversão: Valor do Atributo Base → Bônus no Dado (2d6) e Ações (Pág. 8)
            </h4>
            <p className="text-xs text-zinc-400">
              Atenção: Você <strong>não</strong> soma o valor bruto do Atributo Base no dado <code className="text-red-300">2d6</code>! O valor do Atributo Base consulta a tabela abaixo para definir o seu Bônus de Atributo:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400">
                    <th className="py-2 px-3">Valor do Atributo Base</th>
                    <th className="py-2 px-3">Bônus Somado no 2d6</th>
                    <th className="py-2 px-3">Nível Descritivo</th>
                    <th className="py-2 px-3">Ações por Turno (Apenas Físico Base)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {TABELA_CONVERSAO_ATRIBUTO.slice(0, 9).map((row) => {
                    const ativoFis =
                      calc.atributosFinais.fisico >= row.min &&
                      calc.atributosFinais.fisico <= row.max;
                    return (
                      <tr
                        key={row.faixa}
                        className={
                          ativoFis
                            ? "bg-red-950/40 text-white font-semibold"
                            : "text-zinc-300"
                        }
                      >
                        <td className="py-2 px-3 font-mono">{row.faixa}</td>
                        <td className="py-2 px-3 font-mono font-bold text-red-300">
                          {row.bonusTexto}
                        </td>
                        <td className="py-2 px-3">{row.nivel}</td>
                        <td className="py-2 px-3">{row.acoesFisico}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASSO 2 — DISTRIBUIÇÃO DE PERÍCIAS (10 PONTOS LIVRES)               */}
      {/* =================================================================== */}
      {etapaAtiva === "passo2" && (
        <div className="space-y-5">
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white">
                  Passo 2 — Distribuição de Perícias (Máximo de 6 na mesma perícia)
                </h3>
                <p className="text-xs text-zinc-400">
                  <strong>0 pontos (Não treinado) = Penalidade de Leigo:</strong> rola{" "}
                  <code className="text-red-300">2d6 - 3</code> e <strong>NÃO</strong> soma o Bônus do Atributo Base! Coloque pelo menos 1 ponto nas perícias que pretende usar.
                </p>
              </div>
              <div
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold font-mono ${
                  calc.pontosPericiaRestantes === 0
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                }`}
              >
                Pontos Livres de Perícia: {calc.pontosPericiaRestantes} /{" "}
                {calc.orcamentoPericiasBase}
              </div>
            </div>

            {calc.origemObj?.id === "polivalente" && (
              <div className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-200 px-3 py-2 rounded-xl">
                ✦ Origem <strong>Polivalente (Versátil)</strong> ativa: você recebeu <strong>+4 pontos extras de Perícia</strong> (totalizando 14 pontos).
              </div>
            )}
            {calc.origemObj?.id === "dedicado" && (
              <div className="text-xs bg-sky-500/10 border border-sky-500/30 text-sky-200 px-3 py-2 rounded-xl">
                ✦ Origem <strong>Dedicado (Mente Brilhante)</strong> ativa: você recebeu <strong>+3 pontos extras para Perícias de Inteligência</strong> (gastos em INT: {calc.pontosPericiaIntGastos}).
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
              {[
                {
                  chave: "fisico",
                  titulo: `Perícias de FÍSICO (Bônus Attr ${calc.conversao.fisico.bonusTexto})`,
                  cor: "text-red-300",
                },
                {
                  chave: "inteligencia",
                  titulo: `Perícias de INTELIGÊNCIA (Bônus Attr ${calc.conversao.inteligencia.bonusTexto})`,
                  cor: "text-sky-300",
                },
                {
                  chave: "social",
                  titulo: `Perícias de SOCIAL (Bônus Attr ${calc.conversao.social.bonusTexto})`,
                  cor: "text-amber-300",
                },
              ].map((grupo) => (
                <div
                  key={grupo.chave}
                  className="bg-zinc-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2.5"
                >
                  <h4 className={`text-xs font-bold uppercase ${grupo.cor}`}>
                    {grupo.titulo}
                  </h4>

                  <div className="space-y-2">
                    {calc.periciasCalculadas
                      .filter((p) => p.atributo === grupo.chave)
                      .map((p) => (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                            p.pontosEfetivos > 0
                              ? "bg-red-950/25 border-red-500/35"
                              : "bg-zinc-900/60 border-white/5"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {p.nome}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  p.leigo
                                    ? "bg-zinc-800 text-zinc-400"
                                    : "bg-emerald-500/20 text-emerald-300 font-bold"
                                }`}
                              >
                                {p.formulaRolagem}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {p.desc}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => alterarPontoPericia(p.id, -1)}
                                disabled={p.pontos <= 0}
                                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-xs"
                              >
                                −
                              </button>
                            )}
                            <span className="w-6 text-center font-mono text-xs font-bold text-white">
                              {p.pontos}
                            </span>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => alterarPontoPericia(p.id, 1)}
                                disabled={
                                  p.pontos >= 6 || calc.pontosPericiaRestantes <= 0
                                }
                                className="w-7 h-7 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-30 text-white font-bold text-xs"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASSO 3 — PROFISSÃO OU EX-PROFISSÃO DE 1950                         */}
      {/* =================================================================== */}
      {etapaAtiva === "passo3" && (
        <div className="space-y-5">
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              Passo 3 — Profissão ou Ex-Profissão de 1950 (Págs. 30–31)
            </h3>

            {/* Modalidade: Profissão Atual vs Ex-Profissão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => atualizarCampo("modalidadeProfissao", "atual")}
                className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                  dados.modalidadeProfissao === "atual"
                    ? "bg-red-950/40 border-red-500 text-white shadow"
                    : "bg-zinc-950/70 border-white/10 text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    Profissão Atual (Fevereiro de 1950)
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-red-600/30 text-red-200 font-bold">
                    +2 no Atributo
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Recebe <strong>+1d6 de vantagem</strong> em testes narrativos diretamente ligados ao seu ofício.
                </p>
                <p className="text-[11px] text-amber-300">
                  Custo / Requisito: Deve escolher <strong>+1 Defeito extra</strong> na ficha (desgaste, vício ou rotina pesada da profissão).
                </p>
              </button>

              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => atualizarCampo("modalidadeProfissao", "ex")}
                className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                  dados.modalidadeProfissao === "ex"
                    ? "bg-red-950/40 border-red-500 text-white shadow"
                    : "bg-zinc-950/70 border-white/10 text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    Ex-Profissão (Algo que você fazia antes)
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 font-bold">
                    +1 no Atributo
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Conhecimento prévio da área, mas sem o +1d6 de vantagem ativa.
                </p>
                <p className="text-[11px] text-emerald-300">
                  Custo / Requisito: <strong>Nenhum defeito extra.</strong>
                </p>
              </button>
            </div>

            {/* Tabela de Profissões de 1950 por Atributo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
              {[
                {
                  chave: "fisico",
                  titulo: `Profissões de FÍSICO (+${calc.bonusProfissaoValor} FIS)`,
                  cor: "text-red-300",
                },
                {
                  chave: "inteligencia",
                  titulo: `Profissões de INTELIGÊNCIA (+${calc.bonusProfissaoValor} INT)`,
                  cor: "text-sky-300",
                },
                {
                  chave: "social",
                  titulo: `Profissões de SOCIAL (+${calc.bonusProfissaoValor} SOC)`,
                  cor: "text-amber-300",
                },
              ].map((col) => (
                <div
                  key={col.chave}
                  className="bg-zinc-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2"
                >
                  <h4 className={`text-xs font-bold uppercase ${col.cor}`}>
                    {col.titulo}
                  </h4>
                  <div className="space-y-1.5">
                    {PROFISSOES_1950.filter((p) => p.atributo === col.chave).map(
                      (prof) => {
                        const selecionada = dados.profissaoId === prof.id;
                        return (
                          <button
                            key={prof.id}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => selecionarProfissao(prof)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                              selecionada
                                ? "bg-red-700 text-white border-red-400 font-semibold shadow"
                                : "bg-zinc-900/70 hover:bg-zinc-800 border-white/5 text-zinc-300"
                            }`}
                          >
                            {prof.nome}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ETAPA 3 — ORIGENS E SUBCLASSES DO LIVRO (PÁGS. 32 A 50)             */}
      {/* =================================================================== */}
      {etapaAtiva === "passo4" && (
        <div className="space-y-5">
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-red-400">
                  Etapa 3 • Estilo do Sobrevivente (Págs. 32 a 50)
                </span>
                <h3 className="text-base font-bold text-white">
                  Origens e Subclasses do Livro
                </h3>
                <p className="text-xs text-zinc-400">
                  Escolha <strong>1 Origem + 1 Subclasse</strong>, apenas a Origem <em>Polivalente</em>, ou <strong>2 Subclasses</strong> (sem Origem).
                </p>
              </div>

              {/* Painel ao vivo confirmando os pontos somados nos atributos */}
              <div className="bg-zinc-950/95 border border-emerald-500/35 rounded-xl px-3.5 py-2.5 text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold block">
                  ✓ Pontos Adicionados aos Atributos nesta Etapa:
                </span>
                <div className="flex items-center gap-3 font-mono font-bold">
                  <span className="text-red-300">
                    FIS: +
                    {calc.detalhamentoAtributos.origem.fisico +
                      calc.detalhamentoAtributos.subclasse1.fisico +
                      calc.detalhamentoAtributos.subclasse2.fisico}
                  </span>
                  <span className="text-sky-300">
                    INT: +
                    {calc.detalhamentoAtributos.origem.inteligencia +
                      calc.detalhamentoAtributos.subclasse1.inteligencia +
                      calc.detalhamentoAtributos.subclasse2.inteligencia}
                  </span>
                  <span className="text-amber-300">
                    SOC: +
                    {calc.detalhamentoAtributos.origem.social +
                      calc.detalhamentoAtributos.subclasse1.social +
                      calc.detalhamentoAtributos.subclasse2.social}
                  </span>
                </div>
              </div>
            </div>

            {/* Seletor de combinação */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "origem_subclasse",
                  rotulo: "1 Origem + 1 Subclasse",
                  desc: "Padrão recomendado do livro",
                },
                {
                  id: "polivalente",
                  rotulo: "Apenas Origem Polivalente",
                  desc: "+1 Atributo e +4 pontos extras de Perícia (sem Subclasse)",
                },
                {
                  id: "duas_subclasses",
                  rotulo: "2 Subclasses (Sem Origem)",
                  desc: "Combina 2 especializações diferentes da Tabela B",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => selecionarModoEstilo(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    calc.modoEstilo === m.id
                      ? "bg-red-950/40 border-red-500 text-white shadow"
                      : "bg-zinc-950/70 border-white/10 text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  <span className="text-xs font-bold block">{m.rotulo}</span>
                  <span className="text-[11px] text-zinc-400">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* Tabela A — Origens Essenciais */}
            {calc.modoEstilo !== "duas_subclasses" && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase text-amber-300">
                  Tabela A — Origens Essenciais (Escolha 1)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ORIGENS_LIVRO.map((orig) => {
                    const ativa = calc.origemObj?.id === orig.id;
                    return (
                      <div
                        key={orig.id}
                        onClick={() => {
                          if (isReadOnly) return;
                          if (orig.id === "polivalente") {
                            selecionarModoEstilo("polivalente");
                          } else {
                            setDados((prev) => ({
                              ...prev,
                              origemId: orig.id,
                              modoEstilo:
                                prev.modoEstilo === "polivalente"
                                  ? "origem_subclasse"
                                  : prev.modoEstilo,
                            }));
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          ativa
                            ? "bg-red-950/40 border-red-500 text-white shadow"
                            : "bg-zinc-950/70 hover:bg-zinc-900 border-white/10 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">
                            {orig.nome}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 font-semibold">
                            {orig.bonusResumo}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          <strong>Pré-requisito:</strong> {orig.requisitoTexto}
                        </p>
                        <p className="text-xs text-zinc-200 leading-relaxed">
                          <strong className="text-red-300">
                            {orig.habilidadeNome}:
                          </strong>{" "}
                          {orig.habilidadeTexto}
                        </p>

                        {ativa &&
                          (!orig.atributosOpcoes ||
                            orig.atributosOpcoes.length === 0) && (
                            <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                              <span className="text-emerald-300 font-semibold font-mono">
                                ✓ Bônus somado automaticamente: {orig.bonusResumo}
                              </span>
                            </div>
                          )}

                        {ativa && orig.atributosOpcoes?.length > 0 && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap"
                          >
                            <span className="text-[11px] text-emerald-300 font-semibold">
                              Escolha qual atributo ganha +1:
                            </span>
                            {orig.atributosOpcoes.map((attr) => {
                              const escolhido =
                                (orig.atributosOpcoes.includes(
                                  dados.origemAtributoEscolha
                                )
                                  ? dados.origemAtributoEscolha
                                  : orig.atributosOpcoes[0]) === attr;
                              return (
                                <button
                                  key={attr}
                                  type="button"
                                  onClick={() =>
                                    atualizarCampo("origemAtributoEscolha", attr)
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${
                                    escolhido
                                      ? "bg-emerald-600 text-white shadow"
                                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  {escolhido ? "✓ " : ""}+1{" "}
                                  {ATRIBUTOS_INFO[attr].sigla}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {ativa && orig.requerDetalhe && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-1"
                          >
                            <input
                              type="text"
                              value={dados.origemDetalhe}
                              onChange={(e) =>
                                atualizarCampo("origemDetalhe", e.target.value)
                              }
                              placeholder={orig.requerDetalhe}
                              className="w-full bg-zinc-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500/75"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabela B — Subclasses Essenciais */}
            {calc.modoEstilo !== "polivalente" && (
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase text-sky-300">
                    Tabela B — Subclasses Essenciais (
                    {calc.modoEstilo === "duas_subclasses"
                      ? "Clique em 2 Subclasses diferentes para marcar a 1ª e a 2ª"
                      : "Escolha 1 Subclasse"}
                    )
                  </h4>

                  {calc.modoEstilo === "duas_subclasses" && (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-200">
                        1ª: <strong>{calc.subclasse1Obj?.nome?.split(" (")[0] || "Nenhuma"}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-200">
                        2ª: <strong>{calc.subclasse2Obj?.nome?.split(" (")[0] || "Nenhuma"}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUBCLASSES_LIVRO.map((sub) => {
                    const isSub1 = calc.subclasse1Obj?.id === sub.id;
                    const isSub2 =
                      calc.modoEstilo === "duas_subclasses" &&
                      calc.subclasse2Obj?.id === sub.id;
                    const ativa = isSub1 || isSub2;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => clicarCardSubclasse(sub.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          isSub1
                            ? "bg-sky-950/40 border-sky-400 text-white shadow"
                            : isSub2
                              ? "bg-indigo-950/40 border-indigo-400 text-white shadow"
                              : "bg-zinc-950/70 hover:bg-zinc-900 border-white/10 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {sub.nome}
                            </span>
                            {isSub1 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-600 text-white font-bold">
                                {calc.modoEstilo === "duas_subclasses"
                                  ? "1ª Subclasse"
                                  : "Selecionada"}
                              </span>
                            )}
                            {isSub2 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                                2ª Subclasse
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-mono text-sky-300 font-semibold">
                            {sub.bonusResumo}
                          </span>
                        </div>

                        {calc.modoEstilo === "duas_subclasses" && !isReadOnly && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 pt-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => definirSlotSubclasse(1, sub.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                isSub1
                                  ? "bg-sky-600 text-white"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              }`}
                            >
                              {isSub1 ? "✓ Definida como 1ª" : "Marcar como 1ª"}
                            </button>
                            <button
                              type="button"
                              onClick={() => definirSlotSubclasse(2, sub.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                isSub2
                                  ? "bg-indigo-600 text-white"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              }`}
                            >
                              {isSub2 ? "✓ Definida como 2ª" : "Marcar como 2ª"}
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-zinc-400">
                          <strong>Pré-requisito:</strong> {sub.requisitoTexto}
                        </p>
                        <p className="text-xs text-zinc-200 leading-relaxed">
                          <strong className="text-sky-300">
                            {sub.habilidadeNome}:
                          </strong>{" "}
                          {sub.habilidadeTexto}
                        </p>

                        {ativa &&
                          (!sub.atributosOpcoes ||
                            sub.atributosOpcoes.length === 0) && (
                            <div className="pt-1.5 border-t border-white/10 text-[11px] text-emerald-300 font-mono font-semibold">
                              ✓ Bônus somado automaticamente: {sub.bonusResumo}
                            </div>
                          )}

                        {ativa && sub.atributosOpcoes?.length > 0 && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap"
                          >
                            <span className="text-[11px] text-emerald-300 font-semibold">
                              Escolha qual atributo ganha +1:
                            </span>
                            {sub.atributosOpcoes.map((attr) => {
                              const campoAttr = isSub1
                                ? "subclasse1AtributoEscolha"
                                : "subclasse2AtributoEscolha";
                              const valorAtual = sub.atributosOpcoes.includes(
                                dados[campoAttr]
                              )
                                ? dados[campoAttr]
                                : sub.atributosOpcoes[0];
                              const escolhido = valorAtual === attr;
                              return (
                                <button
                                  key={attr}
                                  type="button"
                                  onClick={() => atualizarCampo(campoAttr, attr)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${
                                    escolhido
                                      ? "bg-emerald-600 text-white shadow"
                                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  {escolhido ? "✓ " : ""}+1{" "}
                                  {ATRIBUTOS_INFO[attr].sigla}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {ativa && sub.requerDetalhe && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-1"
                          >
                            <input
                              type="text"
                              value={
                                isSub1
                                  ? dados.subclasse1Detalhe
                                  : dados.subclasse2Detalhe
                              }
                              onChange={(e) =>
                                atualizarCampo(
                                  isSub1
                                    ? "subclasse1Detalhe"
                                    : "subclasse2Detalhe",
                                  e.target.value
                                )
                              }
                              placeholder={sub.requerDetalhe}
                              className="w-full bg-zinc-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500/75"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ETAPA 4 — MORAL, CONSCIÊNCIA, ALINHAMENTO, QUALIDADES E DEFEITOS    */}
      {/* =================================================================== */}
      {etapaAtiva === "passo5" && (
        <div className="space-y-5">
          {/* Moral (1-6), Consciência (1-12) e As 3 Âncoras de Moral */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Etapa 4 — Moral (Escala 1 a 6), Consciência (Escala 1 a 12) e Âncoras
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                <strong>Moral Inicial = 3</strong> (máx. 6) • <strong>Consciência Inicial = 1</strong> (máx. 12; ao acumular 12 pontos, ganha +1 de Moral e volta para 1). <strong>Teste de Moral (1d6):</strong> você precisa tirar um número <strong>MENOR</strong> que a sua Moral atual (<code className="text-lime-300">Resultado &lt; Moral Atual</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950/80 border border-lime-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-lime-300">
                    Moral (1 a 6)
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {dados.moralAtual} / 6
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => atualizarCampo("moralAtual", v)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        v <= dados.moralAtual
                          ? "bg-lime-700 border-lime-400 text-white"
                          : "bg-zinc-900 border-white/10 text-zinc-500"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-zinc-400 block">
                  Com 1 de Moral, falha automaticamente em qualquer Teste de Moral.
                </span>
              </div>

              <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    Consciência (1 a 12)
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {dados.conscienciaAtual} / 12
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => atualizarCampo("conscienciaAtual", v)}
                      className={`py-1 rounded text-[11px] font-mono font-bold border ${
                        v <= dados.conscienciaAtual
                          ? "bg-amber-600 border-amber-300 text-white"
                          : "bg-zinc-900 border-white/10 text-zinc-500"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-zinc-400 block">
                  12 Consciência = +1 Moral (volta a 1). Abaixo de 0 = -1 Moral.
                </span>
              </div>

              <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-300">
                    Moral Dourada (Em Jogo)
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {dados.moralDourada}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Começa em <strong>0</strong>. Ponto de Moral &ldquo;blindado&rdquo; por marco heroico ou habilidade de Líder/Terapeuta: impede perda de Moral por Falha Crítica <code className="text-red-300">[1,1]</code>.
                </p>
              </div>
            </div>

            {/* As 3 Âncoras de Moral (vazias com texto translúcido) */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-xs font-bold text-lime-300">
                As 3 Âncoras de Moral (Cada ponto inicial de Moral deve estar ligado a algo que mantém você humano):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  "O que te motiva a continuar vivo? (pessoa amada, memória feliz...)",
                  "Quem ou o que você jurou proteger custe o que custar?",
                  "Qual promessa, fé ou propósito impede você de desistir?",
                ].map((placeholderTexto, idx) => (
                  <div key={idx}>
                    <span className="text-[11px] text-zinc-400 block mb-1">
                      Âncora de Moral #{idx + 1}
                    </span>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={dados.ancorasMoral?.[idx] || ""}
                      onChange={(e) => {
                        const novas = [...(dados.ancorasMoral || ["", "", ""])];
                        novas[idx] = e.target.value;
                        atualizarCampo("ancorasMoral", novas);
                      }}
                      placeholder={placeholderTexto}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500/70"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Alinhamento do Personagem (3 respostas vazias com texto translúcido) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">
                  1. O que você acha CERTO (+2 Consciência)
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dados.alinhamentoCerto}
                  onChange={(e) =>
                    atualizarCampo("alinhamentoCerto", e.target.value)
                  }
                  placeholder="O que é justo e correto para você?"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500/70"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-300 mb-1">
                  2. O que você REPUDIA / acha ERRADO (-2 Consciência)
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dados.alinhamentoRepudia}
                  onChange={(e) =>
                    atualizarCampo("alinhamentoRepudia", e.target.value)
                  }
                  placeholder="O que você jamais aceitaria fazer?"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500/70"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  3. O que você TEME
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dados.alinhamentoTeme}
                  onChange={(e) =>
                    atualizarCampo("alinhamentoTeme", e.target.value)
                  }
                  placeholder="Qual é o seu maior medo?"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500/70"
                />
              </div>
            </div>
          </div>

          {/* Qualidades e Defeitos (Págs. 55 a 60) */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Qualidades e Defeitos (Págs. 55 a 60)
                </h4>
                <p className="text-xs text-zinc-400">
                  A quantidade de <strong>Qualidades</strong> (máx. 3) deve ser igual à quantidade de <strong>Defeitos</strong>{" "}
                  {dados.modalidadeProfissao === "atual"
                    ? "(+1 Defeito extra pela Profissão Atual)"
                    : "(sem defeito extra na Ex-Profissão)"}
                  .
                </p>
              </div>
              <div
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold font-mono ${
                  calc.defeitosSelecionados.length === calc.defeitosObrigatorios
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-500/15 border-rose-500/40 text-rose-300"
                }`}
              >
                Qualidades: {calc.qualidadesSelecionadas.length}/3 • Defeitos:{" "}
                {calc.defeitosSelecionados.length}/{calc.defeitosObrigatorios}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Coluna Qualidades */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase text-lime-300">
                  Qualidades Recomendadas (Escolha até 3)
                </h5>
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {QUALIDADES_LIVRO.map((q) => {
                    const ativa = (dados.qualidadesIds || []).includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => alternarQualidade(q.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                          ativa
                            ? "bg-lime-950/35 border-lime-500 text-white"
                            : "bg-zinc-950/70 hover:bg-zinc-900 border-white/5 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{q.nome}</span>
                          {ativa && (
                            <span className="text-[10px] bg-lime-600 text-white px-2 py-0.5 rounded-full font-bold">
                              Ativa
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">{q.efeito}</p>

                        {ativa && q.escolheAtributo && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-1.5 flex items-center gap-1.5"
                          >
                            <span className="text-[11px] text-zinc-300">
                              Atributo (+1):
                            </span>
                            {["fisico", "inteligencia", "social"].map((attr) => (
                              <button
                                key={attr}
                                type="button"
                                onClick={() =>
                                  atualizarCampo("determinacaoAtributo", attr)
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  dados.determinacaoAtributo === attr
                                    ? "bg-lime-600 text-white"
                                    : "bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                +1 {ATRIBUTOS_INFO[attr].sigla}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna Defeitos */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase text-rose-300">
                  Defeitos Recomendados (Escolha {calc.defeitosObrigatorios})
                </h5>
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {DEFEITOS_LIVRO.map((df) => {
                    const ativo = (dados.defeitosIds || []).includes(df.id);
                    return (
                      <div
                        key={df.id}
                        onClick={() => alternarDefeito(df.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                          ativo
                            ? "bg-rose-950/35 border-rose-500 text-white"
                            : "bg-zinc-950/70 hover:bg-zinc-900 border-white/5 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{df.nome}</span>
                          {ativo && (
                            <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">{df.efeito}</p>

                        {ativo && df.escolheMembroLesao && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-1.5 flex items-center gap-2"
                          >
                            <span className="text-[11px] text-rose-200">
                              Membro com -10 PV:
                            </span>
                            <select
                              value={dados.membroCicatrizId}
                              onChange={(e) =>
                                atualizarCampo("membroCicatrizId", e.target.value)
                              }
                              className="bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                            >
                              {PARTES_DO_CORPO.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {ativo && df.requerDetalhe && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-1"
                          >
                            <input
                              type="text"
                              value={dados.detalhesDefeitos?.[df.id] || ""}
                              onChange={(e) =>
                                atualizarCampo("detalhesDefeitos", {
                                  ...(dados.detalhesDefeitos || {}),
                                  [df.id]: e.target.value,
                                })
                              }
                              placeholder={df.requerDetalhe}
                              className="w-full bg-zinc-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-zinc-500/75"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ETAPA 7 — VIDA POR MEMBRO, INVENTÁRIO DE 1950 E PDF TEMA ZUMBI      */}
      {/* =================================================================== */}
      {etapaAtiva === "passo6" && (
        <div className="space-y-6">
          {/* Saúde Localizada por Parte do Corpo */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white">
                  Etapa 7 — Pontos de Vida por Membro (Físico Base Final = {calc.atributosFinais.fisico})
                </h3>
                <p className="text-xs text-zinc-400">
                  No sistema Ano Um, o dano é localizado por parte do corpo. Seu Físico Base final ({calc.atributosFinais.fisico}) já foi somado automaticamente:
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                ⚠ Limiar da Dor: Golpe único &gt; 15 dano = perde próximo turno/reação
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {calc.partesCorpoCalculadas.map((parte) => (
                <div
                  key={parte.id}
                  className={`p-4 rounded-2xl border space-y-1.5 ${
                    parte.vital
                      ? "bg-red-950/35 border-red-500/40"
                      : "bg-zinc-950/80 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {parte.nome}
                    </span>
                    <span className="text-lg font-mono font-bold text-red-300">
                      {parte.pvMax} PV
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    Cálculo: {parte.formula} ({parte.basePv} +{" "}
                    {calc.atributosFinais.fisico}
                    {parte.penalidadeCicatriz > 0
                      ? ` - ${parte.penalidadeCicatriz} Cicatriz`
                      : ""}
                    )
                  </span>
                  <p className="text-[11px] text-zinc-300">
                    <strong>Se chegar a 0 PV:</strong> {parte.efeitoZeroPv}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Espaços de Inventário (Sem Mochila) e Kit Inicial de 1950 */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white">
                  Espaços de Inventário (Sem Mochila) e Kit Inicial de 1950
                </h3>
                <p className="text-xs text-zinc-400">
                  O que todo personagem leva nos bolsos/cinto no dia do comício em São Miguel Paulista (armas pesadas e mochilas serão conquistadas na Sessão 1):
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold font-mono">
                Capacidade nos Bolsos/Cinto: {calc.espacosInventario} Espaços
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  1. Roupas comuns de fevereiro de 1950
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dados.kitRoupa1950}
                  onChange={(e) => atualizarCampo("kitRoupa1950", e.target.value)}
                  placeholder={`Que roupa você está vestindo? (ex.: ${calc.profissaoObj.sugestaoRoupa})`}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500/70"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  2. Documentos no bolso & Dinheiro (Cr$ 50 a Cr$ 200)
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dados.kitDocumentosDinheiro}
                  onChange={(e) =>
                    atualizarCampo("kitDocumentosDinheiro", e.target.value)
                  }
                  placeholder="Quais documentos e quantos Cruzeiros (Cr$) leva no bolso?"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500/70"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  3. 1 Objeto Pessoal de Valor Sentimental (ligado à Âncora de Moral)
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dados.kitObjetoSentimental}
                  onChange={(e) =>
                    atualizarCampo("kitObjetoSentimental", e.target.value)
                  }
                  placeholder="Qual lembrança ligada à sua Âncora de Moral está com você?"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500/70"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  4. 1 Pequeno Utensílio de Bolso coerente com a Profissão
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dados.kitUtensilioProfissao}
                  onChange={(e) =>
                    atualizarCampo("kitUtensilioProfissao", e.target.value)
                  }
                  placeholder={`Qual ferramenta de bolso leva? (ex.: ${calc.profissaoObj.sugestaoUtensilio})`}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500/70"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW DO DOSSIÊ ZUMBI + BOTÃO DE DOWNLOAD DO PDF ESTILIZADO */}
          <div className="bg-gradient-to-br from-[#191311] via-[#120f0d] to-[#1f1212] border-2 border-red-800/70 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-red-800/40 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 block">
                  ☣ Dossiê Oficial de Quarentena • Dr. Ray Grave & CIA (1950)
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Ficha Pronta para Exportação em PDF (Tema Zumbi)
                </h3>
                <p className="text-xs text-stone-400">
                  O PDF inclui 2 páginas A4 completas com a foto do sobrevivente, tabelas de 1950, PV por membro, Moral/Consciência e Kit de Bolso.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => void handleBaixarPdfZumbi()}
                  disabled={gerandoPdf}
                  className="px-5 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold shadow-xl shadow-red-950/60 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>🧟</span>
                  <span>
                    {gerandoPdf
                      ? "Gerando PDF Zumbi..."
                      : "Gerar e Baixar PDF Estilizado"}
                  </span>
                </button>

                {!isReadOnly && onSalvarNaSala && (
                  <button
                    type="button"
                    onClick={() => onSalvarNaSala(dados, calc)}
                    disabled={enviando}
                    className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/15 text-white text-xs font-semibold transition-colors"
                  >
                    {enviando ? "Salvando..." : "💾 Salvar Ficha no Sistema"}
                  </button>
                )}
              </div>
            </div>

            {/* Resumo Visual Estilo Dossiê Zumbi */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-black/40 border border-red-900/40 rounded-xl p-3.5 flex flex-col items-center justify-center text-center space-y-2">
                {dados.retratoBase64 ? (
                  <img
                    src={dados.retratoBase64}
                    alt={dados.nome}
                    className="w-28 h-32 object-cover rounded-lg border border-red-500/40"
                  />
                ) : (
                  <div className="w-28 h-32 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl">
                    🧟
                  </div>
                )}
                <span className="font-bold text-white text-sm">
                  {dados.nome || "Sobrevivente Sem Nome"}
                </span>
                <span className="text-[11px] text-red-300 font-mono">
                  Gancho #{ganchoSelecionado.id}: {ganchoSelecionado.titulo}
                </span>
              </div>

              <div className="bg-black/40 border border-red-900/40 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-mono uppercase text-red-400 font-bold">
                  Atributos & Ações (2d6)
                </span>
                <div className="space-y-1.5 text-stone-200">
                  <div className="flex justify-between">
                    <span>Físico (FIS):</span>
                    <strong className="text-red-300">
                      {calc.atributosFinais.fisico} (Bônus {calc.conversao.fisico.bonusTexto})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Inteligência (INT):</span>
                    <strong className="text-sky-300">
                      {calc.atributosFinais.inteligencia} (Bônus {calc.conversao.inteligencia.bonusTexto})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Social (SOC):</span>
                    <strong className="text-amber-300">
                      {calc.atributosFinais.social} (Bônus {calc.conversao.social.bonusTexto})
                    </strong>
                  </div>
                  <div className="pt-1 border-t border-white/10 text-[11px] text-stone-400">
                    {calc.conversao.fisico.acoesFisico}
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-red-900/40 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-mono uppercase text-red-400 font-bold">
                  PV por Membro
                </span>
                <div className="space-y-1 text-stone-200 font-mono text-[11px]">
                  {calc.partesCorpoCalculadas.map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span>{p.nome.replace(" (Vital)", "")}:</span>
                      <strong className="text-red-300">{p.pvMax} PV</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 border border-red-900/40 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-mono uppercase text-lime-400 font-bold">
                  Psicologia & Estilo
                </span>
                <p className="text-stone-300">
                  Moral: <strong className="text-lime-300">{dados.moralAtual}/6</strong> • Consciência:{" "}
                  <strong className="text-amber-300">{dados.conscienciaAtual}/12</strong>
                </p>
                <p className="text-[11px] text-stone-400">
                  <strong>Origem/Sub:</strong>{" "}
                  {[
                    calc.origemObj?.nome,
                    calc.subclasse1Obj?.nome,
                    calc.subclasse2Obj?.nome,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </p>
                <p className="text-[11px] text-stone-400">
                  <strong>Qualidades:</strong>{" "}
                  {calc.qualidadesSelecionadas.map((q) => q.nome).join(", ") || "—"}
                </p>
                <p className="text-[11px] text-stone-400">
                  <strong>Defeitos:</strong>{" "}
                  {calc.defeitosSelecionados.map((d) => d.nome).join(", ") || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTÕES DE AVANÇAR / VOLTAR PASSO */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={indiceEtapaAtual <= 0}
          onClick={() =>
            indiceEtapaAtual > 0 &&
            setEtapaAtiva(ETAPAS_WIZARD[indiceEtapaAtual - 1].id)
          }
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 text-xs font-medium text-zinc-300"
        >
          ← Passo Anterior
        </button>

        {indiceEtapaAtual < ETAPAS_WIZARD.length - 1 ? (
          <button
            type="button"
            onClick={() =>
              setEtapaAtiva(ETAPAS_WIZARD[indiceEtapaAtual + 1].id)
            }
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-lg"
          >
            Próximo Passo →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleBaixarPdfZumbi()}
            disabled={gerandoPdf}
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-lg"
          >
            🧟 Baixar PDF Estilizado (Tema Zumbi)
          </button>
        )}
      </div>
    </div>
  );
}
