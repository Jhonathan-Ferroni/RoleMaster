import { useState, useEffect, useMemo } from "react";
import { api, obterUsuarioLogado } from "../services/api";
import { FichaModal } from "../pages/FichaModel";
import {
  calcularDistanciaMetros,
  calcularModificador,
  rolarDado,
  rolarExpressaoDados,
  obterAcoesDaFicha,
  PROPS_CATALOGO,
  TEMAS_TABULEIRO,
  CENARIOS_PADROES,
  FICHAS_PADROES_LOCAIS,
} from "../data/dndPresets";

const CONDICOES_DND = [
  { id: "abencoado", nome: "Abençoado (+1d4)", icone: "✨", desc: "Soma +1d4 nas rolagens de ataque." },
  { id: "envenenado", nome: "Envenenado", icone: "🤢", desc: "Desvantagem nas rolagens de ataque." },
  { id: "caido", nome: "Caído (Prone)", icone: "🔻", desc: "Ataques corpo a corpo contra têm Vantagem." },
  { id: "atordoado", nome: "Atordoado", icone: "💫", desc: "Incapaz de agir; ataques contra têm Vantagem." },
  { id: "concentrando", nome: "Concentração", icone: "🧠", desc: "Mantendo magia ativa de concentração." },
];

const ICONES_CLASSES = {
  guerreiro: "🛡️",
  barbaro: "🪓",
  bárbaro: "🪓",
  paladino: "⚔️",
  mago: "🧙‍♂️",
  feiticeiro: "🔮",
  bruxo: "👁️",
  clerigo: "✨",
  clérigo: "✨",
  ladino: "🗡️",
  arqueiro: "🏹",
  patrulheiro: "🏹",
  bardo: "🪕",
  druida: "🌿",
  monge: "🥋",
  inimigo: "👹",
  chefe: "🐉",
};

const obterIconeFicha = (ficha, faccao) => {
  if (!ficha) return faccao === "inimigo" ? "👹" : "🛡️";
  const nome = (ficha.nome || "").toLowerCase();
  const classe = (ficha.classe || "").toLowerCase();
  if (nome.includes("dragão") || nome.includes("dragao")) return "🐉";
  if (nome.includes("goblin")) return "👺";
  if (nome.includes("orc")) return "👹";
  if (nome.includes("esqueleto")) return "💀";

  for (const [chave, icone] of Object.entries(ICONES_CLASSES)) {
    if (classe.includes(chave)) return icone;
  }
  return faccao === "inimigo" ? "👹" : "⚔️";
};

export function TabuleiroBatalha({
  tenantId,
  isMestre,
  conexaoSignalR,
  midias = [],
  cenaStorytelling = "",
  estadoExterno,
  onVoltarStorytelling,
}) {
  const usuarioLogado = obterUsuarioLogado();

  // === FICHAS E CENÁRIOS ===
  const [fichasMesa, setFichasMesa] = useState([]);
  const [carregandoFichas, setCarregandoFichas] = useState(false);
  const [cenariosSalvos, setCenariosSalvos] = useState([]);

  // === ESTADO DO CENÁRIO ATUAL ===
  const [cenarioAtual, setCenarioAtual] = useState(() => ({
    id: CENARIOS_PADROES[0].id,
    nome: CENARIOS_PADROES[0].nome,
    tema: CENARIOS_PADROES[0].tema,
    largura: CENARIOS_PADROES[0].largura,
    altura: CENARIOS_PADROES[0].altura,
    fundoUrl: cenaStorytelling || "",
    props: [...CENARIOS_PADROES[0].props],
  }));

  // === ESTADO DE COMBATE ===
  const [tokens, setTokens] = useState([]);
  const [rodada, setRodada] = useState(1);
  const [turnoIndex, setTurnoIndex] = useState(0);
  const [combateIniciado, setCombateIniciado] = useState(false);
  const [logsCombate, setLogsCombate] = useState([
    {
      id: "init",
      tipo: "sistema",
      texto: "⚔️ Tabuleiro tático D&D 5e aberto. Posicione os personagens e inicie a iniciativa!",
      horario: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // === INTERAÇÃO, ZOOM MOBILE E GAVETA RESPONSIVA ===
  const [tokenSelecionadoId, setTokenSelecionadoId] = useState(null);
  const [modoInteracao, setModoInteracao] = useState("mover"); // 'mover' | 'acao' | 'spawn' | 'prop'
  const [acaoSelecionada, setAcaoSelecionada] = useState(null);
  const [modoRolagemD20, setModoRolagemD20] = useState("normal");
  const [abaLateral, setAbaLateral] = useState("combate"); // 'combate' | 'spawn' | 'cenario' | 'logs'
  const [gavetaMobileAberta, setGavetaMobileAberta] = useState(false);
  const [tamanhoCelula, setTamanhoCelula] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 50
  );

  // === CONTROLES DE SPAWN E EDITOR DE CENÁRIO (MESTRE) ===
  const [fichaParaSpawnId, setFichaParaSpawnId] = useState("");
  const [faccaoSpawn, setFaccaoSpawn] = useState("heroi");
  const [spawnOculto, setSpawnOculto] = useState(false);
  const [propSelecionado, setPropSelecionado] = useState(PROPS_CATALOGO[0]);
  const [modoBorrachaProp, setModoBorrachaProp] = useState(false);
  const [nomeNovoCenario, setNomeNovoCenario] = useState("");

  // === MODAL DE VISUALIZAÇÃO DE FICHA ===
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaModalDados, setFichaModalDados] = useState({ id: null, objeto: null });

  const podeControlarToken = (tok) => {
    if (!tok) return false;
    if (isMestre) return true;
    if (tok.faccao === "inimigo") return false;
    const donoId = tok.ficha?.usuarioId;
    if (!donoId) return tok.faccao === "heroi";
    return Number(donoId) === Number(usuarioLogado?.id);
  };

  useEffect(() => {
    if (!estadoExterno) return;
    if (estadoExterno.cenarioAtual) setCenarioAtual(estadoExterno.cenarioAtual);
    if (Array.isArray(estadoExterno.tokens)) setTokens(estadoExterno.tokens);
    if (typeof estadoExterno.rodada === "number") setRodada(estadoExterno.rodada);
    if (typeof estadoExterno.turnoIndex === "number") setTurnoIndex(estadoExterno.turnoIndex);
    if (typeof estadoExterno.combateIniciado === "boolean")
      setCombateIniciado(estadoExterno.combateIniciado);
    if (Array.isArray(estadoExterno.logsCombate)) setLogsCombate(estadoExterno.logsCombate);
  }, [estadoExterno]);

  useEffect(() => {
    if (!conexaoSignalR) return;

    const handleEstadoAtualizado = (novoEstado) => {
      if (!novoEstado) return;
      if (novoEstado.cenarioAtual) setCenarioAtual(novoEstado.cenarioAtual);
      if (Array.isArray(novoEstado.tokens)) setTokens(novoEstado.tokens);
      if (typeof novoEstado.rodada === "number") setRodada(novoEstado.rodada);
      if (typeof novoEstado.turnoIndex === "number") setTurnoIndex(novoEstado.turnoIndex);
      if (typeof novoEstado.combateIniciado === "boolean")
        setCombateIniciado(novoEstado.combateIniciado);
      if (Array.isArray(novoEstado.logsCombate)) setLogsCombate(novoEstado.logsCombate);
    };

    const handleTokenMovido = (tokenId, novoX, novoY, movimentoRestante) => {
      setTokens((prev) =>
        prev.map((t) =>
          t.id === tokenId ? { ...t, x: novoX, y: novoY, movimentoRestante } : t
        )
      );
    };

    const handleCenarioAtualizado = (novoCenario) => {
      if (novoCenario) setCenarioAtual(novoCenario);
    };

    const handleAcaoExecutada = (payload) => {
      if (!payload) return;
      if (Array.isArray(payload.tokens)) setTokens(payload.tokens);
      if (payload.log) {
        setLogsCombate((prev) => [payload.log, ...prev.slice(0, 49)]);
      }
    };

    conexaoSignalR.on("EstadoBatalhaAtualizado", handleEstadoAtualizado);
    conexaoSignalR.on("TokenMovido", handleTokenMovido);
    conexaoSignalR.on("CenarioBatalhaAtualizado", handleCenarioAtualizado);
    conexaoSignalR.on("AcaoCombateExecutada", handleAcaoExecutada);

    return () => {
      conexaoSignalR.off("EstadoBatalhaAtualizado", handleEstadoAtualizado);
      conexaoSignalR.off("TokenMovido", handleTokenMovido);
      conexaoSignalR.off("CenarioBatalhaAtualizado", handleCenarioAtualizado);
      conexaoSignalR.off("AcaoCombateExecutada", handleAcaoExecutada);
    };
  }, [conexaoSignalR]);

  useEffect(() => {
    if (!tenantId) return;
    carregarFichasDaMesa();
    carregarCenariosSalvos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const transmitirEstadoGeral = async (override = {}) => {
    const pacote = {
      cenarioAtual: override.cenarioAtual ?? cenarioAtual,
      tokens: override.tokens ?? tokens,
      rodada: override.rodada ?? rodada,
      turnoIndex: override.turnoIndex ?? turnoIndex,
      combateIniciado: override.combateIniciado ?? combateIniciado,
      logsCombate: override.logsCombate ?? logsCombate,
    };

    try {
      localStorage.setItem(`rolemaster_batalha_${tenantId}`, JSON.stringify(pacote));
    } catch {
      // ignora
    }

    if (conexaoSignalR) {
      try {
        await conexaoSignalR.invoke("SincronizarEstadoBatalha", tenantId, pacote);
      } catch (err) {
        console.warn("Aviso ao sincronizar estado via SignalR:", err);
      }
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    try {
      const salvo = localStorage.getItem(`rolemaster_batalha_${tenantId}`);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (parsed.cenarioAtual) setCenarioAtual(parsed.cenarioAtual);
        if (Array.isArray(parsed.tokens) && parsed.tokens.length > 0) setTokens(parsed.tokens);
        if (typeof parsed.rodada === "number") setRodada(parsed.rodada);
        if (typeof parsed.turnoIndex === "number") setTurnoIndex(parsed.turnoIndex);
        if (typeof parsed.combateIniciado === "boolean") setCombateIniciado(parsed.combateIniciado);
        if (Array.isArray(parsed.logsCombate) && parsed.logsCombate.length > 0)
          setLogsCombate(parsed.logsCombate);
      }
    } catch {
      // ignora
    }
  }, [tenantId]);

  const carregarFichasDaMesa = async () => {
    setCarregandoFichas(true);
    try {
      const res = await api.get(`/characters/mesa/${tenantId}`);
      const lista = Array.isArray(res.data) ? res.data : [];
      setFichasMesa(lista);
      if (lista.length > 0 && !fichaParaSpawnId) {
        setFichaParaSpawnId(String(lista[0].id));
      }
    } catch (err) {
      console.warn("Usando fichas locais como fallback:", err);
    } finally {
      setCarregandoFichas(false);
    }
  };

  const gerarFichasPadroesNaMesa = async () => {
    setCarregandoFichas(true);
    try {
      const res = await api.post(`/characters/mesa/${tenantId}/padroes`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFichasMesa(res.data);
        setFichaParaSpawnId(String(res.data[0].id));
        adicionarLog("sistema", "📜 Fichas padrões de D&D 5e carregadas e vinculadas à mesa!");
        return;
      }
    } catch {
      const criadas = [...fichasMesa];
      for (const template of FICHAS_PADROES_LOCAIS) {
        const jaExiste = criadas.some(
          (f) => (f.nome || "").toLowerCase() === template.nome.toLowerCase()
        );
        if (!jaExiste) {
          try {
            const resp = await api.post("/characters", {
              ...template,
              mesaId: tenantId,
              status: 1,
              strMod: calcularModificador(template.forca),
              dexMod: calcularModificador(template.destreza),
              conMod: calcularModificador(template.constituicao),
              intMod: calcularModificador(template.inteligencia),
              wisMod: calcularModificador(template.sabedoria),
              chaMod: calcularModificador(template.carisma),
            });
            criadas.push({
              ...template,
              ...resp.data,
              equipamento: resp.data.equipamento?.length
                ? resp.data.equipamento
                : template.equipamento,
              magia: resp.data.magia?.length ? resp.data.magia : template.magia,
            });
          } catch {
            criadas.push({
              ...template,
              id: `padrao-${template.nome.replace(/\s+/g, "-").toLowerCase()}`,
              mesaId: tenantId,
              status: 1,
            });
          }
        }
      }
      setFichasMesa(criadas);
      if (criadas.length > 0) {
        setFichaParaSpawnId(String(criadas[0].id));
      }
      adicionarLog("sistema", "📜 Fichas padrões D&D 5e forjadas e prontas para combate!");
    } finally {
      setCarregandoFichas(false);
    }
  };

  const carregarCenariosSalvos = async () => {
    const chaveLocal = `rolemaster_cenarios_${tenantId}`;
    let locais = [];
    try {
      const bruto = localStorage.getItem(chaveLocal);
      if (bruto) locais = JSON.parse(bruto);
    } catch {
      locais = [];
    }

    try {
      const res = await api.get(`/cenarios/mesa/${tenantId}`);
      if (Array.isArray(res.data)) {
        const doBanco = res.data.map((c) => ({
          id: c.id,
          nome: c.nome,
          tema: c.tema || "masmorra",
          largura: c.largura || 14,
          altura: c.altura || 10,
          fundoUrl: c.fundoUrl || "",
          props: (() => {
            try {
              return JSON.parse(c.propsJson || "[]");
            } catch {
              return [];
            }
          })(),
        }));
        setCenariosSalvos(doBanco.length > 0 ? doBanco : locais);
        return;
      }
    } catch {
      // fallback local
    }
    setCenariosSalvos(locais);
  };

  const salvarCenarioAtual = async () => {
    const nomeFinal = (nomeNovoCenario || cenarioAtual.nome || "Cenário Customizado").trim();
    const objetoCenario = {
      ...cenarioAtual,
      id:
        cenarioAtual.id && !String(cenarioAtual.id).startsWith("preset-")
          ? cenarioAtual.id
          : `custom-${Date.now()}`,
      nome: nomeFinal,
    };

    const chaveLocal = `rolemaster_cenarios_${tenantId}`;
    const novaLista = [
      objetoCenario,
      ...cenariosSalvos.filter((c) => c.id !== objetoCenario.id),
    ];
    setCenariosSalvos(novaLista);
    setCenarioAtual(objetoCenario);
    setNomeNovoCenario("");

    try {
      localStorage.setItem(chaveLocal, JSON.stringify(novaLista));
    } catch {
      // ignora
    }

    try {
      const payloadApi = {
        mesaId: tenantId,
        nome: nomeFinal,
        tema: objetoCenario.tema,
        largura: objetoCenario.largura,
        altura: objetoCenario.altura,
        fundoUrl: objetoCenario.fundoUrl || "",
        propsJson: JSON.stringify(objetoCenario.props || []),
      };

      if (typeof objetoCenario.id === "number") {
        await api.put(`/cenarios/${objetoCenario.id}`, payloadApi);
      } else {
        const res = await api.post("/cenarios", payloadApi);
        if (res.data?.id) {
          objetoCenario.id = res.data.id;
        }
      }
    } catch {
      // mantém local
    }

    adicionarLog("sistema", `🗺️ Cenário "${nomeFinal}" salvo com sucesso!`);
    await transmitirEstadoGeral({ cenarioAtual: objetoCenario });
  };

  const aplicarCenario = async (cenarioEscolhido) => {
    const copia = {
      ...cenarioEscolhido,
      props: Array.isArray(cenarioEscolhido.props) ? [...cenarioEscolhido.props] : [],
    };
    setCenarioAtual(copia);
    adicionarLog("sistema", `🗺️ O Mestre alterou o cenário para: ${copia.nome}`);

    if (conexaoSignalR) {
      try {
        await conexaoSignalR.invoke("AtualizarCenarioBatalha", tenantId, copia);
      } catch {
        // fallback
      }
    }
    await transmitirEstadoGeral({ cenarioAtual: copia });
  };

  const adicionarLog = (tipo, texto, extras = {}) => {
    const novoLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tipo,
      texto,
      horario: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...extras,
    };
    setLogsCombate((prev) => [novoLog, ...prev.slice(0, 49)]);
    return novoLog;
  };

  const tokensVisiveis = useMemo(
    () => (isMestre ? tokens : tokens.filter((t) => !t.oculto)),
    [tokens, isMestre]
  );

  const tokenSelecionado = useMemo(
    () => tokens.find((t) => t.id === tokenSelecionadoId) || null,
    [tokens, tokenSelecionadoId]
  );

  const tokenDoTurno = useMemo(() => {
    if (!combateIniciado || tokens.length === 0) return null;
    return tokens[turnoIndex % tokens.length] || null;
  }, [combateIniciado, tokens, turnoIndex]);

  const acoesDisponiveis = useMemo(() => {
    if (!tokenSelecionado) return [];
    return obterAcoesDaFicha(tokenSelecionado.ficha);
  }, [tokenSelecionado]);

  const propNaCelula = (x, y) =>
    (cenarioAtual.props || []).find((p) => p.x === x && p.y === y) || null;

  const tokenNaCelula = (x, y) =>
    tokensVisiveis.find((t) => t.x === x && t.y === y) || null;

  const custoMovimentoParaCelula = (origemX, origemY, destX, destY) => {
    const distBase = calcularDistanciaMetros(origemX, origemY, destX, destY);
    const prop = propNaCelula(destX, destY);
    if (prop?.bloqueiaMovimento) return Infinity;
    const penalidadeTerreno = prop?.terrenoDificil ? 1.5 : 0;
    return Number((distBase + penalidadeTerreno).toFixed(1));
  };

  const spawnarPersonagemNaCelula = async (x, y) => {
    if (!isMestre) return;
    const ocupado = tokens.find((t) => t.x === x && t.y === y);
    if (ocupado) {
      setTokenSelecionadoId(ocupado.id);
      return;
    }

    const prop = propNaCelula(x, y);
    if (prop?.bloqueiaMovimento) {
      return alert("Não é possível spawnar sobre um obstáculo que bloqueia movimento!");
    }

    const fichaBase = fichasMesa.find((f) => String(f.id) === String(fichaParaSpawnId));
    if (!fichaBase) {
      setGavetaMobileAberta(true);
      setAbaLateral("spawn");
      return alert(
        "Selecione uma ficha na aba 'Fichas/Spawn' ou clique em '⚡ Gerar Fichas Padrões D&D' primeiro!"
      );
    }

    let fichaCompleta = { ...fichaBase };
    if (typeof fichaBase.id === "number" && !fichaBase.equipamento) {
      try {
        const res = await api.get(`/characters/${fichaBase.id}`);
        fichaCompleta = res.data;
      } catch {
        // usa a ficha base
      }
    }

    const qtdMesmoNome = tokens.filter((t) =>
      t.nome.startsWith(fichaCompleta.nome)
    ).length;
    const nomeExibicao =
      qtdMesmoNome > 0 ? `${fichaCompleta.nome} #${qtdMesmoNome + 1}` : fichaCompleta.nome;

    const modInit =
      fichaCompleta.iniciativa !== undefined && fichaCompleta.iniciativa !== null
        ? Number(fichaCompleta.iniciativa)
        : calcularModificador(fichaCompleta.destreza ?? 10);
    const d20Init = rolarDado(20);
    const iniciativaTotal = d20Init + modInit;

    const deslocamentoMax = Number(fichaCompleta.deslocamento) || 9;
    const hpMax = Number(fichaCompleta.pontosDeVidaMaximos) || 15;
    const hpAtual =
      fichaCompleta.pontosDeVidaAtuais !== undefined &&
      fichaCompleta.pontosDeVidaAtuais > 0
        ? Number(fichaCompleta.pontosDeVidaAtuais)
        : hpMax;

    const novoToken = {
      id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fichaId: fichaCompleta.id,
      nome: nomeExibicao,
      faccao: faccaoSpawn,
      oculto: spawnOculto,
      condicoes: [],
      icone: obterIconeFicha(fichaCompleta, faccaoSpawn),
      x,
      y,
      hpAtual,
      hpMax,
      hpTemp: Number(fichaCompleta.pontosDeVidaTemporarios || 0),
      ca: Number(fichaCompleta.classeArmadura || 12),
      iniciativa: iniciativaTotal,
      d20Iniciativa: d20Init,
      deslocamentoMax,
      movimentoRestante: deslocamentoMax,
      acaoDisponivel: true,
      acaoBonusDisponivel: true,
      esquivando: false,
      morteSucessos: Number(fichaCompleta.salvaguardaMorteSucessos || 0),
      morteFalhas: Number(fichaCompleta.salvaguardaMorteFalhas || 0),
      ficha: fichaCompleta,
    };

    const novaListaTokens = [...tokens, novoToken].sort(
      (a, b) => b.iniciativa - a.iniciativa
    );

    const logSpawn = spawnOculto
      ? logsCombate[0]
      : adicionarLog(
          "spawn",
          `🎲 ${nomeExibicao} entrou no campo de batalha em (${String.fromCharCode(65 + x)}${y + 1})! Iniciativa: ${iniciativaTotal} (1d20[${d20Init}] ${modInit >= 0 ? `+${modInit}` : modInit})`
        );

    setTokens(novaListaTokens);
    setTokenSelecionadoId(novoToken.id);
    setModoInteracao("mover");

    await transmitirEstadoGeral({
      tokens: novaListaTokens,
      logsCombate: spawnOculto ? logsCombate : [logSpawn, ...logsCombate.slice(0, 49)],
    });
  };

  const sincronizarHpNoBanco = async (tokenAtualizado) => {
    if (!tokenAtualizado?.fichaId || typeof tokenAtualizado.fichaId !== "number") return;
    if (tokenAtualizado.nome.includes("#")) return;

    try {
      await api.patch(`/characters/${tokenAtualizado.fichaId}/hp`, {
        pontosDeVidaAtuais: tokenAtualizado.hpAtual,
        pontosDeVidaTemporarios: tokenAtualizado.hpTemp || 0,
        salvaguardaMorteSucessos: tokenAtualizado.morteSucessos || 0,
        salvaguardaMorteFalhas: tokenAtualizado.morteFalhas || 0,
      });
    } catch {
      try {
        if (tokenAtualizado.ficha) {
          await api.put(`/characters/${tokenAtualizado.fichaId}`, {
            ...tokenAtualizado.ficha,
            pontosDeVidaAtuais: tokenAtualizado.hpAtual,
            pontosDeVidaTemporarios: tokenAtualizado.hpTemp || 0,
            salvaguardaMorteSucessos: tokenAtualizado.morteSucessos || 0,
            salvaguardaMorteFalhas: tokenAtualizado.morteFalhas || 0,
          });
        }
      } catch {
        // silencioso
      }
    }
  };

  const moverTokenParaCelula = async (x, y) => {
    if (!tokenSelecionado) return;
    if (!podeControlarToken(tokenSelecionado)) {
      return alert("Você só pode mover os seus próprios personagens!");
    }
    if (tokenSelecionado.hpAtual <= 0) {
      return alert("Personagens caídos (0 PV) não podem se mover!");
    }
    if ((tokenSelecionado.condicoes || []).includes("atordoado")) {
      return alert("Este personagem está Atordoado e não pode se mover!");
    }

    const custo = custoMovimentoParaCelula(
      tokenSelecionado.x,
      tokenSelecionado.y,
      x,
      y
    );

    if (custo === Infinity) return;
    if (combateIniciado && custo > tokenSelecionado.movimentoRestante) {
      return alert(
        `Deslocamento insuficiente! Custo: ${custo}m | Restante: ${tokenSelecionado.movimentoRestante}m. Use a ação 'Disparada' para dobrar o movimento.`
      );
    }

    const novoMovimento = combateIniciado
      ? Number(Math.max(0, tokenSelecionado.movimentoRestante - custo).toFixed(1))
      : tokenSelecionado.deslocamentoMax;

    const propDestino = propNaCelula(x, y);
    let danoFogo = 0;
    let textoPerigo = "";

    if (propDestino?.danoAmbiental) {
      const rolagemPerigo = rolarExpressaoDados(propDestino.danoAmbiental);
      danoFogo = rolagemPerigo.total;
      textoPerigo = ` ⚠️ Sofreu ${danoFogo} de dano ambiental (${propDestino.nome}: ${rolagemPerigo.formula}[${rolagemPerigo.dados.join(",")}])!`;
    }

    const novosTokens = tokens.map((t) => {
      if (t.id !== tokenSelecionado.id) return t;
      const novoHp = Math.max(0, t.hpAtual - danoFogo);
      return {
        ...t,
        x,
        y,
        hpAtual: novoHp,
        movimentoRestante: novoMovimento,
        ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: novoHp } : t.ficha,
      };
    });

    const coord = `${String.fromCharCode(65 + x)}${y + 1}`;
    const novoLog = adicionarLog(
      "movimento",
      `👣 ${tokenSelecionado.nome} moveu-se para ${coord} (-${custo}m)${textoPerigo}`
    );

    setTokens(novosTokens);

    if (conexaoSignalR) {
      try {
        await conexaoSignalR.invoke(
          "MoverToken",
          tenantId,
          tokenSelecionado.id,
          x,
          y,
          novoMovimento
        );
      } catch {
        // fallback
      }
    }

    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [novoLog, ...logsCombate.slice(0, 49)],
    });
  };

  const executarAcaoNoAlvo = async (alvoToken) => {
    if (!tokenSelecionado || !acaoSelecionada) return;
    if (!podeControlarToken(tokenSelecionado)) {
      return alert("Você não tem permissão para comandar este personagem!");
    }
    if (tokenSelecionado.hpAtual <= 0) {
      return alert("Este personagem está caído (0 PV) e não pode realizar ações!");
    }
    if ((tokenSelecionado.condicoes || []).includes("atordoado")) {
      return alert("Este personagem está Atordoado e não pode realizar ações!");
    }

    const distancia = calcularDistanciaMetros(
      tokenSelecionado.x,
      tokenSelecionado.y,
      alvoToken.x,
      alvoToken.y
    );

    if (distancia > acaoSelecionada.alcanceMetros) {
      return alert(
        `Alvo fora de alcance! Distância: ${distancia}m | Alcance máximo de "${acaoSelecionada.nome}": ${acaoSelecionada.alcanceMetros}m.`
      );
    }

    const consomeBonus = acaoSelecionada.custo === "bonus";
    if (combateIniciado) {
      if (consomeBonus && !tokenSelecionado.acaoBonusDisponivel) {
        return alert("Este personagem já utilizou sua Ação Bônus neste turno!");
      }
      if (!consomeBonus && !tokenSelecionado.acaoDisponivel) {
        return alert("Este personagem já utilizou sua Ação Principal neste turno!");
      }
    }

    let novosTokens = [...tokens];
    let logGerado = null;

    if (acaoSelecionada.tipo === "cura") {
      const rolagemCura = rolarExpressaoDados(acaoSelecionada.dano, false);
      const curaTotal = Math.max(1, rolagemCura.total + (acaoSelecionada.bonusDano || 0));
      const hpAnterior = alvoToken.hpAtual;
      const novoHp = Math.min(alvoToken.hpMax, hpAnterior + curaTotal);
      const curadoReal = novoHp - hpAnterior;

      novosTokens = novosTokens.map((t) => {
        let atualizado = { ...t };
        if (t.id === tokenSelecionado.id && combateIniciado) {
          atualizado = {
            ...atualizado,
            acaoDisponivel: consomeBonus ? t.acaoDisponivel : false,
            acaoBonusDisponivel: consomeBonus ? false : t.acaoBonusDisponivel,
          };
        }
        if (t.id === alvoToken.id) {
          atualizado = {
            ...atualizado,
            hpAtual: novoHp,
            morteSucessos: novoHp > 0 ? 0 : t.morteSucessos,
            morteFalhas: novoHp > 0 ? 0 : t.morteFalhas,
            ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: novoHp } : t.ficha,
          };
        }
        return atualizado;
      });

      const detalheBonus =
        acaoSelecionada.bonusDano > 0 ? ` + ${acaoSelecionada.bonusDano}` : "";
      logGerado = adicionarLog(
        "cura",
        `✨ ${tokenSelecionado.nome} usou ${acaoSelecionada.nome} em ${alvoToken.nome}: Restaurou +${curadoReal} PV (Rolagem: ${rolagemCura.formula}[${rolagemCura.dados.join(",")}]${detalheBonus} = ${curaTotal}) → PV: ${novoHp}/${alvoToken.hpMax}`
      );

      const alvoAtualizado = novosTokens.find((t) => t.id === alvoToken.id);
      void sincronizarHpNoBanco(alvoAtualizado);
    } else {
      const d1 = rolarDado(20);
      const d2 = rolarDado(20);

      const condAtacante = tokenSelecionado.condicoes || [];
      const condAlvo = alvoToken.condicoes || [];

      let temVantagem =
        modoRolagemD20 === "vantagem" ||
        condAlvo.includes("atordoado") ||
        (condAlvo.includes("caido") && acaoSelecionada.alcanceMetros <= 1.5);

      let temDesvantagem =
        modoRolagemD20 === "desvantagem" ||
        alvoToken.esquivando ||
        condAtacante.includes("envenenado");

      let modoEfetivo = "normal";
      if (temVantagem && !temDesvantagem) modoEfetivo = "vantagem";
      else if (temDesvantagem && !temVantagem) modoEfetivo = "desvantagem";

      const d20Escolhido =
        modoEfetivo === "vantagem"
          ? Math.max(d1, d2)
          : modoEfetivo === "desvantagem"
            ? Math.min(d1, d2)
            : d1;

      const bonusBencao = condAtacante.includes("abencoado") ? rolarDado(4) : 0;

      const isCritico = d20Escolhido === 20;
      const isFalhaCritica = d20Escolhido === 1;
      const bonusAtaque = Number(acaoSelecionada.bonusAtaque || 0);
      const totalAtaque = d20Escolhido + bonusAtaque + bonusBencao;
      const acertou = isCritico || (!isFalhaCritica && totalAtaque >= alvoToken.ca);

      const textoDadosD20 =
        modoEfetivo !== "normal"
          ? `2d20(${modoEfetivo.toUpperCase()})[${d1}, ${d2} → ${d20Escolhido}]`
          : `1d20[${d20Escolhido}]`;
      const strBencao = bonusBencao > 0 ? ` + 1d4(Bênção)[${bonusBencao}]` : "";

      if (acertou) {
        const rolagemDano = rolarExpressaoDados(acaoSelecionada.dano, isCritico);
        const bonusDano = Number(acaoSelecionada.bonusDano || 0);
        const danoTotal = Math.max(1, rolagemDano.total + bonusDano);
        const novoHp = Math.max(0, alvoToken.hpAtual - danoTotal);

        novosTokens = novosTokens.map((t) => {
          let atualizado = { ...t };
          if (t.id === tokenSelecionado.id && combateIniciado) {
            atualizado = {
              ...atualizado,
              acaoDisponivel: consomeBonus ? t.acaoDisponivel : false,
              acaoBonusDisponivel: consomeBonus ? false : t.acaoBonusDisponivel,
            };
          }
          if (t.id === alvoToken.id) {
            atualizado = {
              ...atualizado,
              hpAtual: novoHp,
              ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: novoHp } : t.ficha,
            };
          }
          return atualizado;
        });

        const tagCritico = isCritico ? " 🔥 ACERTO CRÍTICO (DADOS DOBRADOS)!" : " ✅ ACERTOU!";
        const tagCaido = novoHp === 0 ? ` 💀 ${alvoToken.nome} CAIU A 0 PV!` : "";
        const strBonusAtaque = bonusAtaque >= 0 ? `+ ${bonusAtaque}` : `- ${Math.abs(bonusAtaque)}`;
        const strBonusDano =
          bonusDano > 0 ? ` + ${bonusDano}` : bonusDano < 0 ? ` - ${Math.abs(bonusDano)}` : "";

        logGerado = adicionarLog(
          "ataque",
          `⚔️ ${tokenSelecionado.nome} usou "${acaoSelecionada.nome}" em ${alvoToken.nome}: ${textoDadosD20} ${strBonusAtaque}${strBencao} = ${totalAtaque} vs CA ${alvoToken.ca}${tagCritico} Causou ${danoTotal} de dano (${rolagemDano.formula}[${rolagemDano.dados.join(",")}]${strBonusDano}). PV de ${alvoToken.nome}: ${novoHp}/${alvoToken.hpMax}${tagCaido}`
        );

        const alvoAtualizado = novosTokens.find((t) => t.id === alvoToken.id);
        void sincronizarHpNoBanco(alvoAtualizado);
      } else {
        novosTokens = novosTokens.map((t) => {
          if (t.id === tokenSelecionado.id && combateIniciado) {
            return {
              ...t,
              acaoDisponivel: consomeBonus ? t.acaoDisponivel : false,
              acaoBonusDisponivel: consomeBonus ? false : t.acaoBonusDisponivel,
            };
          }
          return t;
        });

        const tagErro = isFalhaCritica ? " ❌ FALHA CRÍTICA (1 NATURAL)!" : " 🛡️ ERROU!";
        const strBonusAtaque = bonusAtaque >= 0 ? `+ ${bonusAtaque}` : `- ${Math.abs(bonusAtaque)}`;

        logGerado = adicionarLog(
          "erro",
          `🛡️ ${tokenSelecionado.nome} atacou ${alvoToken.nome} com "${acaoSelecionada.nome}": ${textoDadosD20} ${strBonusAtaque}${strBencao} = ${totalAtaque} vs CA ${alvoToken.ca}${tagErro}`
        );
      }
    }

    setTokens(novosTokens);
    setModoInteracao("mover");
    setAcaoSelecionada(null);

    if (conexaoSignalR) {
      try {
        await conexaoSignalR.invoke("ExecutarAcaoCombate", tenantId, {
          tokens: novosTokens,
          log: logGerado,
        });
      } catch {
        // fallback
      }
    }

    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: logGerado ? [logGerado, ...logsCombate.slice(0, 49)] : logsCombate,
    });
  };

  const alternarCondicaoToken = async (condId) => {
    if (!tokenSelecionado) return;
    const atuais = tokenSelecionado.condicoes || [];
    const novas = atuais.includes(condId)
      ? atuais.filter((c) => c !== condId)
      : [...atuais, condId];

    const novosTokens = tokens.map((t) =>
      t.id === tokenSelecionado.id ? { ...t, condicoes: novas } : t
    );

    const objCond = CONDICOES_DND.find((c) => c.id === condId);
    const log = adicionarLog(
      "sistema",
      `${objCond?.icone || "✨"} ${tokenSelecionado.nome} ${
        novas.includes(condId) ? "recebeu" : "removeu"
      } a condição: ${objCond?.nome || condId}`
    );

    setTokens(novosTokens);
    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const alternarVisibilidadeToken = async () => {
    if (!isMestre || !tokenSelecionado) return;
    const novoOculto = !tokenSelecionado.oculto;
    const novosTokens = tokens.map((t) =>
      t.id === tokenSelecionado.id ? { ...t, oculto: novoOculto } : t
    );

    const log = !novoOculto
      ? adicionarLog(
          "spawn",
          `👁️ EMBOSCADA! ${tokenSelecionado.nome} revelou-se das sombras!`
        )
      : logsCombate[0];

    setTokens(novosTokens);
    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: !novoOculto ? [log, ...logsCombate.slice(0, 49)] : logsCombate,
    });
  };

  const realizarDescansoCurto = async () => {
    if (!isMestre) return;
    const novosTokens = tokens.map((t) => {
      if (t.faccao !== "heroi") return t;
      const modCon = calcularModificador(t.ficha?.constituicao ?? 12);
      const cura = Math.max(1, rolarDado(8) + modCon);
      const novoHp = Math.min(t.hpMax, t.hpAtual + cura);
      const atualizado = {
        ...t,
        hpAtual: novoHp,
        ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: novoHp } : t.ficha,
      };
      void sincronizarHpNoBanco(atualizado);
      return atualizado;
    });

    const log = adicionarLog(
      "cura",
      "⛺ O grupo realizou um Descanso Curto (Dados de Vida gastos para recuperar PV)!"
    );
    setTokens(novosTokens);
    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const realizarDescansoLongo = async () => {
    if (!isMestre) return;
    try {
      await api.post(`/characters/mesa/${tenantId}/descanso-longo`);
    } catch {
      // continua localmente
    }

    const novosTokens = tokens.map((t) => {
      if (t.faccao !== "heroi") return t;
      const atualizado = {
        ...t,
        hpAtual: t.hpMax,
        hpTemp: 0,
        condicoes: [],
        esquivando: false,
        morteSucessos: 0,
        morteFalhas: 0,
        movimentoRestante: t.deslocamentoMax,
        acaoDisponivel: true,
        acaoBonusDisponivel: true,
        ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: t.hpMax } : t.ficha,
      };
      void sincronizarHpNoBanco(atualizado);
      return atualizado;
    });

    const log = adicionarLog(
      "cura",
      "🌙 O grupo realizou um Descanso Longo! Todos os heróis recuperaram 100% dos PV e removeram condições negativas."
    );
    setTokens(novosTokens);
    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const usarDisparada = async () => {
    if (!tokenSelecionado) return;
    if (!podeControlarToken(tokenSelecionado)) {
      return alert("Você só pode comandar seu próprio personagem!");
    }
    if (combateIniciado && !tokenSelecionado.acaoDisponivel) {
      return alert("Você já usou sua Ação Principal neste turno!");
    }

    const ganho = tokenSelecionado.deslocamentoMax;
    const novosTokens = tokens.map((t) =>
      t.id === tokenSelecionado.id
        ? {
            ...t,
            movimentoRestante: Number((t.movimentoRestante + ganho).toFixed(1)),
            acaoDisponivel: false,
          }
        : t
    );

    const log = adicionarLog(
      "sistema",
      `🏃 ${tokenSelecionado.nome} usou Disparada (Dash) e ganhou +${ganho}m de deslocamento neste turno!`
    );
    setTokens(novosTokens);
    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const usarEsquivar = async () => {
    if (!tokenSelecionado) return;
    if (!podeControlarToken(tokenSelecionado)) {
      return alert("Você só pode comandar seu próprio personagem!");
    }
    if (combateIniciado && !tokenSelecionado.acaoDisponivel) {
      return alert("Você já usou sua Ação Principal neste turno!");
    }

    const novosTokens = tokens.map((t) =>
      t.id === tokenSelecionado.id
        ? { ...t, esquivando: true, acaoDisponivel: false }
        : t
    );

    const log = adicionarLog(
      "sistema",
      `🛡️ ${tokenSelecionado.nome} assumiu postura de Esquiva (Dodge)! Ataques contra ele têm Desvantagem até seu próximo turno.`
    );
    setTokens(novosTokens);
    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const rolarSalvaguardaMorte = async () => {
    if (!tokenSelecionado || tokenSelecionado.hpAtual > 0) return;

    const d20 = rolarDado(20);
    let sucessos = tokenSelecionado.morteSucessos || 0;
    let falhas = tokenSelecionado.morteFalhas || 0;
    let novoHp = 0;
    let msg = "";

    if (d20 === 20) {
      novoHp = 1;
      sucessos = 0;
      falhas = 0;
      msg = `🌟 MILAGRE (20 Natural)! ${tokenSelecionado.nome} recupera a consciência com 1 PV!`;
    } else if (d20 === 1) {
      falhas = Math.min(3, falhas + 2);
      msg = `💀 Salvaguarda contra a Morte de ${tokenSelecionado.nome}: Rolou [1] → +2 Falhas (${sucessos}/3 Sucessos, ${falhas}/3 Falhas)!`;
    } else if (d20 >= 10) {
      sucessos = Math.min(3, sucessos + 1);
      msg = `🎲 Salvaguarda contra a Morte de ${tokenSelecionado.nome}: Rolou [${d20}] → Sucesso! (${sucessos}/3 Sucessos, ${falhas}/3 Falhas)${sucessos === 3 ? " ✨ ESTABILIZADO!" : ""}`;
    } else {
      falhas = Math.min(3, falhas + 1);
      msg = `🎲 Salvaguarda contra a Morte de ${tokenSelecionado.nome}: Rolou [${d20}] → Falha! (${sucessos}/3 Sucessos, ${falhas}/3 Falhas)${falhas === 3 ? " ⚰️ PERSONAGEM MORREU!" : ""}`;
    }

    const novosTokens = tokens.map((t) =>
      t.id === tokenSelecionado.id
        ? {
            ...t,
            hpAtual: novoHp,
            morteSucessos: sucessos,
            morteFalhas: falhas,
            acaoDisponivel: false,
          }
        : t
    );

    const log = adicionarLog("ataque", msg);
    setTokens(novosTokens);
    const atualizado = novosTokens.find((t) => t.id === tokenSelecionado.id);
    void sincronizarHpNoBanco(atualizado);
    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const iniciarOuReiniciarCombate = async () => {
    if (tokens.length === 0) {
      return alert("Spawne pelo menos um personagem no tabuleiro antes de iniciar o combate!");
    }

    const ordenados = [...tokens]
      .map((t) => {
        const mod =
          t.ficha?.iniciativa !== undefined
            ? Number(t.ficha.iniciativa)
            : calcularModificador(t.ficha?.destreza ?? 10);
        const d20 = rolarDado(20);
        return {
          ...t,
          d20Iniciativa: d20,
          iniciativa: d20 + mod,
          movimentoRestante: t.deslocamentoMax,
          acaoDisponivel: true,
          acaoBonusDisponivel: true,
          esquivando: false,
        };
      })
      .sort((a, b) => b.iniciativa - a.iniciativa);

    setTokens(ordenados);
    setTurnoIndex(0);
    setRodada(1);
    setCombateIniciado(true);
    setTokenSelecionadoId(ordenados[0].id);

    const log = adicionarLog(
      "sistema",
      `⚔️ COMBATE INICIADO! Rodada 1 — Vez de ${ordenados[0].nome} (Iniciativa ${ordenados[0].iniciativa}).`
    );

    await transmitirEstadoGeral({
      tokens: ordenados,
      turnoIndex: 0,
      rodada: 1,
      combateIniciado: true,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const avancarProximoTurno = async () => {
    if (tokens.length === 0) return;

    const proximoIdx = (turnoIndex + 1) % tokens.length;
    const novaRodada = proximoIdx === 0 ? rodada + 1 : rodada;
    const tokenQueVaiAgir = tokens[proximoIdx];

    const novosTokens = tokens.map((t, idx) =>
      idx === proximoIdx
        ? {
            ...t,
            movimentoRestante: t.deslocamentoMax,
            acaoDisponivel: true,
            acaoBonusDisponivel: true,
            esquivando: false,
          }
        : t
    );

    setTokens(novosTokens);
    setTurnoIndex(proximoIdx);
    setRodada(novaRodada);
    setTokenSelecionadoId(tokenQueVaiAgir.id);
    setModoInteracao("mover");
    setAcaoSelecionada(null);

    const log = adicionarLog(
      "sistema",
      `⏭️ Rodada ${novaRodada} • Turno de ${tokenQueVaiAgir.nome} (${tokenQueVaiAgir.deslocamentoMax}m de movimento restaurados).`
    );

    await transmitirEstadoGeral({
      tokens: novosTokens,
      turnoIndex: proximoIdx,
      rodada: novaRodada,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const removerToken = async (tokenId) => {
    const alvo = tokens.find((t) => t.id === tokenId);
    const filtrados = tokens.filter((t) => t.id !== tokenId);
    setTokens(filtrados);
    if (tokenSelecionadoId === tokenId) {
      setTokenSelecionadoId(filtrados[0]?.id || null);
    }
    const log = adicionarLog("sistema", `💨 ${alvo?.nome || "Token"} foi removido do tabuleiro.`);
    await transmitirEstadoGeral({
      tokens: filtrados,
      logsCombate: [log, ...logsCombate.slice(0, 49)],
    });
  };

  const handleCellClick = async (x, y) => {
    if (isMestre && abaLateral === "cenario" && modoInteracao === "prop") {
      let novosProps = [...(cenarioAtual.props || [])];
      if (modoBorrachaProp) {
        novosProps = novosProps.filter((p) => !(p.x === x && p.y === y));
      } else if (propSelecionado) {
        novosProps = novosProps.filter((p) => !(p.x === x && p.y === y));
        novosProps.push({
          id: `prop-${Date.now()}-${x}-${y}`,
          x,
          y,
          tipo: propSelecionado.tipo,
          nome: propSelecionado.nome,
          icone: propSelecionado.icone,
          bloqueiaMovimento: propSelecionado.bloqueiaMovimento,
          terrenoDificil: propSelecionado.terrenoDificil,
          danoAmbiental: propSelecionado.danoAmbiental,
        });
      }

      const novoCenario = { ...cenarioAtual, props: novosProps };
      setCenarioAtual(novoCenario);
      if (conexaoSignalR) {
        try {
          await conexaoSignalR.invoke("AtualizarCenarioBatalha", tenantId, novoCenario);
        } catch {
          // fallback
        }
      }
      await transmitirEstadoGeral({ cenarioAtual: novoCenario });
      return;
    }

    if (isMestre && modoInteracao === "spawn") {
      await spawnarPersonagemNaCelula(x, y);
      return;
    }

    const tokenNoLocal = tokenNaCelula(x, y);

    if (modoInteracao === "acao" && acaoSelecionada) {
      if (tokenNoLocal) {
        await executarAcaoNoAlvo(tokenNoLocal);
      } else {
        setModoInteracao("mover");
        setAcaoSelecionada(null);
      }
      return;
    }

    if (tokenNoLocal) {
      setTokenSelecionadoId(tokenNoLocal.id);
      setModoInteracao("mover");
      setAcaoSelecionada(null);
      return;
    }

    if (tokenSelecionado && modoInteracao === "mover") {
      await moverTokenParaCelula(x, y);
    }
  };

  const selecionarAbaMobile = (novaAba) => {
    if (novaAba === "mapa") {
      setGavetaMobileAberta(false);
      return;
    }
    setAbaLateral(novaAba);
    setGavetaMobileAberta(true);
    if (novaAba === "spawn" && isMestre) setModoInteracao("spawn");
    else if (novaAba === "cenario" && isMestre) setModoInteracao("prop");
    else if (novaAba === "combate") setModoInteracao("mover");
  };

  const temaVisual = TEMAS_TABULEIRO[cenarioAtual.tema] || TEMAS_TABULEIRO.masmorra;

  return (
    <div className="w-screen h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none z-40">
      <FichaModal
        isOpen={fichaModalAberta}
        onClose={() => setFichaModalAberta(false)}
        fichaId={fichaModalDados.id}
        fichaObjeto={fichaModalDados.objeto}
      />

      {/* BARRA SUPERIOR RESPONSIVA (DESKTOP & MOBILE) */}
      <header className="bg-zinc-900/95 border-b border-zinc-800 px-2.5 sm:px-4 py-2 flex flex-col gap-2 shrink-0 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onVoltarStorytelling}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 transition-colors shrink-0"
            >
              📖 <span className="hidden sm:inline">Modo Storytelling</span>
              <span className="sm:hidden">Narrativa</span>
            </button>

            <div className="border-l border-zinc-800 pl-2 min-w-0">
              <span className="text-red-500 font-extrabold uppercase tracking-wider text-xs sm:text-sm truncate block">
                ⚔️ {cenarioAtual.nome}
              </span>
            </div>
          </div>

          {/* Controles de Zoom do Grid + Turno/Iniciativa */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Controle de Zoom amigável para Mobile */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => setTamanhoCelula((prev) => Math.max(28, prev - 6))}
                className="px-2 py-1 text-xs font-bold text-zinc-400 hover:text-white"
                title="Diminuir Zoom do Tabuleiro"
              >
                −
              </button>
              <span className="text-[10px] font-mono text-zinc-500 px-1 hidden sm:inline">
                Zoom
              </span>
              <button
                onClick={() => setTamanhoCelula((prev) => Math.min(72, prev + 6))}
                className="px-2 py-1 text-xs font-bold text-zinc-400 hover:text-white"
                title="Aumentar Zoom do Tabuleiro"
              >
                +
              </button>
            </div>

            {isMestre && (
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  onClick={realizarDescansoCurto}
                  title="Recuperar PV com Dados de Vida"
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                >
                  ⛺ Curto
                </button>
                <button
                  onClick={realizarDescansoLongo}
                  title="Restaurar 100% dos PV e limpar condições"
                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                >
                  🌙 Longo
                </button>
              </div>
            )}

            {combateIniciado && (
              <div className="bg-red-950/60 border border-red-800/70 px-2 py-1 rounded-lg text-[11px] font-bold text-red-300">
                R{rodada}
              </div>
            )}

            {isMestre && (
              <button
                onClick={iniciarOuReiniciarCombate}
                className="bg-amber-700 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow"
              >
                🎲 <span className="hidden sm:inline">{combateIniciado ? "Rerrolar" : "Iniciativa"}</span>
              </button>
            )}

            {combateIniciado && (
              <button
                onClick={avancarProximoTurno}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow"
              >
                Turno ⏭️
              </button>
            )}
          </div>
        </div>

        {/* BARRA HORIZONTAL DESLIZÁVEL DE INICIATIVA (OTIMIZADA PARA TOQUE) */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
          {tokensVisiveis.length === 0 ? (
            <span className="text-[11px] text-zinc-500 italic">
              Nenhum combatente no grid — use a aba &quot;Fichas/Spawn&quot; para posicionar heróis e monstros!
            </span>
          ) : (
            tokensVisiveis.map((t) => {
              const isVez = combateIniciado && tokenDoTurno?.id === t.id;
              const isSel = t.id === tokenSelecionadoId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTokenSelecionadoId(t.id);
                    setModoInteracao("mover");
                    setAcaoSelecionada(null);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all shrink-0 ${
                    isVez
                      ? "bg-amber-950/90 border-amber-400 text-amber-200 ring-2 ring-amber-500/40 font-bold"
                      : isSel
                        ? "bg-zinc-800 border-zinc-400 text-white"
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400"
                  } ${t.hpAtual <= 0 ? "opacity-50 line-through" : ""} ${
                    t.oculto ? "border-dashed border-purple-500 opacity-75" : ""
                  }`}
                >
                  <span>{t.icone}</span>
                  <span className="max-w-[80px] truncate">{t.nome}</span>
                  {t.oculto && <span>👻</span>}
                  <span className="text-[10px] font-mono bg-black/50 px-1 rounded text-amber-400">
                    🎲{t.iniciativa}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      t.hpAtual <= t.hpMax * 0.3 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {t.hpAtual}PV
                  </span>
                </button>
              );
            })
          )}
        </div>
      </header>

      {/* CORPO PRINCIPAL: TABULEIRO + LATERAL (DESKTOP) OU GAVETA DESLIZANTE (MOBILE) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ÁREA DO GRID QUADRICULADO COM PAN/SCROLL SUAVE */}
        <div className="flex-1 relative bg-zinc-950 flex flex-col overflow-hidden">
          {/* BANNER DE INSTRUÇÃO DO MODO ATIVO */}
          <div className="mx-2 mt-2 flex items-center justify-between gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs shadow-md shrink-0">
            {modoInteracao === "spawn" && (
              <span className="text-emerald-400 font-bold truncate">
                📍 Toque em qualquer quadrado livre do grid para spawnar o personagem!
              </span>
            )}
            {modoInteracao === "prop" && abaLateral === "cenario" && (
              <span className="text-amber-400 font-bold truncate">
                🗺️ Toque nos quadrados para{" "}
                {modoBorrachaProp
                  ? "remover props (Borracha)"
                  : `posicionar ${propSelecionado?.icone} ${propSelecionado?.nome}`}
              </span>
            )}
            {modoInteracao === "acao" && acaoSelecionada && (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-red-400 font-bold truncate">
                  🎯 Alvo de {acaoSelecionada.icone} {acaoSelecionada.nome} ({acaoSelecionada.alcanceMetros}m): Toque no alvo!
                </span>
                <button
                  onClick={() => {
                    setModoInteracao("mover");
                    setAcaoSelecionada(null);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-0.5 rounded text-[11px] shrink-0"
                >
                  Cancelar
                </button>
              </div>
            )}
            {modoInteracao === "mover" && (
              <span className="text-zinc-300 truncate">
                {tokenSelecionado
                  ? `${tokenSelecionado.icone} ${tokenSelecionado.nome} (${tokenSelecionado.movimentoRestante}m livres) — Toque num quadrado azul para mover.`
                  : "Toque em um personagem no grid para selecioná-lo."}
              </span>
            )}
          </div>

          {/* VIEWPORT ROLÁVEL DO MAPA (PERMITE ARRASTAR NO CELULAR) */}
          <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-start lg:items-center justify-start lg:justify-center custom-scrollbar">
            <div
              className={`relative rounded-xl border-2 border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden shrink-0 ${temaVisual.bgGrid}`}
              style={{
                backgroundImage: cenarioAtual.fundoUrl
                  ? `url(${cenarioAtual.fundoUrl})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {cenarioAtual.fundoUrl && (
                <div className="absolute inset-0 bg-black/35 pointer-events-none" />
              )}

              <div
                className="grid relative z-10"
                style={{
                  gridTemplateColumns: `repeat(${cenarioAtual.largura}, ${tamanhoCelula}px)`,
                  gridTemplateRows: `repeat(${cenarioAtual.altura}, ${tamanhoCelula}px)`,
                }}
              >
                {Array.from({ length: cenarioAtual.altura }).map((_, y) =>
                  Array.from({ length: cenarioAtual.largura }).map((__, x) => {
                    const prop = propNaCelula(x, y);
                    const tok = tokenNaCelula(x, y);
                    const isTokenSel = tok && tok.id === tokenSelecionadoId;
                    const isTokenVez =
                      tok && tokenDoTurno && tok.id === tokenDoTurno.id;

                    let alcançavelMovimento = false;
                    let custoCelula = 0;
                    if (
                      modoInteracao === "mover" &&
                      tokenSelecionado &&
                      podeControlarToken(tokenSelecionado) &&
                      !tok &&
                      tokenSelecionado.hpAtual > 0
                    ) {
                      custoCelula = custoMovimentoParaCelula(
                        tokenSelecionado.x,
                        tokenSelecionado.y,
                        x,
                        y
                      );
                      const limiteMov = combateIniciado
                        ? tokenSelecionado.movimentoRestante
                        : tokenSelecionado.deslocamentoMax;
                      alcançavelMovimento =
                        custoCelula > 0 && custoCelula <= limiteMov;
                    }

                    let dentroAlcanceAcao = false;
                    if (
                      modoInteracao === "acao" &&
                      acaoSelecionada &&
                      tokenSelecionado
                    ) {
                      const dist = calcularDistanciaMetros(
                        tokenSelecionado.x,
                        tokenSelecionado.y,
                        x,
                        y
                      );
                      dentroAlcanceAcao = dist <= acaoSelecionada.alcanceMetros;
                    }

                    const coordLabel = `${String.fromCharCode(65 + x)}${y + 1}`;
                    const catalogoProp = prop
                      ? PROPS_CATALOGO.find((p) => p.tipo === prop.tipo)
                      : null;

                    return (
                      <div
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        className={`relative border ${temaVisual.borderColor} flex items-center justify-center cursor-pointer transition-all ${
                          alcançavelMovimento
                            ? "bg-sky-500/20 hover:bg-sky-400/35 border-sky-400/50"
                            : dentroAlcanceAcao
                              ? acaoSelecionada?.tipo === "cura"
                                ? "bg-emerald-500/25 hover:bg-emerald-400/40 border-emerald-400/60"
                                : "bg-red-500/25 hover:bg-red-500/40 border-red-400/60"
                              : temaVisual.cellBg
                        }`}
                      >
                        <span className="absolute top-0.5 left-0.5 text-[7px] text-zinc-500/60 font-mono pointer-events-none">
                          {coordLabel}
                        </span>

                        {alcançavelMovimento && tamanhoCelula >= 38 && (
                          <span className="absolute bottom-0.5 right-0.5 text-[7px] text-sky-300/80 font-mono pointer-events-none">
                            {custoCelula}m
                          </span>
                        )}

                        {prop && (
                          <div
                            className={`w-4/5 h-4/5 rounded-md border flex items-center justify-center text-base shadow-inner ${
                              catalogoProp?.cor || "bg-stone-800 border-stone-600"
                            }`}
                          >
                            <span>{prop.icone}</span>
                          </div>
                        )}

                        {tok && (
                          <div
                            className={`relative z-20 w-[86%] h-[86%] rounded-full flex flex-col items-center justify-center shadow-lg transition-transform ${
                              tok.faccao === "inimigo"
                                ? "bg-red-950 border-2 border-red-500 text-red-100"
                                : tok.faccao === "neutro"
                                  ? "bg-amber-950 border-2 border-amber-400 text-amber-100"
                                  : "bg-emerald-950 border-2 border-emerald-400 text-emerald-100"
                            } ${
                              isTokenSel
                                ? "scale-110 ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                                : ""
                            } ${
                              isTokenVez ? "ring-4 ring-amber-400/80" : ""
                            } ${tok.hpAtual <= 0 ? "grayscale opacity-60" : ""} ${
                              tok.oculto ? "opacity-60 border-dashed" : ""
                            }`}
                          >
                            <span className="text-sm sm:text-base leading-none">
                              {tok.hpAtual <= 0 ? "💀" : tok.icone}
                            </span>
                            {tamanhoCelula >= 38 && (
                              <span className="text-[7px] font-bold max-w-[34px] truncate leading-tight">
                                {tok.nome.split(" ")[0]}
                              </span>
                            )}

                            <div className="absolute -top-1 w-4/5 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700">
                              <div
                                className={`h-full transition-all ${
                                  tok.hpAtual <= tok.hpMax * 0.3
                                    ? "bg-red-500"
                                    : tok.hpAtual <= tok.hpMax * 0.6
                                      ? "bg-amber-400"
                                      : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, (tok.hpAtual / tok.hpMax) * 100)
                                  )}%`,
                                }}
                              />
                            </div>

                            <div className="absolute -bottom-1 flex items-center gap-0.5">
                              {tok.esquivando && (
                                <span className="text-[8px] bg-sky-900 border border-sky-400 rounded-full px-0.5">
                                  🛡️
                                </span>
                              )}
                              {tok.oculto && (
                                <span className="text-[8px] bg-purple-900 border border-purple-400 rounded-full px-0.5">
                                  👻
                                </span>
                              )}
                              {(tok.condicoes || []).slice(0, 2).map((cid) => {
                                const cObj = CONDICOES_DND.find((c) => c.id === cid);
                                return cObj ? (
                                  <span
                                    key={cid}
                                    className="text-[8px] bg-zinc-900 border border-zinc-600 rounded-full px-0.5"
                                  >
                                    {cObj.icone}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL TÁTICO LATERAL (NO DESKTOP SEMPRE VISÍVEL; NO MOBILE É UMA GAVETA DESLIZANTE) */}
        <aside
          className={`bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col shrink-0 transition-all z-30 ${
            gavetaMobileAberta
              ? "fixed inset-x-0 bottom-12 max-h-[65dvh] rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.9)] lg:static lg:max-h-none lg:rounded-none lg:w-96"
              : "hidden lg:flex lg:w-96"
          }`}
        >
          {/* Cabeçalho da Gaveta no Mobile */}
          <div className="flex lg:hidden items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950 rounded-t-2xl">
            <span className="text-xs font-bold uppercase text-amber-400">
              {abaLateral === "combate" && "⚔️ Ações do Personagem"}
              {abaLateral === "spawn" && "🧙‍♂️ Fichas & Spawn"}
              {abaLateral === "cenario" && "🗺️ Editor de Cenário"}
              {abaLateral === "logs" && "🎲 Registro de Combate"}
            </span>
            <button
              onClick={() => setGavetaMobileAberta(false)}
              className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-1 bg-zinc-800 rounded"
            >
              ▼ Fechar Painel
            </button>
          </div>

          {/* Abas visíveis no Desktop */}
          <div className="hidden lg:grid grid-cols-3 border-b border-zinc-800 bg-zinc-950/60">
            <button
              onClick={() => {
                setAbaLateral("combate");
                setModoInteracao("mover");
              }}
              className={`py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                abaLateral === "combate"
                  ? "border-red-500 text-red-400 bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              ⚔️ Ações
            </button>
            <button
              onClick={() => {
                setAbaLateral("spawn");
                if (isMestre) setModoInteracao("spawn");
              }}
              className={`py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                abaLateral === "spawn"
                  ? "border-emerald-500 text-emerald-400 bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🧙‍♂️ Fichas/Spawn
            </button>
            <button
              onClick={() => {
                setAbaLateral("cenario");
                if (isMestre) setModoInteracao("prop");
              }}
              className={`py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                abaLateral === "cenario"
                  ? "border-amber-500 text-amber-400 bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🗺️ Cenários
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-scrollbar">
            {abaLateral === "combate" && (
              <>
                {!tokenSelecionado ? (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-center space-y-3">
                    <p className="text-zinc-400 text-sm">
                      Nenhum combatente selecionado no tabuleiro.
                    </p>
                    {isMestre && (
                      <button
                        onClick={() => {
                          setAbaLateral("spawn");
                          setModoInteracao("spawn");
                        }}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        + Spawnar Personagens da Ficha
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{tokenSelecionado.icone}</span>
                            <h3 className="font-bold text-white text-base leading-tight">
                              {tokenSelecionado.nome}
                            </h3>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {tokenSelecionado.ficha?.raca || "Aventureiro"} •{" "}
                            {tokenSelecionado.ficha?.classe || "Combatente"} (Nv{" "}
                            {tokenSelecionado.ficha?.nivel || 1})
                          </p>
                        </div>

                        <div className="flex gap-1">
                          {isMestre && (
                            <button
                              onClick={alternarVisibilidadeToken}
                              className={`px-2 py-1 rounded text-[11px] border ${
                                tokenSelecionado.oculto
                                  ? "bg-purple-900 border-purple-400 text-purple-100"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-300"
                              }`}
                            >
                              {tokenSelecionado.oculto ? "👁️ Revelar" : "👻"}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setFichaModalDados({
                                id:
                                  typeof tokenSelecionado.fichaId === "number"
                                    ? tokenSelecionado.fichaId
                                    : null,
                                objeto: tokenSelecionado.ficha,
                              });
                              setFichaModalAberta(true);
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded text-[11px] font-semibold border border-zinc-700"
                          >
                            📜 Ficha
                          </button>
                          {isMestre && (
                            <button
                              onClick={() => removerToken(tokenSelecionado.id)}
                              className="bg-red-950/60 hover:bg-red-900 text-red-300 px-2 py-1 rounded text-[11px] border border-red-800/60"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
                          <span className="block text-[9px] text-zinc-500 uppercase">
                            PV
                          </span>
                          <span className="text-sm font-bold text-emerald-400">
                            {tokenSelecionado.hpAtual}/{tokenSelecionado.hpMax}
                          </span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
                          <span className="block text-[9px] text-zinc-500 uppercase">
                            CA
                          </span>
                          <span className="text-sm font-bold text-white">
                            🛡️ {tokenSelecionado.ca}
                          </span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
                          <span className="block text-[9px] text-zinc-500 uppercase">
                            Movimento
                          </span>
                          <span className="text-sm font-bold text-sky-400">
                            {tokenSelecionado.movimentoRestante}m
                          </span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
                          <span className="block text-[9px] text-zinc-500 uppercase">
                            Iniciativa
                          </span>
                          <span className="text-sm font-bold text-amber-400">
                            🎲 {tokenSelecionado.iniciativa}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] text-zinc-500 uppercase font-bold mb-1">
                          Condições de Status D&D 5e:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {CONDICOES_DND.map((c) => {
                            const ativa = (
                              tokenSelecionado.condicoes || []
                            ).includes(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => void alternarCondicaoToken(c.id)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                                  ativa
                                    ? "bg-purple-900/80 border-purple-400 text-white"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                                }`}
                              >
                                {c.icone} {c.nome}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {!podeControlarToken(tokenSelecionado) ? (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center text-xs text-zinc-400">
                        🔒 Este combatente é controlado pelo Mestre ou por outro jogador.
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1.5">
                            Modo de Rolagem (1d20)
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                            {[
                              { id: "desvantagem", label: "Desvantagem" },
                              { id: "normal", label: "Normal" },
                              { id: "vantagem", label: "Vantagem" },
                            ].map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setModoRolagemD20(m.id)}
                                className={`py-1.5 rounded text-[11px] font-bold transition-colors ${
                                  modoRolagemD20 === m.id
                                    ? m.id === "vantagem"
                                      ? "bg-emerald-700 text-white"
                                      : m.id === "desvantagem"
                                        ? "bg-red-800 text-white"
                                        : "bg-zinc-700 text-white"
                                    : "text-zinc-400"
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {tokenSelecionado.hpAtual <= 0 ? (
                          <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-center space-y-3">
                            <h4 className="text-red-400 font-bold text-sm uppercase">
                              💀 Personagem Caído (0 PV)
                            </h4>
                            <p className="text-xs text-zinc-300">
                              Sucessos: {tokenSelecionado.morteSucessos || 0}/3 • Falhas:{" "}
                              {tokenSelecionado.morteFalhas || 0}/3
                            </p>
                            <button
                              onClick={rolarSalvaguardaMorte}
                              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg text-xs shadow"
                            >
                              🎲 Rolar Salvaguarda Contra a Morte (1d20)
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-bold uppercase text-zinc-400">
                                ⚔️ Ataques, Magias & Curas (Toque e depois escolha o Alvo no Mapa)
                              </h4>
                              {acoesDisponiveis.map((acao) => {
                                const ativa = acaoSelecionada?.id === acao.id;
                                return (
                                  <button
                                    key={acao.id}
                                    onClick={() => {
                                      if (ativa) {
                                        setAcaoSelecionada(null);
                                        setModoInteracao("mover");
                                      } else {
                                        setAcaoSelecionada(acao);
                                        setModoInteracao("acao");
                                        setGavetaMobileAberta(false);
                                      }
                                    }}
                                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                      ativa
                                        ? acao.tipo === "cura"
                                          ? "bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/30"
                                          : "bg-red-950/80 border-red-400 ring-2 ring-red-500/30"
                                        : "bg-zinc-950/90 hover:bg-zinc-800/80 border-zinc-800"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span>{acao.icone}</span>
                                        <span className="font-bold text-xs text-white truncate">
                                          {acao.nome}
                                        </span>
                                        <span className="text-[10px] px-1.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                                          {acao.alcanceMetros}m
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                        {acao.descricao}
                                      </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                      {acao.tipo === "ataque" ? (
                                        <>
                                          <span className="block text-[10px] text-amber-400 font-mono font-bold">
                                            Acerto{" "}
                                            {acao.bonusAtaque >= 0
                                              ? `+${acao.bonusAtaque}`
                                              : acao.bonusAtaque}
                                          </span>
                                          <span className="block text-xs text-red-400 font-mono font-bold">
                                            {acao.dano}
                                            {acao.bonusDano > 0
                                              ? `+${acao.bonusDano}`
                                              : acao.bonusDano < 0
                                                ? acao.bonusDano
                                                : ""}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="block text-xs text-emerald-400 font-mono font-bold">
                                          +{acao.dano}
                                          {acao.bonusDano > 0 ? `+${acao.bonusDano}` : ""} PV
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="pt-2 border-t border-zinc-800">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={usarDisparada}
                                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-sky-300 py-2 px-3 rounded-lg text-xs font-bold"
                                >
                                  🏃 Disparada (+Mov)
                                </button>
                                <button
                                  onClick={usarEsquivar}
                                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-300 py-2 px-3 rounded-lg text-xs font-bold"
                                >
                                  🛡️ Esquivar (Dodge)
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {abaLateral === "spawn" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-emerald-400">
                    🧙‍♂️ Fichas ({fichasMesa.length})
                  </h4>
                  <button
                    onClick={gerarFichasPadroesNaMesa}
                    disabled={carregandoFichas}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow"
                  >
                    {carregandoFichas ? "Gerando..." : "⚡ Fichas Padrões D&D"}
                  </button>
                </div>

                {isMestre && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "heroi", label: "🛡️ Herói", cor: "bg-emerald-700" },
                        { id: "inimigo", label: "👹 Inimigo", cor: "bg-red-700" },
                        { id: "neutro", label: "⚜️ NPC", cor: "bg-amber-700" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFaccaoSpawn(f.id)}
                          className={`py-1.5 rounded text-xs font-bold ${
                            faccaoSpawn === f.id
                              ? `${f.cor} text-white`
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-2 text-xs text-purple-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={spawnOculto}
                        onChange={(e) => setSpawnOculto(e.target.checked)}
                        className="accent-purple-500"
                      />
                      👻 Spawnar Oculto dos Jogadores (Emboscada)
                    </label>
                  </div>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {fichasMesa.map((f) => {
                    const selecionada = String(f.id) === String(fichaParaSpawnId);
                    const isMonstro =
                      (f.classe || "").toLowerCase().includes("inimigo") ||
                      (f.classe || "").toLowerCase().includes("chefe") ||
                      (f.antecedente || "").toLowerCase().includes("monstro");
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          setFichaParaSpawnId(String(f.id));
                          setFaccaoSpawn(isMonstro ? "inimigo" : "heroi");
                          if (isMestre) {
                            setModoInteracao("spawn");
                            setGavetaMobileAberta(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selecionada
                            ? "bg-emerald-950/60 border-emerald-500 text-white"
                            : "bg-zinc-950 border-zinc-800 text-zinc-300"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span>
                              {obterIconeFicha(f, isMonstro ? "inimigo" : "heroi")}
                            </span>
                            <span className="font-bold text-xs truncate">
                              {f.nome}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block">
                            {f.raca} • {f.classe} (PV {f.pontosDeVidaMaximos} | CA{" "}
                            {f.classeArmadura})
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFichaModalDados({
                              id: typeof f.id === "number" ? f.id : null,
                              objeto: f,
                            });
                            setFichaModalAberta(true);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-[10px]"
                        >
                          📜 Ver
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {abaLateral === "cenario" && (
              <div className="space-y-4">
                {!isMestre ? (
                  <p className="text-xs text-zinc-400 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    Apenas o Mestre pode editar os props e alternar cenários durante a batalha.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 md:hidden">
                      <button
                        onClick={realizarDescansoCurto}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 py-2 rounded-lg text-xs font-bold"
                      >
                        ⛺ Descanso Curto
                      </button>
                      <button
                        onClick={realizarDescansoLongo}
                        className="bg-indigo-950 border border-indigo-700 text-indigo-200 py-2 rounded-lg text-xs font-bold"
                      >
                        🌙 Descanso Longo
                      </button>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                      <h4 className="text-[11px] font-bold uppercase text-amber-400">
                        🗺️ Trocar Cenário Instantaneamente
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {[...CENARIOS_PADROES, ...cenariosSalvos].map((cen) => (
                          <button
                            key={cen.id}
                            onClick={() => aplicarCenario(cen)}
                            className={`text-left px-2.5 py-1.5 rounded-lg border text-xs flex justify-between items-center ${
                              cenarioAtual.nome === cen.nome
                                ? "bg-amber-950/70 border-amber-500 text-amber-200 font-bold"
                                : "bg-zinc-900 border-zinc-800 text-zinc-300"
                            }`}
                          >
                            <span className="truncate">{cen.nome}</span>
                            <span className="text-[10px] text-zinc-500 uppercase">
                              {cen.tema}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-bold uppercase text-zinc-400">
                          🧱 Adicionar Props no Cenário
                        </h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setModoInteracao("prop");
                              setModoBorrachaProp(!modoBorrachaProp);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              modoBorrachaProp
                                ? "bg-red-700 border-red-400 text-white"
                                : "bg-zinc-900 border-zinc-700 text-zinc-400"
                            }`}
                          >
                            🧹 Borracha
                          </button>
                          <button
                            onClick={() => {
                              const limpo = { ...cenarioAtual, props: [] };
                              setCenarioAtual(limpo);
                              void transmitirEstadoGeral({ cenarioAtual: limpo });
                            }}
                            className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                        {PROPS_CATALOGO.map((p) => {
                          const ativo =
                            !modoBorrachaProp && propSelecionado?.tipo === p.tipo;
                          return (
                            <button
                              key={p.tipo}
                              onClick={() => {
                                setPropSelecionado(p);
                                setModoBorrachaProp(false);
                                setModoInteracao("prop");
                              }}
                              className={`p-2 rounded-lg border text-left flex items-center gap-2 ${
                                ativo
                                  ? "bg-amber-950/70 border-amber-400 text-white"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-300"
                              }`}
                            >
                              <span className="text-base">{p.icone}</span>
                              <span className="text-[11px] font-bold truncate">
                                {p.nome}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                      <input
                        type="text"
                        value={nomeNovoCenario}
                        onChange={(e) => setNomeNovoCenario(e.target.value)}
                        placeholder={`Salvar como (ex: ${cenarioAtual.nome})`}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <button
                        onClick={salvarCenarioAtual}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs"
                      >
                        💾 Salvar Cenário Atual
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ABA DE LOGS NO MOBILE */}
            {abaLateral === "logs" && (
              <div className="space-y-2 font-mono text-xs">
                {logsCombate.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border ${
                      log.tipo === "ataque"
                        ? "bg-red-950/30 border-red-900/50 text-red-200"
                        : log.tipo === "cura"
                          ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-200"
                          : "bg-zinc-950 border-zinc-800 text-amber-200/90"
                    }`}
                  >
                    {log.horario && (
                      <span className="text-[9px] text-zinc-500 mr-1.5">
                        [{log.horario}]
                      </span>
                    )}
                    <span>{log.texto}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REGISTRO DE COMBATE FIXO NO RODAPÉ DO DESKTOP */}
          <div className="hidden lg:flex h-52 border-t border-zinc-800 bg-zinc-950 flex-col">
            <div className="px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                🎲 Registro de Combate D&D
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 font-mono text-[11px] custom-scrollbar">
              {logsCombate.map((log) => (
                <div
                  key={log.id}
                  className={`p-1.5 rounded border ${
                    log.tipo === "ataque"
                      ? "bg-red-950/30 border-red-900/50 text-red-200"
                      : log.tipo === "cura"
                        ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-200"
                        : log.tipo === "erro"
                          ? "bg-zinc-900 border-zinc-800 text-zinc-400"
                          : "bg-zinc-900/60 border-zinc-800/80 text-amber-200/90"
                  }`}
                >
                  {log.horario && (
                    <span className="text-[9px] text-zinc-500 mr-1.5">
                      [{log.horario}]
                    </span>
                  )}
                  <span>{log.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* BARRA DE NAVEGAÇÃO INFERIOR EXCLUSIVA PARA MOBILE */}
        <nav className="grid lg:hidden grid-cols-5 bg-zinc-900 border-t border-zinc-800 h-12 shrink-0 z-40">
          <button
            onClick={() => selecionarAbaMobile("mapa")}
            className={`flex flex-col items-center justify-center text-[10px] font-bold ${
              !gavetaMobileAberta ? "text-red-400 bg-zinc-950" : "text-zinc-400"
            }`}
          >
            <span>🗺️</span>
            <span>Mapa</span>
          </button>
          <button
            onClick={() => selecionarAbaMobile("combate")}
            className={`flex flex-col items-center justify-center text-[10px] font-bold ${
              gavetaMobileAberta && abaLateral === "combate"
                ? "text-red-400 bg-zinc-950"
                : "text-zinc-400"
            }`}
          >
            <span>⚔️</span>
            <span>Ações</span>
          </button>
          <button
            onClick={() => selecionarAbaMobile("spawn")}
            className={`flex flex-col items-center justify-center text-[10px] font-bold ${
              gavetaMobileAberta && abaLateral === "spawn"
                ? "text-emerald-400 bg-zinc-950"
                : "text-zinc-400"
            }`}
          >
            <span>🧙‍♂️</span>
            <span>Spawn</span>
          </button>
          <button
            onClick={() => selecionarAbaMobile("cenario")}
            className={`flex flex-col items-center justify-center text-[10px] font-bold ${
              gavetaMobileAberta && abaLateral === "cenario"
                ? "text-amber-400 bg-zinc-950"
                : "text-zinc-400"
            }`}
          >
            <span>🧱</span>
            <span>Cenário</span>
          </button>
          <button
            onClick={() => selecionarAbaMobile("logs")}
            className={`flex flex-col items-center justify-center text-[10px] font-bold ${
              gavetaMobileAberta && abaLateral === "logs"
                ? "text-purple-400 bg-zinc-950"
                : "text-zinc-400"
            }`}
          >
            <span>🎲</span>
            <span>Log</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
