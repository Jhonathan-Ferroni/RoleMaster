import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import { FichaModal } from "../pages/FichaModel";
import {
  METROS_POR_QUADRADO,
  calcularDistanciaMetros,
  calcularModificador,
  formatarModificador,
  rolarDado,
  rolarExpressaoDados,
  obterAcoesDaFicha,
  PROPS_CATALOGO,
  TEMAS_TABULEIRO,
  CENARIOS_PADROES,
  FICHAS_PADROES_LOCAIS,
} from "../data/dndPresets";

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

  // === ESTADO DE COMBATE (TOKENS, INICIATIVA, RODADA, LOGS) ===
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

  // === INTERAÇÃO E SELEÇÃO NO GRID ===
  const [tokenSelecionadoId, setTokenSelecionadoId] = useState(null);
  const [modoInteracao, setModoInteracao] = useState("mover"); // 'mover' | 'acao' | 'spawn' | 'prop'
  const [acaoSelecionada, setAcaoSelecionada] = useState(null);
  const [modoRolagemD20, setModoRolagemD20] = useState("normal"); // 'normal' | 'vantagem' | 'desvantagem'

  // === CONTROLES DE SPAWN E EDITOR DE CENÁRIO (MESTRE) ===
  const [abaLateral, setAbaLateral] = useState("combate"); // 'combate' | 'spawn' | 'cenario'
  const [fichaParaSpawnId, setFichaParaSpawnId] = useState("");
  const [faccaoSpawn, setFaccaoSpawn] = useState("heroi"); // 'heroi' | 'inimigo' | 'neutro'
  const [propSelecionado, setPropSelecionado] = useState(PROPS_CATALOGO[0]);
  const [modoBorrachaProp, setModoBorrachaProp] = useState(false);
  const [nomeNovoCenario, setNomeNovoCenario] = useState("");

  // === MODAL DE VISUALIZAÇÃO DE FICHA ===
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaModalDados, setFichaModalDados] = useState({ id: null, objeto: null });

  // Sincroniza quando recebe estado completo via SignalR (de outro jogador ou do Mestre)
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

  // Ouvintes em tempo real do SignalR específicos do Tabuleiro
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

  // Carrega fichas da mesa e cenários salvos ao iniciar
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
      // ignora erro de quota
    }

    if (conexaoSignalR) {
      try {
        await conexaoSignalR.invoke("SincronizarEstadoBatalha", tenantId, pacote);
      } catch (err) {
        console.warn("Aviso ao sincronizar estado via SignalR:", err);
      }
    }
  };

  // Recupera estado salvo da sessão caso exista
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
      // Tenta primeiro a rota dedicada de templates padrões no backend
      const res = await api.post(`/characters/mesa/${tenantId}/padroes`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFichasMesa(res.data);
        setFichaParaSpawnId(String(res.data[0].id));
        adicionarLog("sistema", "📜 Fichas padrões de D&D 5e carregadas e vinculadas à mesa!");
        return;
      }
    } catch {
      // Fallback caso o backend em nuvem ainda não tenha o endpoint /padroes: cria via POST /characters ou mescla localmente
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
      // Usa cenários salvos localmente se a rota não estiver ativa no Render
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

    // Salva localmente para garantia imediata
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

    // Tenta persistir também na API .NET
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
      // Mantém versão local
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
    setLogsCombate((prev) => {
      const atualizados = [novoLog, ...prev.slice(0, 49)];
      return atualizados;
    });
    return novoLog;
  };

  // === SELECIONADOS E TURNO ATUAL ===
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

  // === VERIFICAÇÃO DE CÉLULAS ALCANÇÁVEIS (MOVIMENTO E ALCANCE DE AÇÃO) ===
  const propNaCelula = (x, y) =>
    (cenarioAtual.props || []).find((p) => p.x === x && p.y === y) || null;

  const tokenNaCelula = (x, y) => tokens.find((t) => t.x === x && t.y === y) || null;

  const custoMovimentoParaCelula = (origemX, origemY, destX, destY) => {
    const distBase = calcularDistanciaMetros(origemX, origemY, destX, destY);
    const prop = propNaCelula(destX, destY);
    if (prop?.bloqueiaMovimento) return Infinity;
    const penalidadeTerreno = prop?.terrenoDificil ? 1.5 : 0;
    return Number((distBase + penalidadeTerreno).toFixed(1));
  };

  // === SPAWNAR PERSONAGEM NO GRID ===
  const spawnarPersonagemNaCelula = async (x, y) => {
    if (!isMestre) return;
    const ocupado = tokenNaCelula(x, y);
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
      return alert(
        "Selecione uma ficha na aba 'Spawnar' ou clique em '⚡ Gerar Fichas Padrões D&D' primeiro!"
      );
    }

    // Se a ficha ainda não tiver equipamentos/magias carregados do banco, busca completo
    let fichaCompleta = { ...fichaBase };
    if (typeof fichaBase.id === "number" && !fichaBase.equipamento) {
      try {
        const res = await api.get(`/characters/${fichaBase.id}`);
        fichaCompleta = res.data;
      } catch {
        // usa a ficha base
      }
    }

    // Verifica se já existem outros tokens com o mesmo nome para numerar (ex: Goblin #2)
    const qtdMesmoNome = tokens.filter((t) =>
      t.nome.startsWith(fichaCompleta.nome)
    ).length;
    const nomeExibicao =
      qtdMesmoNome > 0 ? `${fichaCompleta.nome} #${qtdMesmoNome + 1}` : fichaCompleta.nome;

    // Rola Iniciativa D&D 5e: 1d20 + Modificador de Destreza (ou Iniciativa da ficha)
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

    const logSpawn = adicionarLog(
      "spawn",
      `🎲 ${nomeExibicao} entrou no campo de batalha em (${ String.fromCharCode(65 + x)}${y + 1})! Iniciativa: ${iniciativaTotal} (1d20[${d20Init}] ${modInit >= 0 ? `+${modInit}` : modInit})`
    );

    setTokens(novaListaTokens);
    setTokenSelecionadoId(novoToken.id);
    setModoInteracao("mover");

    await transmitirEstadoGeral({
      tokens: novaListaTokens,
      logsCombate: [logSpawn, ...logsCombate.slice(0, 49)],
    });
  };

  // === SINCRONIZAR HP NA FICHA DO BANCO DE DADOS ===
  const sincronizarHpNoBanco = async (tokenAtualizado) => {
    if (!tokenAtualizado?.fichaId || typeof tokenAtualizado.fichaId !== "number") return;

    // Se for um inimigo genérico clonado (ex: Goblin #2), só atualiza no banco se for o principal ou herói
    if (tokenAtualizado.nome.includes("#")) return;

    try {
      await api.patch(`/characters/${tokenAtualizado.fichaId}/hp`, {
        pontosDeVidaAtuais: tokenAtualizado.hpAtual,
        pontosDeVidaTemporarios: tokenAtualizado.hpTemp || 0,
        salvaguardaMorteSucessos: tokenAtualizado.morteSucessos || 0,
        salvaguardaMorteFalhas: tokenAtualizado.morteFalhas || 0,
      });
    } catch {
      // Fallback caso o backend em produção só tenha PUT /characters/{id}
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

  // === MOVER TOKEN NO TABULEIRO ===
  const moverTokenParaCelula = async (x, y) => {
    if (!tokenSelecionado) return;
    if (tokenSelecionado.hpAtual <= 0) {
      return alert("Personagens caídos (0 PV) não podem se mover!");
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

  // === EXECUTAR ATAQUE OU CURA SOBRE UM ALVO ===
  const executarAcaoNoAlvo = async (alvoToken) => {
    if (!tokenSelecionado || !acaoSelecionada) return;
    if (tokenSelecionado.hpAtual <= 0) {
      return alert("Este personagem está caído (0 PV) e não pode realizar ações!");
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

    // Verifica consumo de Ação ou Ação Bônus se o combate por turnos estiver ativo
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
      // === REGRA D&D 5e: CURA ===
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
      // === REGRA D&D 5e: ATAQUE (1d20 + Bônus vs CA) ===
      const d1 = rolarDado(20);
      const d2 = rolarDado(20);

      // Se o alvo estiver Esquivando, impõe desvantagem (a menos que já tivesse vantagem, anulando)
      let modoEfetivo = modoRolagemD20;
      if (alvoToken.esquivando) {
        modoEfetivo = modoRolagemD20 === "vantagem" ? "normal" : "desvantagem";
      }

      const d20Escolhido =
        modoEfetivo === "vantagem"
          ? Math.max(d1, d2)
          : modoEfetivo === "desvantagem"
            ? Math.min(d1, d2)
            : d1;

      const isCritico = d20Escolhido === 20;
      const isFalhaCritica = d20Escolhido === 1;
      const bonusAtaque = Number(acaoSelecionada.bonusAtaque || 0);
      const totalAtaque = d20Escolhido + bonusAtaque;
      const acertou = isCritico || (!isFalhaCritica && totalAtaque >= alvoToken.ca);

      const textoDadosD20 =
        modoEfetivo !== "normal"
          ? `2d20(${modoEfetivo.toUpperCase()})[${d1}, ${d2} → ${d20Escolhido}]`
          : `1d20[${d20Escolhido}]`;

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
          `⚔️ ${tokenSelecionado.nome} usou "${acaoSelecionada.nome}" em ${alvoToken.nome}: ${textoDadosD20} ${strBonusAtaque} = ${totalAtaque} vs CA ${alvoToken.ca}${tagCritico} Causou ${danoTotal} de dano (${rolagemDano.formula}[${rolagemDano.dados.join(",")}]${strBonusDano}). PV de ${alvoToken.nome}: ${novoHp}/${alvoToken.hpMax}${tagCaido}`
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
          `🛡️ ${tokenSelecionado.nome} atacou ${alvoToken.nome} com "${acaoSelecionada.nome}": ${textoDadosD20} ${strBonusAtaque} = ${totalAtaque} vs CA ${alvoToken.ca}${tagErro}`
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

  // === AÇÕES TÁTICAS DE TURNO (DISPARADA, ESQUIVAR, SALVAGUARDA CONTRA A MORTE) ===
  const usarDisparada = async () => {
    if (!tokenSelecionado) return;
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

  // === CONTROLE DE INICIATIVA E TURNOS ===
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

    // Restaura movimento, ação, ação bônus e limpa esquiva do personagem que inicia seu turno
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

  // === CLIQUE EM UMA CÉLULA DO TABULEIRO ===
  const handleCellClick = async (x, y) => {
    // 1. Modo de edição de Props do Cenário (Mestre)
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

    // 2. Modo de Spawn de Personagem (Mestre)
    if (isMestre && modoInteracao === "spawn") {
      await spawnarPersonagemNaCelula(x, y);
      return;
    }

    const tokenNoLocal = tokenNaCelula(x, y);

    // 3. Modo de Ação (Ataque ou Cura)
    if (modoInteracao === "acao" && acaoSelecionada) {
      if (tokenNoLocal) {
        await executarAcaoNoAlvo(tokenNoLocal);
      } else {
        setModoInteracao("mover");
        setAcaoSelecionada(null);
      }
      return;
    }

    // 4. Se clicou em um token existente, seleciona-o
    if (tokenNoLocal) {
      setTokenSelecionadoId(tokenNoLocal.id);
      setModoInteracao("mover");
      setAcaoSelecionada(null);
      return;
    }

    // 5. Se há um token selecionado e clicou numa célula vazia, move o token
    if (tokenSelecionado && modoInteracao === "mover") {
      await moverTokenParaCelula(x, y);
    }
  };

  const temaVisual = TEMAS_TABULEIRO[cenarioAtual.tema] || TEMAS_TABULEIRO.masmorra;

  return (
    <div className="w-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none z-40">
      {/* MODAL DE FICHA COMPLETA */}
      <FichaModal
        isOpen={fichaModalAberta}
        onClose={() => setFichaModalAberta(false)}
        fichaId={fichaModalDados.id}
        fichaObjeto={fichaModalDados.objeto}
      />

      {/* BARRA SUPERIOR: ORDEM DE INICIATIVA E CONTROLES GERAIS */}
      <header className="bg-zinc-900/95 border-b border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltarStorytelling}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            📖 Modo Storytelling
          </button>

          <div className="border-l border-zinc-800 pl-3">
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-extrabold uppercase tracking-wider text-sm">
                ⚔️ {cenarioAtual.nome}
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                {cenarioAtual.largura}x{cenarioAtual.altura} (1 quad = 1,5m)
              </span>
            </div>
          </div>
        </div>

        {/* TRACKER DE INICIATIVA CENTRAL */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-2xl py-0.5">
          {tokens.length === 0 ? (
            <span className="text-xs text-zinc-500 italic">
              Nenhum combatente no grid ainda...
            </span>
          ) : (
            tokens.map((t, idx) => {
              const isVez = combateIniciado && idx === turnoIndex % tokens.length;
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
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  } ${t.hpAtual <= 0 ? "opacity-50 line-through" : ""}`}
                >
                  <span>{t.icone}</span>
                  <span className="max-w-[90px] truncate">{t.nome}</span>
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

        {/* CONTROLES DE RODADA E TURNO */}
        <div className="flex items-center gap-2">
          {combateIniciado && (
            <div className="bg-red-950/60 border border-red-800/70 px-3 py-1 rounded-lg text-xs font-bold text-red-300">
              Rodada {rodada}
            </div>
          )}

          {isMestre && (
            <button
              onClick={iniciarOuReiniciarCombate}
              className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow"
            >
              🎲 {combateIniciado ? "Rerrolar Iniciativa" : "Rolar Iniciativa"}
            </button>
          )}

          {combateIniciado && (
            <button
              onClick={avancarProximoTurno}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow"
            >
              Passar Turno ⏭️
            </button>
          )}
        </div>
      </header>

      {/* CORPO PRINCIPAL: TABULEIRO + BARRA LATERAL TÁTICA */}
      <div className="flex-1 flex overflow-hidden">
        {/* ÁREA DO GRID QUADRICULADO */}
        <div className="flex-1 relative bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-auto">
          {/* BANNER DE INSTRUÇÃO DO MODO ATIVO */}
          <div className="mb-2 flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-4 py-1.5 rounded-full text-xs shadow-md">
            {modoInteracao === "spawn" && (
              <span className="text-emerald-400 font-bold">
                📍 Clique em qualquer quadrado livre do tabuleiro para spawnar o personagem selecionado!
              </span>
            )}
            {modoInteracao === "prop" && abaLateral === "cenario" && (
              <span className="text-amber-400 font-bold">
                🗺️ Modo Editor de Cenário: Clique nos quadrados para{" "}
                {modoBorrachaProp
                  ? "remover props (Borracha)"
                  : `posicionar ${propSelecionado?.icone} ${propSelecionado?.nome}`}
              </span>
            )}
            {modoInteracao === "acao" && acaoSelecionada && (
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold">
                  🎯 Alvo para {acaoSelecionada.icone} {acaoSelecionada.nome} (Alcance:{" "}
                  {acaoSelecionada.alcanceMetros}m): Clique em um personagem dentro da área destacada!
                </span>
                <button
                  onClick={() => {
                    setModoInteracao("mover");
                    setAcaoSelecionada(null);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-[11px]"
                >
                  Cancelar
                </button>
              </div>
            )}
            {modoInteracao === "mover" && (
              <span className="text-zinc-300">
                {tokenSelecionado
                  ? `Selecionado: ${tokenSelecionado.icone} ${tokenSelecionado.nome} — Clique em um quadrado azul (${tokenSelecionado.movimentoRestante}m restantes) para mover ou escolha uma Ação ao lado.`
                  : "Clique em um personagem no grid para selecioná-lo ou use a aba 'Spawnar' para adicionar combatentes."}
              </span>
            )}
          </div>

          {/* CONTAINER DO TABULEIRO */}
          <div
            className={`relative rounded-xl border-2 border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden ${temaVisual.bgGrid}`}
            style={{
              backgroundImage: cenarioAtual.fundoUrl
                ? `url(${cenarioAtual.fundoUrl})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Camada de contraste sutil quando há imagem de fundo */}
            {cenarioAtual.fundoUrl && (
              <div className="absolute inset-0 bg-black/35 pointer-events-none" />
            )}

            <div
              className="grid relative z-10"
              style={{
                gridTemplateColumns: `repeat(${cenarioAtual.largura}, minmax(46px, 54px))`,
                gridTemplateRows: `repeat(${cenarioAtual.altura}, minmax(46px, 54px))`,
              }}
            >
              {Array.from({ length: cenarioAtual.altura }).map((_, y) =>
                Array.from({ length: cenarioAtual.largura }).map((__, x) => {
                  const prop = propNaCelula(x, y);
                  const tok = tokenNaCelula(x, y);
                  const isTokenSel = tok && tok.id === tokenSelecionadoId;
                  const isTokenVez =
                    tok && tokenDoTurno && tok.id === tokenDoTurno.id;

                  // Verifica se a célula está no alcance de movimento
                  let alcançavelMovimento = false;
                  let custoCelula = 0;
                  if (
                    modoInteracao === "mover" &&
                    tokenSelecionado &&
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

                  // Verifica se a célula está no alcance da ação (ataque ou cura)
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
                      title={
                        tok
                          ? `${tok.nome} (${tok.hpAtual}/${tok.hpMax} PV • CA ${tok.ca})`
                          : prop
                            ? `${prop.nome} (${coordLabel})`
                            : `Célula ${coordLabel}`
                      }
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
                      {/* Coordenada discreta no canto */}
                      <span className="absolute top-0.5 left-1 text-[8px] text-zinc-500/60 font-mono pointer-events-none">
                        {coordLabel}
                      </span>

                      {/* Custo em metros ao passar o mouse em célula alcançável */}
                      {alcançavelMovimento && (
                        <span className="absolute bottom-0.5 right-1 text-[8px] text-sky-300/80 font-mono pointer-events-none">
                          {custoCelula}m
                        </span>
                      )}

                      {/* PROP DO CENÁRIO */}
                      {prop && (
                        <div
                          className={`w-9 h-9 rounded-md border flex items-center justify-center text-lg shadow-inner ${
                            catalogoProp?.cor || "bg-stone-800 border-stone-600"
                          }`}
                        >
                          <span>{prop.icone}</span>
                        </div>
                      )}

                      {/* TOKEN DO PERSONAGEM */}
                      {tok && (
                        <div
                          className={`relative z-20 w-11 h-11 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform ${
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
                            isTokenVez
                              ? "ring-4 ring-amber-400/80"
                              : ""
                          } ${tok.hpAtual <= 0 ? "grayscale opacity-60" : ""}`}
                        >
                          <span className="text-lg leading-none">
                            {tok.hpAtual <= 0 ? "💀" : tok.icone}
                          </span>
                          <span className="text-[8px] font-bold max-w-[38px] truncate leading-tight">
                            {tok.nome.split(" ")[0]}
                          </span>

                          {/* Barra de Vida Miniatura sobre o Token */}
                          <div className="absolute -top-1.5 w-10 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700">
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

                          {/* Indicador de Esquiva ativa */}
                          {tok.esquivando && (
                            <span
                              title="Esquivando (Ataques contra têm Desvantagem)"
                              className="absolute -bottom-1 -right-1 text-[10px] bg-sky-900 border border-sky-400 rounded-full px-0.5"
                            >
                              🛡️
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* BARRA LATERAL TÁTICA (COMBATE, SPAWN DE FICHAS, EDITOR DE CENÁRIOS E LOGS) */}
        <aside className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
          {/* ABAS DE NAVEGAÇÃO LATERAL */}
          <div className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-950/60">
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

          {/* CONTEÚDO DA ABA ATIVA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ============================================================ */}
            {/* ABA 1: AÇÕES DE COMBATE DO PERSONAGEM SELECIONADO             */}
            {/* ============================================================ */}
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
                    {/* CARD RESUMO DO PERSONAGEM SELECIONADO */}
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
                            title="Abrir Ficha Completa D&D"
                          >
                            📜 Ficha
                          </button>
                          {isMestre && (
                            <button
                              onClick={() => removerToken(tokenSelecionado.id)}
                              className="bg-red-950/60 hover:bg-red-900 text-red-300 px-2 py-1 rounded text-[11px] border border-red-800/60"
                              title="Remover do Tabuleiro"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      {/* STATUS VITAIS (PV, CA, MOVIMENTO, INICIATIVA) */}
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

                      {/* RECURSOS DO TURNO ATUAL */}
                      {combateIniciado && (
                        <div className="flex items-center justify-between bg-zinc-900/70 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px]">
                          <span
                            className={
                              tokenSelecionado.acaoDisponivel
                                ? "text-emerald-400 font-bold"
                                : "text-zinc-600 line-through"
                            }
                          >
                            ● Ação Principal
                          </span>
                          <span
                            className={
                              tokenSelecionado.acaoBonusDisponivel
                                ? "text-amber-400 font-bold"
                                : "text-zinc-600 line-through"
                            }
                          >
                            ● Ação Bônus
                          </span>
                        </div>
                      )}
                    </div>

                    {/* SELETOR DE VANTAGEM / NORMAL / DESVANTAGEM (D&D 5e) */}
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1.5 tracking-wider">
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
                            className={`py-1 rounded text-[11px] font-bold transition-colors ${
                              modoRolagemD20 === m.id
                                ? m.id === "vantagem"
                                  ? "bg-emerald-700 text-white"
                                  : m.id === "desvantagem"
                                    ? "bg-red-800 text-white"
                                    : "bg-zinc-700 text-white"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SALVAGUARDA CONTRA A MORTE QUANDO EM 0 PV */}
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
                          className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-xs shadow"
                        >
                          🎲 Rolar Salvaguarda Contra a Morte (1d20)
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* LISTA DE ATAQUES, MAGIAS E CURAS DA FICHA */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                            ⚔️ Ataques, Magias & Curas da Ficha
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
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
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

                        {/* MANOBRAS TÁTICAS D&D 5e */}
                        <div className="pt-2 border-t border-zinc-800">
                          <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-2 tracking-wider">
                            Manobras Táticas de Combate
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={usarDisparada}
                              className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-sky-300 py-2 px-3 rounded-lg text-xs font-bold transition-colors"
                            >
                              🏃 Disparada (+Mov)
                            </button>
                            <button
                              onClick={usarEsquivar}
                              className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-300 py-2 px-3 rounded-lg text-xs font-bold transition-colors"
                            >
                              🛡️ Esquivar (Dodge)
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ============================================================ */}
            {/* ABA 2: FICHAS E SPAWN DE PERSONAGENS NO TABULEIRO             */}
            {/* ============================================================ */}
            {abaLateral === "spawn" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                    🧙‍♂️ Fichas da Campanha ({fichasMesa.length})
                  </h4>
                  <button
                    onClick={gerarFichasPadroesNaMesa}
                    disabled={carregandoFichas}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors shadow"
                  >
                    {carregandoFichas ? "Gerando..." : "⚡ Gerar Fichas Padrões D&D"}
                  </button>
                </div>

                {isMestre && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-3">
                    <label className="block text-[10px] text-zinc-400 uppercase font-bold">
                      Facção ao Spawnar no Tabuleiro
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "heroi", label: "🛡️ Herói", cor: "bg-emerald-700" },
                        { id: "inimigo", label: "👹 Inimigo", cor: "bg-red-700" },
                        { id: "neutro", label: "⚜️ NPC", cor: "bg-amber-700" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFaccaoSpawn(f.id)}
                          className={`py-1.5 rounded text-xs font-bold transition-colors ${
                            faccaoSpawn === f.id
                              ? `${f.cor} text-white`
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Selecione uma ficha abaixo e depois <strong>clique em qualquer quadrado do grid</strong> para spawnar o personagem!
                    </p>
                  </div>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {fichasMesa.length === 0 ? (
                    <div className="text-center py-6 bg-zinc-950 rounded-xl border border-zinc-800 p-4">
                      <p className="text-xs text-zinc-500 mb-3">
                        Nenhuma ficha encontrada nesta mesa ainda.
                      </p>
                      <button
                        onClick={gerarFichasPadroesNaMesa}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
                      >
                        ⚡ Carregar 8 Fichas Padrões D&D 5e
                      </button>
                    </div>
                  ) : (
                    fichasMesa.map((f) => {
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
                            if (isMestre) setModoInteracao("spawn");
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selecionada
                              ? "bg-emerald-950/60 border-emerald-500 text-white"
                              : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300"
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

                          <div className="flex items-center gap-1 shrink-0">
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
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* ABA 3: EDITOR DE CENÁRIOS E PROPS (MESTRE)                    */}
            {/* ============================================================ */}
            {abaLateral === "cenario" && (
              <div className="space-y-4">
                {!isMestre ? (
                  <p className="text-xs text-zinc-400 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    Apenas o Mestre pode editar os props e alternar cenários durante a batalha.
                  </p>
                ) : (
                  <>
                    {/* TROCAR CENÁRIO PRONTO OU SALVO */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                      <h4 className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                        🗺️ Trocar Cenário Instantaneamente
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {[...CENARIOS_PADROES, ...cenariosSalvos].map((cen) => (
                          <button
                            key={cen.id}
                            onClick={() => aplicarCenario(cen)}
                            className={`text-left px-2.5 py-1.5 rounded-lg border text-xs flex justify-between items-center transition-colors ${
                              cenarioAtual.nome === cen.nome
                                ? "bg-amber-950/70 border-amber-500 text-amber-200 font-bold"
                                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
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

                    {/* CONFIGURAÇÕES VISUAIS DO CENÁRIO ATUAL */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                      <h4 className="text-[11px] font-bold uppercase text-zinc-400">
                        Tema & Imagem de Fundo
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={cenarioAtual.tema}
                          onChange={(e) => {
                            const atualizado = {
                              ...cenarioAtual,
                              tema: e.target.value,
                            };
                            setCenarioAtual(atualizado);
                            void transmitirEstadoGeral({ cenarioAtual: atualizado });
                          }}
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          {Object.entries(TEMAS_TABULEIRO).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.nome}
                            </option>
                          ))}
                        </select>

                        <select
                          value={cenarioAtual.fundoUrl || ""}
                          onChange={(e) => {
                            const atualizado = {
                              ...cenarioAtual,
                              fundoUrl: e.target.value,
                            };
                            setCenarioAtual(atualizado);
                            void transmitirEstadoGeral({ cenarioAtual: atualizado });
                          }}
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          <option value="">Sem Imagem (Tema Puro)</option>
                          {cenaStorytelling && (
                            <option value={cenaStorytelling}>
                              Cena Atual do Storytelling
                            </option>
                          )}
                          {midias
                            .filter((m) => m.tipo === 0)
                            .map((m) => (
                              <option key={m.id} value={m.caminhoServidor}>
                                {m.nomeArquivo}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* PALETA DE PROPS INTERATIVOS */}
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
                            className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-800"
                          >
                            Limpar Tudo
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
                              className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                                ativo
                                  ? "bg-amber-950/70 border-amber-400 text-white"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                              }`}
                            >
                              <span className="text-base">{p.icone}</span>
                              <div className="min-w-0">
                                <span className="block text-[11px] font-bold truncate">
                                  {p.nome}
                                </span>
                                <span className="block text-[9px] text-zinc-500">
                                  {p.bloqueiaMovimento
                                    ? "Bloqueia"
                                    : p.terrenoDificil
                                      ? "Terreno Difícil"
                                      : "Interativo"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SALVAR CENÁRIO */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                      <input
                        type="text"
                        value={nomeNovoCenario}
                        onChange={(e) => setNomeNovoCenario(e.target.value)}
                        placeholder={`Salvar como (ex: ${cenarioAtual.nome})`}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={salvarCenarioAtual}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow"
                      >
                        💾 Salvar Cenário Atual
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* REGISTRO DE ROLAGENS E COMBATE (SEMPRE VISÍVEL NO RODAPÉ DA LATERAL) */}
          <div className="h-52 border-t border-zinc-800 bg-zinc-950 flex flex-col">
            <div className="px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                🎲 Registro de Combate D&D
              </span>
              {isMestre && (
                <button
                  onClick={() =>
                    setLogsCombate([
                      {
                        id: String(Date.now()),
                        tipo: "sistema",
                        texto: "Registro limpo pelo Mestre.",
                        horario: "",
                      },
                    ])
                  }
                  className="text-[10px] text-zinc-500 hover:text-zinc-300"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 font-mono text-[11px]">
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
      </div>
    </div>
  );
}
