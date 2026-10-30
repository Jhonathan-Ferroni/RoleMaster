import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api, obterUsuarioLogado } from "../services/api";
import { FichaModal } from "../pages/FichaModel";
import {
  calcularDistanciaMetros,
  calcularQuadradosDistancia,
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
  { id: "abencoado", nome: "Abençoado", icone: "✨" },
  { id: "envenenado", nome: "Envenenado", icone: "🤢" },
  { id: "caido", nome: "Caído", icone: "🔻" },
  { id: "atordoado", nome: "Atordoado", icone: "💫" },
  { id: "concentrando", nome: "Concentração", icone: "🧠" },
];

const PERICIAS_RAPIDAS = [
  { key: "percepcao", label: "Percepção", attr: "sabedoria" },
  { key: "investigacao", label: "Investigação", attr: "inteligencia" },
  { key: "furtividade", label: "Furtividade", attr: "destreza" },
  { key: "intuicao", label: "Intuição", attr: "sabedoria" },
  { key: "persuasao", label: "Persuasão", attr: "carisma" },
  { key: "atletismo", label: "Atletismo", attr: "forca" },
  { key: "acrobacia", label: "Acrobacia", attr: "destreza" },
  { key: "arcanismo", label: "Arcanismo", attr: "inteligencia" },
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

const detectarFaccaoFicha = (ficha) => {
  const c = ((ficha?.classe || "") + " " + (ficha?.antecedente || "")).toLowerCase();
  if (c.includes("inimigo") || c.includes("chefe") || c.includes("monstro")) {
    return "inimigo";
  }
  return "heroi";
};

const gerarIdUnico = (prefixo = "id") =>
  `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const horarioCurto = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const lerEstadoLocalSala = (tenantId) => {
  if (!tenantId) return null;
  try {
    const salvo = localStorage.getItem(`rolemaster_batalha_${tenantId}`);
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
};

export function TabuleiroBatalha({
  tenantId,
  mesaInfo,
  isMestre,
  conexaoSignalR,
  solicitacoes = [],
  onAvaliarSolicitacao,
  midias = [],
  uploadingMidia = false,
  onUploadMidia,
  onExcluirMidia,
  onTransmitirCena,
  audioAtivo = "",
  volume = 0.5,
  onTocarMusica,
  onAlterarVolume,
}) {
  const navigate = useNavigate();
  const usuarioLogado = obterUsuarioLogado();

  // === DADOS DA SALA (FICHAS E CENÁRIOS) ===
  const [fichasMesa, setFichasMesa] = useState([]);
  const [carregandoFichas, setCarregandoFichas] = useState(false);
  const [cenariosSalvos, setCenariosSalvos] = useState([]);

  // === CENÁRIO ATUAL (UNIFICADO: MAPA, GRADE E OBJETOS) ===
  const [cenarioAtual, setCenarioAtual] = useState(() => {
    const salvo = lerEstadoLocalSala(tenantId);
    if (salvo?.cenarioAtual) {
      return {
        mostrarGrade: true,
        ...salvo.cenarioAtual,
      };
    }
    return {
      id: CENARIOS_PADROES[0].id,
      nome: CENARIOS_PADROES[0].nome,
      tema: CENARIOS_PADROES[0].tema,
      largura: CENARIOS_PADROES[0].largura,
      altura: CENARIOS_PADROES[0].altura,
      fundoUrl: "",
      mostrarGrade: true,
      props: [...CENARIOS_PADROES[0].props],
    };
  });

  // === TOKENS E TURNOS (LIVRE POR PADRÃO, COMO NO OWLBEAR RODEO) ===
  const [tokens, setTokens] = useState(() => {
    const salvo = lerEstadoLocalSala(tenantId);
    return Array.isArray(salvo?.tokens) ? salvo.tokens : [];
  });
  const [rodada, setRodada] = useState(() => {
    const salvo = lerEstadoLocalSala(tenantId);
    return typeof salvo?.rodada === "number" ? salvo.rodada : 1;
  });
  const [turnoIndex, setTurnoIndex] = useState(() => {
    const salvo = lerEstadoLocalSala(tenantId);
    return typeof salvo?.turnoIndex === "number" ? salvo.turnoIndex : 0;
  });
  const [combateIniciado, setCombateIniciado] = useState(() => {
    const salvo = lerEstadoLocalSala(tenantId);
    return typeof salvo?.combateIniciado === "boolean"
      ? salvo.combateIniciado
      : false;
  });
  const [logsCombate, setLogsCombate] = useState(() => {
    const salvo = lerEstadoLocalSala(tenantId);
    return Array.isArray(salvo?.logsCombate) ? salvo.logsCombate : [];
  });
  const [rolagensSala, setRolagensSala] = useState([]);

  // === FERRAMENTAS E POPOVERS MINIMALISTAS ===
  const [ferramenta, setFerramenta] = useState("mover"); // 'mover' | 'medir' | 'objetos' | 'alvo' | 'posicionar'
  const [painelAberto, setPainelAberto] = useState(null); // null | 'grupo' | 'cenas' | 'dados' | 'historico' | 'dock' | 'turnosMenu'
  const [abaCenas, setAbaCenas] = useState("mapas"); // 'mapas' | 'audio'
  const [subMenuToken, setSubMenuToken] = useState(null); // null | 'acoes' | 'status'
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  // === SELEÇÃO, ARRASTE, RÉGUA E ZOOM ===
  const [tokenSelecionadoId, setTokenSelecionadoId] = useState(null);
  const [acaoSelecionada, setAcaoSelecionada] = useState(null);
  const [fichaParaPosicionar, setFichaParaPosicionar] = useState(null);
  const [spawnOculto, setSpawnOculto] = useState(false);
  const [propSelecionado, setPropSelecionado] = useState(PROPS_CATALOGO[0]);
  const [modoBorrachaProp, setModoBorrachaProp] = useState(false);
  const [nomeNovoCenario, setNomeNovoCenario] = useState("");
  const [reguaInicio, setReguaInicio] = useState(null);
  const [reguaFim, setReguaFim] = useState(null);
  const [arrastandoItem, setArrastandoItem] = useState(null); // { tipo: 'token', id } | { tipo: 'ficha', ficha }

  const CELL_BASE = 48;
  const [tamanhoCelula, setTamanhoCelula] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? 42 : 48
  );

  // === DADOS / ROLAGENS E TOASTS EFÊMEROS ===
  const [modoRolagemD20, setModoRolagemD20] = useState("normal");
  const [fichaRolagemId, setFichaRolagemId] = useState("");
  const [toastsVisiveis, setToastsVisiveis] = useState([]);

  // === MODAL DE FICHA ===
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaModalDados, setFichaModalDados] = useState({ id: null, objeto: null });

  const dispararToast = (texto, variante = "info") => {
    const id = gerarIdUnico("toast");
    setToastsVisiveis((prev) => [{ id, texto, variante }, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setToastsVisiveis((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const podeControlarToken = (tok) => {
    if (!tok) return false;
    if (isMestre) return true;
    if (tok.faccao === "inimigo") return false;
    const donoId = tok.ficha?.usuarioId;
    if (!donoId) return tok.faccao === "heroi";
    return Number(donoId) === Number(usuarioLogado?.id);
  };

  useEffect(() => {
    if (!conexaoSignalR) return;

    const aplicarEstadoRemoto = (novoEstado) => {
      if (!novoEstado) return;
      if (novoEstado.cenarioAtual) {
        setCenarioAtual({ mostrarGrade: true, ...novoEstado.cenarioAtual });
      }
      if (Array.isArray(novoEstado.tokens)) setTokens(novoEstado.tokens);
      if (typeof novoEstado.rodada === "number") setRodada(novoEstado.rodada);
      if (typeof novoEstado.turnoIndex === "number")
        setTurnoIndex(novoEstado.turnoIndex);
      if (typeof novoEstado.combateIniciado === "boolean")
        setCombateIniciado(novoEstado.combateIniciado);
      if (Array.isArray(novoEstado.logsCombate))
        setLogsCombate(novoEstado.logsCombate);
    };

    const handleModoBatalha = (_emBatalha, estadoBatalha) => {
      if (estadoBatalha) aplicarEstadoRemoto(estadoBatalha);
    };

    const handleNovaCena = (urlImagem) => {
      setCenarioAtual((prev) => ({ ...prev, fundoUrl: urlImagem || "" }));
    };

    const handleTokenMovido = (tokenId, novoX, novoY, movimentoRestante) => {
      setTokens((prev) =>
        prev.map((t) =>
          t.id === tokenId ? { ...t, x: novoX, y: novoY, movimentoRestante } : t
        )
      );
    };

    const handleCenarioAtualizado = (novoCenario) => {
      if (novoCenario) setCenarioAtual({ mostrarGrade: true, ...novoCenario });
    };

    const handleAcaoExecutada = (payload) => {
      if (!payload) return;
      if (Array.isArray(payload.tokens)) setTokens(payload.tokens);
      if (payload.log) {
        setLogsCombate((prev) => [payload.log, ...prev.slice(0, 49)]);
        dispararToast(
          payload.log.texto,
          payload.log.tipo === "cura" ? "sucesso" : "dado"
        );
      }
    };

    const handleRolagemRecebida = (rolagem) => {
      if (!rolagem?.id) return;
      setRolagensSala((prev) => {
        if (prev.some((r) => r.id === rolagem.id)) return prev;
        return [rolagem, ...prev.slice(0, 29)];
      });
      const texto = `🎲 ${rolagem.autor}: ${rolagem.titulo} → ${rolagem.total} ${rolagem.detalhe || ""}`;
      dispararToast(
        texto,
        rolagem.critico ? "sucesso" : rolagem.falha ? "erro" : "dado"
      );
    };

    conexaoSignalR.on("EstadoBatalhaAtualizado", aplicarEstadoRemoto);
    conexaoSignalR.on("ModoBatalhaAlterado", handleModoBatalha);
    conexaoSignalR.on("ReceberNovaCena", handleNovaCena);
    conexaoSignalR.on("TokenMovido", handleTokenMovido);
    conexaoSignalR.on("CenarioBatalhaAtualizado", handleCenarioAtualizado);
    conexaoSignalR.on("AcaoCombateExecutada", handleAcaoExecutada);
    conexaoSignalR.on("ReceberRolagemStorytelling", handleRolagemRecebida);

    return () => {
      conexaoSignalR.off("EstadoBatalhaAtualizado", aplicarEstadoRemoto);
      conexaoSignalR.off("ModoBatalhaAlterado", handleModoBatalha);
      conexaoSignalR.off("ReceberNovaCena", handleNovaCena);
      conexaoSignalR.off("TokenMovido", handleTokenMovido);
      conexaoSignalR.off("CenarioBatalhaAtualizado", handleCenarioAtualizado);
      conexaoSignalR.off("AcaoCombateExecutada", handleAcaoExecutada);
      conexaoSignalR.off("ReceberRolagemStorytelling", handleRolagemRecebida);
    };
  }, [conexaoSignalR]);

  useEffect(() => {
    if (!tenantId) return;
    let ativo = true;

    const carregarDadosIniciais = async () => {
      // 1. Fichas da sala
      try {
        const res = await api.get(`/characters/mesa/${tenantId}`);
        if (ativo) {
          const lista = Array.isArray(res.data) ? res.data : [];
          setFichasMesa(lista);
          if (lista.length > 0) {
            const minha = lista.find(
              (f) => Number(f.usuarioId) === Number(usuarioLogado?.id)
            );
            setFichaRolagemId((atual) =>
              atual || String((minha || lista[0]).id)
            );
          }
        }
      } catch {
        try {
          const resMinhas = await api.get(`/characters/mesa/${tenantId}/minhas`);
          if (ativo) {
            const lista = Array.isArray(resMinhas.data) ? resMinhas.data : [];
            setFichasMesa(lista);
            if (lista.length > 0) {
              setFichaRolagemId((atual) => atual || String(lista[0].id));
            }
          }
        } catch {
          // fallback silencioso
        }
      }

      // 2. Cenários salvos da sala
      const chaveLocal = `rolemaster_cenarios_${tenantId}`;
      let locais = [];
      try {
        const bruto = localStorage.getItem(chaveLocal);
        if (bruto) locais = JSON.parse(bruto);
      } catch {
        locais = [];
      }

      try {
        const resCen = await api.get(`/cenarios/mesa/${tenantId}`);
        if (ativo && Array.isArray(resCen.data) && resCen.data.length > 0) {
          const doBanco = resCen.data.map((c) => ({
            id: c.id,
            nome: c.nome,
            tema: c.tema || "masmorra",
            largura: c.largura || 14,
            altura: c.altura || 10,
            fundoUrl: c.fundoUrl || "",
            mostrarGrade: true,
            props: (() => {
              try {
                return JSON.parse(c.propsJson || "[]");
              } catch {
                return [];
              }
            })(),
          }));
          setCenariosSalvos(doBanco);
          return;
        }
      } catch {
        // fallback local
      }
      if (ativo) setCenariosSalvos(locais);
    };

    void carregarDadosIniciais();

    return () => {
      ativo = false;
    };
  }, [tenantId, isMestre, usuarioLogado?.id]);

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
      await conexaoSignalR
        .invoke("SincronizarEstadoBatalha", tenantId, pacote)
        .catch(() => {});
    }
  };

  const registrarEvento = (tipo, texto, mostrarNotificacao = true) => {
    const novoLog = {
      id: gerarIdUnico("log"),
      tipo,
      texto,
      horario: horarioCurto(),
    };
    setLogsCombate((prev) => [novoLog, ...prev.slice(0, 49)]);
    if (mostrarNotificacao) {
      dispararToast(
        texto,
        tipo === "cura" ? "sucesso" : tipo === "erro" ? "erro" : "dado"
      );
    }
    return novoLog;
  };

  const gerarFichasPadroesNaMesa = async () => {
    setCarregandoFichas(true);
    try {
      const res = await api.post(`/characters/mesa/${tenantId}/padroes`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFichasMesa(res.data);
        dispararToast("Heróis e monstros prontos adicionados!", "sucesso");
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
            criadas.push({ ...template, ...resp.data });
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
      dispararToast("Exemplos de personagens carregados!", "sucesso");
    } finally {
      setCarregandoFichas(false);
    }
  };

  const aprovarFichaRapido = async (fichaId) => {
    try {
      await api.patch(`/characters/${fichaId}/status`, 1, {
        headers: { "Content-Type": "application/json" },
      });
      setFichasMesa((prev) =>
        prev.map((f) => (f.id === fichaId ? { ...f, status: 1 } : f))
      );
      dispararToast("Ficha aprovada!", "sucesso");
    } catch {
      // silencioso
    }
  };

  // === CENÁRIOS & GRADE ===
  const alternarGrade = async () => {
    const atualizado = {
      ...cenarioAtual,
      mostrarGrade: !cenarioAtual.mostrarGrade,
    };
    setCenarioAtual(atualizado);
    if (isMestre) {
      if (conexaoSignalR) {
        await conexaoSignalR
          .invoke("AtualizarCenarioBatalha", tenantId, atualizado)
          .catch(() => {});
      }
      await transmitirEstadoGeral({ cenarioAtual: atualizado });
    }
  };

  const aplicarCenario = async (cenarioEscolhido) => {
    const copia = {
      mostrarGrade: cenarioAtual.mostrarGrade,
      ...cenarioEscolhido,
      props: Array.isArray(cenarioEscolhido.props)
        ? [...cenarioEscolhido.props]
        : [],
    };
    setCenarioAtual(copia);
    if (onTransmitirCena && copia.fundoUrl !== undefined) {
      void onTransmitirCena(copia.fundoUrl);
    }
    if (conexaoSignalR) {
      await conexaoSignalR
        .invoke("AtualizarCenarioBatalha", tenantId, copia)
        .catch(() => {});
    }
    await transmitirEstadoGeral({ cenarioAtual: copia });
    dispararToast(`Cena: ${copia.nome}`);
  };

  const definirImagemDeFundo = async (urlImagem, nomeCena = "Cena Customizada") => {
    const atualizado = {
      ...cenarioAtual,
      nome: nomeCena,
      fundoUrl: urlImagem,
    };
    setCenarioAtual(atualizado);
    if (onTransmitirCena) {
      await onTransmitirCena(urlImagem);
    }
    if (conexaoSignalR) {
      await conexaoSignalR
        .invoke("AtualizarCenarioBatalha", tenantId, atualizado)
        .catch(() => {});
    }
    await transmitirEstadoGeral({ cenarioAtual: atualizado });
  };

  const salvarCenarioAtual = async () => {
    const nomeFinal = (
      nomeNovoCenario ||
      cenarioAtual.nome ||
      "Cena Salva"
    ).trim();
    const objetoCenario = {
      ...cenarioAtual,
      id:
        cenarioAtual.id && !String(cenarioAtual.id).startsWith("preset-")
          ? cenarioAtual.id
          : gerarIdUnico("custom"),
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
        if (res.data?.id) objetoCenario.id = res.data.id;
      }
    } catch {
      // mantém local
    }

    dispararToast(`Cena "${nomeFinal}" salva!`, "sucesso");
    await transmitirEstadoGeral({ cenarioAtual: objetoCenario });
  };

  // === DERIVADOS DE TOKENS ===
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

  // === SPAWN / POSICIONAMENTO DIRETO ===
  const posicionarFichaNaCelula = async (fichaBase, x, y) => {
    if (!fichaBase) return;
    if (
      !isMestre &&
      Number(fichaBase.usuarioId) !== Number(usuarioLogado?.id)
    ) {
      return;
    }

    const ocupado = tokens.find((t) => t.x === x && t.y === y);
    if (ocupado) {
      setTokenSelecionadoId(ocupado.id);
      return;
    }

    const prop = propNaCelula(x, y);
    if (prop?.bloqueiaMovimento) {
      dispararToast("Esse quadrado está bloqueado por um obstáculo.", "erro");
      return;
    }

    let fichaCompleta = { ...fichaBase };
    if (typeof fichaBase.id === "number" && !fichaBase.equipamento) {
      try {
        const res = await api.get(`/characters/${fichaBase.id}`);
        fichaCompleta = res.data;
      } catch {
        // usa base
      }
    }

    const faccao = detectarFaccaoFicha(fichaCompleta);
    const qtdMesmoNome = tokens.filter((t) =>
      t.nome.startsWith(fichaCompleta.nome)
    ).length;
    const nomeExibicao =
      qtdMesmoNome > 0
        ? `${fichaCompleta.nome} #${qtdMesmoNome + 1}`
        : fichaCompleta.nome;

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

    const ocultoFinal = isMestre ? spawnOculto : false;

    const novoToken = {
      id: gerarIdUnico("tok"),
      fichaId: fichaCompleta.id,
      nome: nomeExibicao,
      faccao,
      oculto: ocultoFinal,
      condicoes: [],
      icone: obterIconeFicha(fichaCompleta, faccao),
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

    const novaListaTokens = combateIniciado
      ? [...tokens, novoToken].sort((a, b) => b.iniciativa - a.iniciativa)
      : [...tokens, novoToken];

    setTokens(novaListaTokens);
    setTokenSelecionadoId(novoToken.id);
    setFerramenta("mover");
    setFichaParaPosicionar(null);

    const novosLogs = ocultoFinal
      ? logsCombate
      : [
          registrarEvento(
            "spawn",
            `${novoToken.icone} ${nomeExibicao} entrou no mapa`,
            true
          ),
          ...logsCombate.slice(0, 48),
        ];

    await transmitirEstadoGeral({
      tokens: novaListaTokens,
      logsCombate: novosLogs,
    });
  };

  // === SINCRONIZAÇÃO E AJUSTE RÁPIDO DE VIDA ===
  const sincronizarHpNoBanco = async (tokenAtualizado) => {
    if (
      !tokenAtualizado?.fichaId ||
      typeof tokenAtualizado.fichaId !== "number"
    )
      return;
    if (tokenAtualizado.nome.includes("#")) return;

    try {
      await api.patch(`/characters/${tokenAtualizado.fichaId}/hp`, {
        pontosDeVidaAtuais: tokenAtualizado.hpAtual,
        pontosDeVidaTemporarios: tokenAtualizado.hpTemp || 0,
        salvaguardaMorteSucessos: tokenAtualizado.morteSucessos || 0,
        salvaguardaMorteFalhas: tokenAtualizado.morteFalhas || 0,
      });
    } catch {
      // silencioso
    }
  };

  const ajustarHpRapido = async (delta) => {
    if (!tokenSelecionado || !podeControlarToken(tokenSelecionado)) return;
    const novoHp = Math.max(
      0,
      Math.min(tokenSelecionado.hpMax, tokenSelecionado.hpAtual + delta)
    );
    if (novoHp === tokenSelecionado.hpAtual) return;

    const novosTokens = tokens.map((t) => {
      if (t.id !== tokenSelecionado.id) return t;
      return {
        ...t,
        hpAtual: novoHp,
        morteSucessos: novoHp > 0 ? 0 : t.morteSucessos,
        morteFalhas: novoHp > 0 ? 0 : t.morteFalhas,
        ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: novoHp } : t.ficha,
      };
    });

    setTokens(novosTokens);
    const atualizado = novosTokens.find((t) => t.id === tokenSelecionado.id);
    void sincronizarHpNoBanco(atualizado);

    const log = registrarEvento(
      delta > 0 ? "cura" : "ataque",
      `${tokenSelecionado.nome}: ${delta > 0 ? `+${delta}` : delta} PV (${novoHp}/${tokenSelecionado.hpMax})`,
      false
    );

    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: [log, ...logsCombate.slice(0, 48)],
    });
  };

  // === MOVIMENTAÇÃO DE TOKEN (ARRASTAR OU CLICAR) ===
  const moverTokenParaCelula = async (tokenAlvo, x, y) => {
    const tok = tokenAlvo || tokenSelecionado;
    if (!tok) return;
    if (tok.x === x && tok.y === y) return;
    if (!podeControlarToken(tok)) {
      dispararToast("Você só pode mover seus próprios personagens.", "erro");
      return;
    }

    const ocupado = tokens.find((t) => t.x === x && t.y === y && t.id !== tok.id);
    if (ocupado) return;

    const custo = custoMovimentoParaCelula(tok.x, tok.y, x, y);
    if (custo === Infinity) {
      dispararToast("Movimento bloqueado por obstáculo.", "erro");
      return;
    }

    if (combateIniciado) {
      if (tok.hpAtual <= 0) {
        dispararToast("Personagem com 0 PV não pode se mover em combate.", "erro");
        return;
      }
      if ((tok.condicoes || []).includes("atordoado")) {
        dispararToast("Personagem atordoado não pode se mover.", "erro");
        return;
      }
      if (custo > tok.movimentoRestante) {
        dispararToast(
          `Alcance do turno: restam ${tok.movimentoRestante}m (custo ${custo}m).`,
          "erro"
        );
        return;
      }
    }

    const novoMovimento = combateIniciado
      ? Number(Math.max(0, tok.movimentoRestante - custo).toFixed(1))
      : tok.deslocamentoMax;

    const propDestino = propNaCelula(x, y);
    let danoAmbiental = 0;
    if (propDestino?.danoAmbiental) {
      const r = rolarExpressaoDados(propDestino.danoAmbiental);
      danoAmbiental = r.total;
      dispararToast(
        `🔥 ${tok.nome} sofreu ${danoAmbiental} de dano em ${propDestino.nome}!`,
        "erro"
      );
    }

    const novosTokens = tokens.map((t) => {
      if (t.id !== tok.id) return t;
      const novoHp = Math.max(0, t.hpAtual - danoAmbiental);
      return {
        ...t,
        x,
        y,
        hpAtual: novoHp,
        movimentoRestante: novoMovimento,
        ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: novoHp } : t.ficha,
      };
    });

    setTokens(novosTokens);

    if (conexaoSignalR) {
      await conexaoSignalR
        .invoke("MoverToken", tenantId, tok.id, x, y, novoMovimento)
        .catch(() => {});
    }

    await transmitirEstadoGeral({ tokens: novosTokens });
  };

  // === AÇÕES AUTOMATIZADAS DA FICHA ===
  const executarAcaoNoAlvo = async (alvoToken) => {
    if (!tokenSelecionado || !acaoSelecionada) return;
    if (!podeControlarToken(tokenSelecionado)) return;

    const distancia = calcularDistanciaMetros(
      tokenSelecionado.x,
      tokenSelecionado.y,
      alvoToken.x,
      alvoToken.y
    );

    if (distancia > acaoSelecionada.alcanceMetros) {
      dispararToast(
        `Fora de alcance (${distancia}m / máx ${acaoSelecionada.alcanceMetros}m).`,
        "erro"
      );
      return;
    }

    const consomeBonus = acaoSelecionada.custo === "bonus";
    if (combateIniciado) {
      if (consomeBonus && !tokenSelecionado.acaoBonusDisponivel) {
        dispararToast("Ação Bônus já usada neste turno.", "erro");
        return;
      }
      if (!consomeBonus && !tokenSelecionado.acaoDisponivel) {
        dispararToast("Ação Principal já usada neste turno.", "erro");
        return;
      }
    }

    let novosTokens = [...tokens];
    let logGerado;

    if (acaoSelecionada.tipo === "cura") {
      const rolagemCura = rolarExpressaoDados(acaoSelecionada.dano, false);
      const curaTotal = Math.max(
        1,
        rolagemCura.total + (acaoSelecionada.bonusDano || 0)
      );
      const novoHp = Math.min(alvoToken.hpMax, alvoToken.hpAtual + curaTotal);
      const curadoReal = novoHp - alvoToken.hpAtual;

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
            morteSucessos: 0,
            morteFalhas: 0,
            ficha: t.ficha ? { ...t.ficha, pontosDeVidaAtuais: novoHp } : t.ficha,
          };
        }
        return atualizado;
      });

      logGerado = registrarEvento(
        "cura",
        `✨ ${tokenSelecionado.nome} curou ${alvoToken.nome} em +${curadoReal} PV (${acaoSelecionada.nome})`
      );

      const alvoAtualizado = novosTokens.find((t) => t.id === alvoToken.id);
      void sincronizarHpNoBanco(alvoAtualizado);
    } else {
      const d1 = rolarDado(20);
      const d2 = rolarDado(20);
      const condAtacante = tokenSelecionado.condicoes || [];
      const condAlvo = alvoToken.condicoes || [];

      const temVantagem =
        modoRolagemD20 === "vantagem" ||
        condAlvo.includes("atordoado") ||
        (condAlvo.includes("caido") && acaoSelecionada.alcanceMetros <= 1.5);
      const temDesvantagem =
        modoRolagemD20 === "desvantagem" ||
        alvoToken.esquivando ||
        condAtacante.includes("envenenado");

      let modoEfetivo = "normal";
      if (temVantagem && !temDesvantagem) modoEfetivo = "vantagem";
      else if (temDesvantagem && !temVantagem) modoEfetivo = "desvantagem";

      const d20 =
        modoEfetivo === "vantagem"
          ? Math.max(d1, d2)
          : modoEfetivo === "desvantagem"
            ? Math.min(d1, d2)
            : d1;

      const bonusBencao = condAtacante.includes("abencoado") ? rolarDado(4) : 0;
      const isCritico = d20 === 20;
      const isFalha = d20 === 1;
      const bonusAtaque = Number(acaoSelecionada.bonusAtaque || 0);
      const totalAtaque = d20 + bonusAtaque + bonusBencao;
      const acertou = isCritico || (!isFalha && totalAtaque >= alvoToken.ca);

      if (acertou) {
        const rolagemDano = rolarExpressaoDados(acaoSelecionada.dano, isCritico);
        const danoTotal = Math.max(
          1,
          rolagemDano.total + Number(acaoSelecionada.bonusDano || 0)
        );
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

        logGerado = registrarEvento(
          "ataque",
          `⚔️ ${tokenSelecionado.nome} → ${alvoToken.nome}: Acerto ${totalAtaque} vs CA ${alvoToken.ca}${
            isCritico ? " (CRÍTICO!)" : ""
          } • ${danoTotal} de dano (${acaoSelecionada.nome})`
        );

        const alvoAtualizado = novosTokens.find((t) => t.id === alvoToken.id);
        void sincronizarHpNoBanco(alvoAtualizado);
      } else {
        novosTokens = novosTokens.map((t) =>
          t.id === tokenSelecionado.id && combateIniciado
            ? {
                ...t,
                acaoDisponivel: consomeBonus ? t.acaoDisponivel : false,
                acaoBonusDisponivel: consomeBonus ? false : t.acaoBonusDisponivel,
              }
            : t
        );

        logGerado = registrarEvento(
          "erro",
          `🛡️ ${tokenSelecionado.nome} errou ${alvoToken.nome} (${totalAtaque} vs CA ${alvoToken.ca})`
        );
      }
    }

    setTokens(novosTokens);
    setFerramenta("mover");
    setAcaoSelecionada(null);
    setSubMenuToken(null);

    if (conexaoSignalR) {
      await conexaoSignalR
        .invoke("ExecutarAcaoCombate", tenantId, {
          tokens: novosTokens,
          log: logGerado,
        })
        .catch(() => {});
    }

    await transmitirEstadoGeral({
      tokens: novosTokens,
      logsCombate: logGerado
        ? [logGerado, ...logsCombate.slice(0, 48)]
        : logsCombate,
    });
  };

  // === STATUS, VISIBILIDADE E REMOÇÃO ===
  const alternarCondicaoToken = async (condId) => {
    if (!tokenSelecionado) return;
    const atuais = tokenSelecionado.condicoes || [];
    const novas = atuais.includes(condId)
      ? atuais.filter((c) => c !== condId)
      : [...atuais, condId];

    const novosTokens = tokens.map((t) =>
      t.id === tokenSelecionado.id ? { ...t, condicoes: novas } : t
    );
    setTokens(novosTokens);
    await transmitirEstadoGeral({ tokens: novosTokens });
  };

  const alternarVisibilidadeToken = async () => {
    if (!isMestre || !tokenSelecionado) return;
    const novoOculto = !tokenSelecionado.oculto;
    const novosTokens = tokens.map((t) =>
      t.id === tokenSelecionado.id ? { ...t, oculto: novoOculto } : t
    );
    setTokens(novosTokens);
    dispararToast(
      novoOculto
        ? `${tokenSelecionado.nome} ocultado dos jogadores`
        : `${tokenSelecionado.nome} revelado no mapa`
    );
    await transmitirEstadoGeral({ tokens: novosTokens });
  };

  const removerToken = async (tokenId) => {
    const filtrados = tokens.filter((t) => t.id !== tokenId);
    setTokens(filtrados);
    if (tokenSelecionadoId === tokenId) {
      setTokenSelecionadoId(null);
      setSubMenuToken(null);
    }
    await transmitirEstadoGeral({ tokens: filtrados });
  };

  // === CONTROLE DE TURNOS OPCIONAL ===
  const iniciarTurnos = async () => {
    if (tokens.length === 0) {
      setPainelAberto("dock");
      dispararToast("Adicione personagens ao mapa primeiro.");
      return;
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
    setPainelAberto(null);

    const log = registrarEvento(
      "sistema",
      `⚔️ Ordem de turnos iniciada! Vez de ${ordenados[0].nome}`
    );

    await transmitirEstadoGeral({
      tokens: ordenados,
      turnoIndex: 0,
      rodada: 1,
      combateIniciado: true,
      logsCombate: [log, ...logsCombate.slice(0, 48)],
    });
  };

  const proximoTurno = async () => {
    if (tokens.length === 0) return;
    const proximoIdx = (turnoIndex + 1) % tokens.length;
    const novaRodada = proximoIdx === 0 ? rodada + 1 : rodada;
    const tokenAtivo = tokens[proximoIdx];

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
    setTokenSelecionadoId(tokenAtivo.id);
    setFerramenta("mover");
    setAcaoSelecionada(null);

    dispararToast(`Rodada ${novaRodada} • Vez de ${tokenAtivo.nome}`);

    await transmitirEstadoGeral({
      tokens: novosTokens,
      turnoIndex: proximoIdx,
      rodada: novaRodada,
    });
  };

  const encerrarTurnos = async () => {
    setCombateIniciado(false);
    setPainelAberto(null);
    dispararToast("Movimentação livre ativada.");
    await transmitirEstadoGeral({ combateIniciado: false });
  };

  const realizarDescansoLongo = async () => {
    if (!isMestre) return;
    await api.post(`/characters/mesa/${tenantId}/descanso-longo`).catch(() => {});
    const novosTokens = tokens.map((t) => {
      if (t.faccao !== "heroi") return t;
      const curado = {
        ...t,
        hpAtual: t.hpMax,
        condicoes: [],
        morteSucessos: 0,
        morteFalhas: 0,
        movimentoRestante: t.deslocamentoMax,
        acaoDisponivel: true,
        acaoBonusDisponivel: true,
      };
      void sincronizarHpNoBanco(curado);
      return curado;
    });
    setTokens(novosTokens);
    setPainelAberto(null);
    dispararToast("Descanso Longo: PV dos heróis restaurados!", "sucesso");
    await transmitirEstadoGeral({ tokens: novosTokens });
  };

  // === ROLADOR DE DADOS FLUTUANTE ===
  const fichaSelecionadaDados = fichasMesa.find(
    (f) => String(f.id) === String(fichaRolagemId)
  );

  const publicarRolagemLocal = async (pacote) => {
    setRolagensSala((prev) => [
      pacote,
      ...prev.filter((r) => r.id !== pacote.id).slice(0, 29),
    ]);
    const texto = `🎲 ${pacote.autor}: ${pacote.titulo} → ${pacote.total} ${pacote.detalhe || ""}`;
    dispararToast(
      texto,
      pacote.critico ? "sucesso" : pacote.falha ? "erro" : "dado"
    );
    if (conexaoSignalR) {
      await conexaoSignalR
        .invoke("EnviarRolagemStorytelling", tenantId, pacote)
        .catch(() => {});
    }
  };

  const rolarDadoBandeja = async (faces) => {
    const autor =
      fichaSelecionadaDados?.nome ||
      (isMestre ? "Mestre" : usuarioLogado?.nome || "Jogador");

    if (faces === 20 && modoRolagemD20 !== "normal") {
      const d1 = rolarDado(20);
      const d2 = rolarDado(20);
      const escolhido =
        modoRolagemD20 === "vantagem" ? Math.max(d1, d2) : Math.min(d1, d2);
      const pacote = {
        id: gerarIdUnico("dado"),
        autor,
        titulo: `d20 (${modoRolagemD20})`,
        detalhe: `[${d1}, ${d2}]`,
        total: escolhido,
        critico: escolhido === 20,
        falha: escolhido === 1,
        horario: horarioCurto(),
      };
      await publicarRolagemLocal(pacote);
      return;
    }

    const valor = rolarDado(faces);
    const pacote = {
      id: gerarIdUnico("dado"),
      autor,
      titulo: `d${faces}`,
      detalhe: "",
      total: valor,
      critico: faces === 20 && valor === 20,
      falha: faces === 20 && valor === 1,
      horario: horarioCurto(),
    };
    await publicarRolagemLocal(pacote);
  };

  const rolarPericiaRapida = async (pericia) => {
    const autor =
      fichaSelecionadaDados?.nome ||
      (isMestre ? "Mestre" : usuarioLogado?.nome || "Jogador");
    const valExplicito = Number(fichaSelecionadaDados?.[pericia.key] ?? 0);
    const modAttr = calcularModificador(fichaSelecionadaDados?.[pericia.attr] ?? 10);
    const bonus = valExplicito !== 0 ? valExplicito : modAttr;

    const d1 = rolarDado(20);
    const d2 = rolarDado(20);
    const d20 =
      modoRolagemD20 === "vantagem"
        ? Math.max(d1, d2)
        : modoRolagemD20 === "desvantagem"
          ? Math.min(d1, d2)
          : d1;

    const total = d20 + bonus;
    const sinal = bonus >= 0 ? `+${bonus}` : `${bonus}`;
    const pacote = {
      id: gerarIdUnico("dado"),
      autor,
      titulo: pericia.label,
      detalhe: `(${d20}${sinal})`,
      total,
      critico: d20 === 20,
      falha: d20 === 1,
      horario: horarioCurto(),
    };
    await publicarRolagemLocal(pacote);
  };

  // === CLIQUE E INTERAÇÃO NAS CÉLULAS DO MAPA ===
  const handleCellClick = async (x, y) => {
    // 1. Ferramenta Régua (Medir distância)
    if (ferramenta === "medir") {
      if (!reguaInicio || (reguaInicio && reguaFim.fixado)) {
        setReguaInicio({ x, y });
        setReguaFim({ x, y, fixado: false });
      } else {
        setReguaFim({ x, y, fixado: true });
      }
      return;
    }

    // 2. Ferramenta Objetos / Props (Mestre)
    if (isMestre && ferramenta === "objetos") {
      let novosProps = [...(cenarioAtual.props || [])];
      if (modoBorrachaProp) {
        novosProps = novosProps.filter((p) => !(p.x === x && p.y === y));
      } else if (propSelecionado) {
        novosProps = novosProps.filter((p) => !(p.x === x && p.y === y));
        novosProps.push({
          id: `${gerarIdUnico("prop")}-${x}-${y}`,
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
        await conexaoSignalR
          .invoke("AtualizarCenarioBatalha", tenantId, novoCenario)
          .catch(() => {});
      }
      await transmitirEstadoGeral({ cenarioAtual: novoCenario });
      return;
    }

    // 3. Posicionamento de ficha escolhida na bandeja inferior
    if (ferramenta === "posicionar" && fichaParaPosicionar) {
      await posicionarFichaNaCelula(fichaParaPosicionar, x, y);
      return;
    }

    const tokenNoLocal = tokenNaCelula(x, y);

    // 4. Escolha de alvo para ação selecionada
    if (ferramenta === "alvo" && acaoSelecionada) {
      if (tokenNoLocal) {
        await executarAcaoNoAlvo(tokenNoLocal);
      } else {
        setFerramenta("mover");
        setAcaoSelecionada(null);
      }
      return;
    }

    // 5. Seleção ou Movimentação padrão
    if (tokenNoLocal) {
      if (tokenSelecionadoId === tokenNoLocal.id) {
        setTokenSelecionadoId(null);
        setSubMenuToken(null);
      } else {
        setTokenSelecionadoId(tokenNoLocal.id);
        setSubMenuToken(null);
      }
      return;
    }

    if (tokenSelecionado && ferramenta === "mover") {
      await moverTokenParaCelula(tokenSelecionado, x, y);
    }
  };

  const handleDropNaCelula = async (e, x, y) => {
    e.preventDefault();
    if (!arrastandoItem) return;
    if (arrastandoItem.tipo === "token") {
      const tok = tokens.find((t) => t.id === arrastandoItem.id);
      if (tok) {
        setTokenSelecionadoId(tok.id);
        await moverTokenParaCelula(tok, x, y);
      }
    } else if (arrastandoItem.tipo === "ficha") {
      await posicionarFichaNaCelula(arrastandoItem.ficha, x, y);
    }
    setArrastandoItem(null);
  };

  const handleWheelCanvas = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 6 : -6;
      setTamanhoCelula((prev) => Math.max(28, Math.min(84, prev + delta)));
    }
  };

  const copiarCodigoSala = async () => {
    const codigo = mesaInfo?.codigoConvite || tenantId;
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 1800);
      dispararToast(`Código #${codigo} copiado!`);
    } catch {
      // ignora
    }
  };

  const fichasPendentesCount = isMestre
    ? fichasMesa.filter((f) => f.status === 0).length
    : 0;
  const notificacoesGrupo = solicitacoes.length + fichasPendentesCount;

  const temaVisual = TEMAS_TABULEIRO[cenarioAtual.tema] || TEMAS_TABULEIRO.masmorra;
  const zoomPercent = Math.round((tamanhoCelula / CELL_BASE) * 100);

  // Histórico unificado (rolagens de dados + eventos do mapa)
  const historicoRecente = useMemo(() => {
    const itensDados = rolagensSala.map((r) => ({
      id: r.id,
      horario: r.horario,
      texto: `🎲 ${r.autor}: ${r.titulo} = ${r.total} ${r.detalhe || ""}`,
    }));
    const itensCombate = logsCombate.map((l) => ({
      id: l.id,
      horario: l.horario,
      texto: l.texto,
    }));
    return [...itensDados, ...itensCombate].slice(0, 25);
  }, [rolagensSala, logsCombate]);

  return (
    <div
      onWheel={handleWheelCanvas}
      className="w-screen h-[100dvh] owlbear-canvas-bg text-zinc-100 relative overflow-hidden select-none flex flex-col"
    >
      <FichaModal
        isOpen={fichaModalAberta}
        onClose={() => setFichaModalAberta(false)}
        fichaId={fichaModalDados.id}
        fichaObjeto={fichaModalDados.objeto}
      />

      {/* =================================================================== */}
      {/* 1. CANVAS EM TELA CHEIA (ESTILO OWLBEAR RODEO)                      */}
      {/* =================================================================== */}
      <div
        onClick={() => {
          if (painelAberto && painelAberto !== "dock") setPainelAberto(null);
        }}
        className="flex-1 w-full h-full overflow-auto custom-scrollbar flex items-center justify-center p-10 sm:p-20"
      >
        <div
          className={`relative rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.75)] border border-white/10 overflow-hidden shrink-0 transition-all ${
            cenarioAtual.fundoUrl ? "bg-zinc-950" : temaVisual.bgGrid
          }`}
          style={{
            backgroundImage: cenarioAtual.fundoUrl
              ? `url(${cenarioAtual.fundoUrl})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Camada SVG da Régua (Medidor de Distância Owlbear) */}
          {ferramenta === "medir" && reguaInicio && reguaFim && (
            <svg
              className="absolute inset-0 z-30 pointer-events-none"
              width={cenarioAtual.largura * tamanhoCelula}
              height={cenarioAtual.altura * tamanhoCelula}
            >
              <line
                x1={reguaInicio.x * tamanhoCelula + tamanhoCelula / 2}
                y1={reguaInicio.y * tamanhoCelula + tamanhoCelula / 2}
                x2={reguaFim.x * tamanhoCelula + tamanhoCelula / 2}
                y2={reguaFim.y * tamanhoCelula + tamanhoCelula / 2}
                stroke="#818cf8"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
              <circle
                cx={reguaInicio.x * tamanhoCelula + tamanhoCelula / 2}
                cy={reguaInicio.y * tamanhoCelula + tamanhoCelula / 2}
                r="5"
                fill="#818cf8"
              />
              <circle
                cx={reguaFim.x * tamanhoCelula + tamanhoCelula / 2}
                cy={reguaFim.y * tamanhoCelula + tamanhoCelula / 2}
                r="6"
                fill="#ffffff"
                stroke="#6366f1"
                strokeWidth="2.5"
              />
            </svg>
          )}

          {/* Etiqueta flutuante da distância medida na Régua */}
          {ferramenta === "medir" && reguaInicio && reguaFim && (
            <div
              className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-lg whitespace-nowrap"
              style={{
                left: `${reguaFim.x * tamanhoCelula + tamanhoCelula / 2}px`,
                top: `${Math.max(24, reguaFim.y * tamanhoCelula - 6)}px`,
              }}
            >
              {calcularDistanciaMetros(
                reguaInicio.x,
                reguaInicio.y,
                reguaFim.x,
                reguaFim.y
              )}
              m (
              {calcularQuadradosDistancia(
                reguaInicio.x,
                reguaInicio.y,
                reguaFim.x,
                reguaFim.y
              )}
              q)
            </div>
          )}

          {/* Grade de Células */}
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
                const isSel = tok && tok.id === tokenSelecionadoId;
                const isVez = tok && tokenDoTurno && tok.id === tokenDoTurno.id;

                // Destaque suave apenas quando necessário (sem poluir o mapa!)
                let dentroAlcanceAcao = false;
                if (
                  ferramenta === "alvo" &&
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

                let alcanceTurno = false;
                if (
                  combateIniciado &&
                  ferramenta === "mover" &&
                  tokenSelecionado &&
                  podeControlarToken(tokenSelecionado) &&
                  !tok
                ) {
                  const custo = custoMovimentoParaCelula(
                    tokenSelecionado.x,
                    tokenSelecionado.y,
                    x,
                    y
                  );
                  alcanceTurno =
                    custo > 0 && custo <= tokenSelecionado.movimentoRestante;
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => void handleCellClick(x, y)}
                    onMouseEnter={() => {
                      if (
                        ferramenta === "medir" &&
                        reguaInicio &&
                        !reguaFim?.fixado
                      ) {
                        setReguaFim({ x, y, fixado: false });
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => void handleDropNaCelula(e, x, y)}
                    className={`relative flex items-center justify-center transition-colors ${
                      cenarioAtual.mostrarGrade
                        ? "border border-white/[0.08]"
                        : "border border-transparent"
                    } ${
                      ferramenta === "posicionar" || ferramenta === "objetos"
                        ? "cursor-crosshair hover:bg-indigo-500/20"
                        : "cursor-pointer hover:bg-white/[0.04]"
                    } ${
                      dentroAlcanceAcao
                        ? acaoSelecionada?.tipo === "cura"
                          ? "bg-emerald-500/20"
                          : "bg-red-500/20"
                        : alcanceTurno
                          ? "bg-indigo-500/10"
                          : ""
                    }`}
                  >
                    {/* Objeto / Prop de Cenário */}
                    {prop && (
                      <div
                        title={prop.nome}
                        className="w-4/5 h-4/5 rounded-lg bg-black/35 backdrop-blur-[1px] border border-white/10 flex items-center justify-center text-base pointer-events-none"
                      >
                        <span>{prop.icone}</span>
                      </div>
                    )}

                    {/* Token Circular Limpo Estilo Owlbear Rodeo */}
                    {tok && (
                      <div
                        draggable={podeControlarToken(tok)}
                        onDragStart={() =>
                          setArrastandoItem({ tipo: "token", id: tok.id })
                        }
                        onDragEnd={() => setArrastandoItem(null)}
                        className={`relative z-20 w-[84%] h-[84%] rounded-full flex items-center justify-center shadow-lg transition-transform ${
                          podeControlarToken(tok)
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-pointer"
                        } ${
                          tok.faccao === "inimigo"
                            ? "bg-zinc-900 border-[2.5px] border-rose-500 text-white"
                            : tok.faccao === "neutro"
                              ? "bg-zinc-900 border-[2.5px] border-amber-400 text-white"
                              : "bg-zinc-900 border-[2.5px] border-emerald-400 text-white"
                        } ${
                          isSel
                            ? "scale-110 ring-2 ring-indigo-400 shadow-[0_0_18px_rgba(129,140,248,0.65)]"
                            : ""
                        } ${isVez ? "ring-2 ring-amber-400" : ""} ${
                          tok.hpAtual <= 0 ? "grayscale opacity-55" : ""
                        } ${tok.oculto ? "opacity-55 border-dashed" : ""}`}
                      >
                        <span className="text-base leading-none">
                          {tok.hpAtual <= 0 ? "💀" : tok.icone}
                        </span>

                        {/* Barra de vida minimalista discreta apenas se ferido ou selecionado */}
                        {(isSel || tok.hpAtual < tok.hpMax) && (
                          <div className="absolute -top-1.5 w-4/5 h-1 bg-zinc-950/90 rounded-full overflow-hidden border border-white/10">
                            <div
                              className={`h-full transition-all ${
                                tok.hpAtual <= tok.hpMax * 0.3
                                  ? "bg-rose-500"
                                  : "bg-emerald-400"
                              }`}
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(100, (tok.hpAtual / tok.hpMax) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        )}

                        {/* Rótulo de nome limpo estilo Owlbear abaixo do token */}
                        {tamanhoCelula >= 36 && (
                          <span className="absolute -bottom-2 px-1.5 py-0.2 rounded-full bg-zinc-950/90 border border-white/10 text-[8px] font-semibold text-zinc-200 max-w-[54px] truncate pointer-events-none shadow">
                            {tok.nome.split(" ")[0]}
                          </span>
                        )}

                        {/* Indicadores sutis de status/oculto */}
                        {(tok.oculto || (tok.condicoes || []).length > 0) && (
                          <div className="absolute -top-1 -right-1 flex">
                            {tok.oculto && (
                              <span className="text-[9px] bg-zinc-900 rounded-full px-0.5 border border-white/15">
                                👁️‍🗨️
                              </span>
                            )}
                            {(tok.condicoes || []).slice(0, 1).map((cid) => {
                              const cObj = CONDICOES_DND.find((c) => c.id === cid);
                              return cObj ? (
                                <span
                                  key={cid}
                                  className="text-[9px] bg-zinc-900 rounded-full px-0.5 border border-white/15"
                                >
                                  {cObj.icone}
                                </span>
                              ) : null;
                            })}
                          </div>
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

      {/* =================================================================== */}
      {/* 2. ILHA SUPERIOR ESQUERDA: SALA, CONVITE E GRUPO                    */}
      {/* =================================================================== */}
      <div className="fixed top-3 left-3 z-40 flex items-center gap-1.5">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
          <button
            onClick={() => navigate("/lobby")}
            title="Voltar para Suas Salas"
            className="w-8 h-8 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ←
          </button>

          <button
            onClick={() => void copiarCodigoSala()}
            title="Clique para copiar o código de convite da sala"
            className="px-2.5 py-1 rounded-xl hover:bg-zinc-800 text-left transition-colors hidden sm:flex items-center gap-2"
          >
            <span className="text-xs font-semibold text-white max-w-[130px] truncate">
              {mesaInfo?.nome || "Sala"}
            </span>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded-md">
              {codigoCopiado
                ? "Copiado!"
                : `#${mesaInfo?.codigoConvite || tenantId}`}
            </span>
          </button>

          <button
            onClick={() =>
              setPainelAberto(painelAberto === "grupo" ? null : "grupo")
            }
            title="Jogadores e Fichas da Sala"
            className={`relative px-2.5 h-8 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              painelAberto === "grupo"
                ? "bg-indigo-600 text-white"
                : "hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            <span>👥</span>
            <span className="hidden md:inline">Grupo</span>
            {notificacoesGrupo > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                {notificacoesGrupo}
              </span>
            )}
          </button>
        </div>

        {/* Popover de Grupo / Admissão de Jogadores (Estilo Owlbear Rodeo!) */}
        {painelAberto === "grupo" && (
          <div className="absolute top-12 left-0 w-72 sm:w-80 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-white">
                  {mesaInfo?.nome || "Sala Atual"}
                </h4>
                <button
                  onClick={() => void copiarCodigoSala()}
                  className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300"
                >
                  Convite: #{mesaInfo?.codigoConvite || tenantId} (copiar)
                </button>
              </div>
              <button
                onClick={() => setPainelAberto(null)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Pedidos de entrada na sala */}
            {isMestre && solicitacoes.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase text-amber-400">
                  Pedindo para entrar ({solicitacoes.length})
                </span>
                {solicitacoes.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-zinc-950/80 border border-white/10 px-3 py-2 rounded-xl text-xs"
                  >
                    <span className="font-medium text-white truncate pr-2">
                      {s.nomeJogador}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => onAvaliarSolicitacao?.(s.id, false)}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => onAvaliarSolicitacao?.(s.id, true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                      >
                        Aceitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fichas aguardando aprovação */}
            {isMestre && fichasPendentesCount > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase text-indigo-300">
                  Fichas pendentes ({fichasPendentesCount})
                </span>
                {fichasMesa
                  .filter((f) => f.status === 0)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between bg-zinc-950/80 border border-white/10 px-3 py-2 rounded-xl text-xs"
                    >
                      <span className="truncate pr-2 text-zinc-200">
                        {f.nome} ({f.classe})
                      </span>
                      <button
                        onClick={() => void aprovarFichaRapido(f.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shrink-0"
                      >
                        Aprovar
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => navigate("/criar-ficha")}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                + Nova Ficha
              </button>
              <button
                onClick={() => navigate("/campanha")}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Ver Todas Fichas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 3. ILHA SUPERIOR CENTRAL: BARRA DE FERRAMENTAS OWLBEAR RODEO        */}
      {/* =================================================================== */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
          {/* Ferramenta Mover / Selecionar */}
          <button
            onClick={() => {
              setFerramenta("mover");
              setAcaoSelecionada(null);
              setFichaParaPosicionar(null);
              setReguaInicio(null);
              setReguaFim(null);
            }}
            title="Selecionar e Mover (Arraste tokens pelo mapa)"
            className={`px-3 h-8 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              ferramenta === "mover"
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 2l16 11-7 1.5 4 6.5-2.5 1.5-4-6.5L5 21V2z" />
            </svg>
            <span className="hidden sm:inline">Mover</span>
          </button>

          {/* Ferramenta Régua / Medir */}
          <button
            onClick={() => {
              const nova = ferramenta === "medir" ? "mover" : "medir";
              setFerramenta(nova);
              setReguaInicio(null);
              setReguaFim(null);
            }}
            title="Medir distância no mapa"
            className={`px-3 h-8 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              ferramenta === "medir"
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" />
              <path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2" />
            </svg>
            <span className="hidden sm:inline">Medir</span>
          </button>

          {/* Alternar Grade (Cena limpa vs Tabuleiro quadriculado) */}
          <button
            onClick={() => void alternarGrade()}
            title="Mostrar ou ocultar grade quadriculada"
            className={`px-3 h-8 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              cenarioAtual.mostrarGrade
                ? "bg-zinc-800 text-indigo-300 border border-indigo-500/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <span className="font-mono font-bold text-sm leading-none">#</span>
            <span className="hidden sm:inline">Grade</span>
          </button>

          {/* Cenas & Áudio (Mestre) */}
          {isMestre && (
            <>
              <div className="w-px h-5 bg-white/10 mx-0.5" />
              <button
                onClick={() =>
                  setPainelAberto(painelAberto === "cenas" ? null : "cenas")
                }
                title="Trocar mapa, imagem de fundo ou música"
                className={`px-3 h-8 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  painelAberto === "cenas"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span>🗺️</span>
                <span className="hidden sm:inline">Cenas</span>
                {audioAtivo && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => {
                  const nova = ferramenta === "objetos" ? "mover" : "objetos";
                  setFerramenta(nova);
                  if (nova === "objetos") setPainelAberto(null);
                }}
                title="Colocar ou apagar objetos no cenário"
                className={`px-3 h-8 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  ferramenta === "objetos"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span>🧱</span>
                <span className="hidden sm:inline">Objetos</span>
              </button>
            </>
          )}
        </div>

        {/* Sub-barra compacta quando uma ferramenta contextual está ativa */}
        {ferramenta === "posicionar" && fichaParaPosicionar && (
          <div className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2">
            <span>
              Clique em um quadrado para colocar{" "}
              <strong>{fichaParaPosicionar.nome}</strong>
            </span>
            <button
              onClick={() => {
                setFerramenta("mover");
                setFichaParaPosicionar(null);
              }}
              className="bg-black/25 hover:bg-black/40 px-2 py-0.5 rounded-full text-[11px]"
            >
              Cancelar
            </button>
          </div>
        )}

        {ferramenta === "alvo" && acaoSelecionada && (
          <div className="bg-zinc-900/95 border border-indigo-500/40 text-zinc-100 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2">
            <span>
              {acaoSelecionada.icone} Escolha o alvo de{" "}
              <strong>{acaoSelecionada.nome}</strong> (até{" "}
              {acaoSelecionada.alcanceMetros}m)
            </span>
            <button
              onClick={() => {
                setFerramenta("mover");
                setAcaoSelecionada(null);
              }}
              className="bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded-full text-[11px]"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Paleta Flutuante Enxuta de Objetos de Cenário */}
        {isMestre && ferramenta === "objetos" && (
          <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1 max-w-[92vw] overflow-x-auto custom-scrollbar">
            {PROPS_CATALOGO.map((p) => {
              const ativo = !modoBorrachaProp && propSelecionado?.tipo === p.tipo;
              return (
                <button
                  key={p.tipo}
                  onClick={() => {
                    setPropSelecionado(p);
                    setModoBorrachaProp(false);
                  }}
                  title={p.nome}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 transition-colors ${
                    ativo
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {p.icone}
                </button>
              );
            })}
            <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />
            <button
              onClick={() => setModoBorrachaProp(!modoBorrachaProp)}
              title="Borracha (clique nos objetos para apagar)"
              className={`px-2.5 h-8 rounded-xl text-xs font-medium shrink-0 ${
                modoBorrachaProp
                  ? "bg-rose-600 text-white"
                  : "hover:bg-zinc-800 text-zinc-400"
              }`}
            >
              Apagar
            </button>
          </div>
        )}

        {/* Popover de Cenas & Áudio (Unifica Storytelling + Mapas sem poluir a tela!) */}
        {isMestre && painelAberto === "cenas" && (
          <div className="w-80 sm:w-96 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setAbaCenas("mapas")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    abaCenas === "mapas"
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Mapas & Cenas
                </button>
                <button
                  onClick={() => setAbaCenas("audio")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    abaCenas === "audio"
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Música
                </button>
              </div>

              <label className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer transition-colors">
                {uploadingMidia ? "Enviando..." : "+ Enviar Arquivo"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,audio/*"
                  disabled={uploadingMidia}
                  onChange={async (e) => {
                    const arq = e.target.files?.[0];
                    if (!arq || !onUploadMidia) return;
                    await onUploadMidia(arq);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {abaCenas === "mapas" ? (
              <div className="space-y-3">
                {/* Imagens enviadas pelo Mestre */}
                {midias.filter((m) => m.tipo === 0).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase text-zinc-500">
                      Suas Imagens Enviadas
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                      {midias
                        .filter((m) => m.tipo === 0)
                        .map((m) => (
                          <div
                            key={m.id}
                            className="group relative flex items-center gap-2 bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 p-1.5 rounded-xl cursor-pointer"
                            onClick={() =>
                              void definirImagemDeFundo(
                                m.caminhoServidor,
                                m.nomeArquivo
                              )
                            }
                          >
                            <img
                              src={m.caminhoServidor}
                              alt={m.nomeArquivo}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                            <span className="text-[11px] text-zinc-200 truncate flex-1">
                              {m.nomeArquivo}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void onExcluirMidia?.(m.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 px-1 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Mapas Prontos & Salvos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase text-zinc-500">
                    Mapas Prontos
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {[...CENARIOS_PADROES, ...cenariosSalvos].map((cen) => (
                      <button
                        key={cen.id}
                        onClick={() => void aplicarCenario(cen)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          cenarioAtual.nome === cen.nome && !cenarioAtual.fundoUrl
                            ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 font-semibold"
                            : "bg-zinc-950/70 hover:bg-zinc-800 border border-white/5 text-zinc-300"
                        }`}
                      >
                        <span className="truncate">{cen.nome}</span>
                        <span className="text-[10px] text-zinc-500 capitalize">
                          {cen.tema}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salvar layout atual */}
                <div className="flex gap-1.5 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={nomeNovoCenario}
                    onChange={(e) => setNomeNovoCenario(e.target.value)}
                    placeholder="Nome para salvar cena atual..."
                    className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={() => void salvarCenarioAtual()}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {midias.filter((m) => m.tipo === 2).length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">
                    Nenhuma música enviada. Clique em &quot;+ Enviar Arquivo&quot; para adicionar um áudio MP3.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                    {midias
                      .filter((m) => m.tipo === 2)
                      .map((m) => {
                        const tocando = audioAtivo === m.caminhoServidor;
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between bg-zinc-950/80 border border-white/10 px-3 py-2 rounded-xl text-xs"
                          >
                            <button
                              onClick={() => onTocarMusica?.(m.caminhoServidor)}
                              className={`flex items-center gap-2 truncate flex-1 text-left font-medium ${
                                tocando ? "text-emerald-400" : "text-zinc-300"
                              }`}
                            >
                              <span>{tocando ? "⏸" : "▶"}</span>
                              <span className="truncate">{m.nomeArquivo}</span>
                            </button>
                            <button
                              onClick={() => void onExcluirMidia?.(m.id)}
                              className="text-zinc-500 hover:text-rose-400 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}

                {audioAtivo && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <span className="text-[11px] text-zinc-400">Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) =>
                        onAlterarVolume?.(parseFloat(e.target.value))
                      }
                      className="flex-1 h-1 bg-zinc-700 rounded-lg accent-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. ILHA SUPERIOR DIREITA: ORDEM DE TURNOS (DISCRETA E OPCIONAL)     */}
      {/* =================================================================== */}
      <div className="fixed top-3 right-3 z-40 flex items-center gap-1.5">
        {!combateIniciado ? (
          isMestre && (
            <button
              onClick={() => void iniciarTurnos()}
              title="Iniciar ordem de iniciativa por turnos"
              className="bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-md border border-white/10 rounded-2xl px-3.5 h-11 text-xs font-medium text-zinc-300 hover:text-white shadow-2xl flex items-center gap-1.5 transition-colors"
            >
              <span>⚔️</span>
              <span className="hidden sm:inline">Turnos</span>
            </button>
          )
        ) : (
          <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-amber-400 px-2 hidden sm:inline">
              R{rodada}
            </span>

            {/* Mini avatares de iniciativa */}
            <div className="flex items-center gap-1 max-w-[140px] sm:max-w-[220px] overflow-x-auto custom-scrollbar">
              {tokensVisiveis.map((t) => {
                const ativo = tokenDoTurno?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTokenSelecionadoId(t.id)}
                    title={`${t.nome} (Iniciativa ${t.iniciativa})`}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border transition-all ${
                      ativo
                        ? "bg-amber-500/25 border-amber-400 scale-105"
                        : "bg-zinc-950 border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {t.icone}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => void proximoTurno()}
              title="Avançar para o próximo turno"
              className="px-2.5 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Próximo →
            </button>

            {isMestre && (
              <div className="relative">
                <button
                  onClick={() =>
                    setPainelAberto(
                      painelAberto === "turnosMenu" ? null : "turnosMenu"
                    )
                  }
                  className="w-8 h-8 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white text-sm"
                >
                  ⋯
                </button>
                {painelAberto === "turnosMenu" && (
                  <div className="absolute right-0 top-10 w-44 bg-zinc-900 border border-white/10 rounded-2xl p-1.5 shadow-2xl space-y-1">
                    <button
                      onClick={() => void iniciarTurnos()}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-800 text-xs text-zinc-200"
                    >
                      🎲 Rerrolar Iniciativa
                    </button>
                    <button
                      onClick={() => void realizarDescansoLongo()}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-800 text-xs text-zinc-200"
                    >
                      🌙 Descanso Longo
                    </button>
                    <button
                      onClick={() => void encerrarTurnos()}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/15 text-xs text-rose-300"
                    >
                      ✕ Encerrar Turnos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 5. CANTO INFERIOR ESQUERDO: BANDEJA DE DADOS + TOASTS EFÊMEROS      */}
      {/* =================================================================== */}
      <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
        {/* Toasts efêmeros limpos (somem sozinhos sem poluir a tela!) */}
        {toastsVisiveis.length > 0 && (
          <div className="space-y-1.5 pointer-events-none max-w-xs sm:max-w-sm">
            {toastsVisiveis.map((t) => (
              <div
                key={t.id}
                className={`px-3.5 py-2 rounded-2xl backdrop-blur-md border shadow-xl text-xs font-medium ${
                  t.variante === "sucesso"
                    ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100"
                    : t.variante === "erro"
                      ? "bg-rose-950/90 border-rose-500/40 text-rose-100"
                      : "bg-zinc-900/95 border-white/10 text-zinc-100"
                }`}
              >
                {t.texto}
              </div>
            ))}
          </div>
        )}

        {/* Popover de Histórico (só aparece quando clicado) */}
        {painelAberto === "historico" && (
          <div className="w-72 sm:w-80 max-h-64 overflow-y-auto custom-scrollbar bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl space-y-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <span className="text-[11px] font-semibold text-zinc-400">
                Histórico Recente
              </span>
              <button
                onClick={() => setPainelAberto(null)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            {historicoRecente.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                Nenhuma rolagem ainda.
              </p>
            ) : (
              historicoRecente.map((item) => (
                <div
                  key={item.id}
                  className="text-[11px] text-zinc-300 bg-zinc-950/60 px-2.5 py-1.5 rounded-xl border border-white/5"
                >
                  {item.horario && (
                    <span className="text-[10px] text-zinc-500 mr-1.5 font-mono">
                      {item.horario}
                    </span>
                  )}
                  <span>{item.texto}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bandeja de Dados Estilo Owlbear Rodeo */}
        {painelAberto === "dados" && (
          <div className="w-72 sm:w-80 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-2xl space-y-3">
            <div className="grid grid-cols-7 gap-1">
              {[4, 6, 8, 10, 12, 20, 100].map((faces) => (
                <button
                  key={faces}
                  onClick={() => void rolarDadoBandeja(faces)}
                  className="py-2 rounded-xl bg-zinc-950 hover:bg-indigo-600 text-zinc-200 hover:text-white border border-white/10 text-xs font-bold font-mono transition-colors"
                >
                  d{faces}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
              {[
                { id: "desvantagem", label: "Desv." },
                { id: "normal", label: "Normal" },
                { id: "vantagem", label: "Vant." },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModoRolagemD20(m.id)}
                  className={`py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    modoRolagemD20 === m.id
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {fichasMesa.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-white/5">
                <select
                  value={fichaRolagemId}
                  onChange={(e) => setFichaRolagemId(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200"
                >
                  {fichasMesa.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-1">
                  {PERICIAS_RAPIDAS.map((per) => (
                    <button
                      key={per.key}
                      onClick={() => void rolarPericiaRapida(per)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 text-[11px] text-zinc-300 text-left truncate transition-colors"
                    >
                      {per.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              setPainelAberto(painelAberto === "dados" ? null : "dados")
            }
            title="Abrir Bandeja de Dados"
            className={`h-11 px-3.5 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              painelAberto === "dados"
                ? "bg-indigo-600 border-indigo-400 text-white"
                : "bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-200"
            }`}
          >
            <span className="text-base">🎲</span>
            <span className="hidden sm:inline">Dados</span>
          </button>

          {historicoRecente.length > 0 && (
            <button
              onClick={() =>
                setPainelAberto(
                  painelAberto === "historico" ? null : "historico"
                )
              }
              title="Ver histórico de rolagens"
              className={`w-11 h-11 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center justify-center text-xs transition-colors ${
                painelAberto === "historico"
                  ? "bg-indigo-600 border-indigo-400 text-white"
                  : "bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              📜
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 6. CENTRO INFERIOR: MENU CONTEXTUAL DO TOKEN + DOCK DE PERSONAGENS  */}
      {/* =================================================================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 max-w-[92vw]">
        {/* Sub-menus do Token Selecionado (Ações da Ficha ou Condições) */}
        {tokenSelecionado && subMenuToken === "acoes" && (
          <div className="w-72 sm:w-80 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-white/5">
              <span className="text-[11px] font-semibold text-zinc-400">
                Ações de {tokenSelecionado.nome}
              </span>
              <button
                onClick={() => setSubMenuToken(null)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            {acoesDisponiveis.map((acao) => (
              <button
                key={acao.id}
                onClick={() => {
                  setAcaoSelecionada(acao);
                  setFerramenta("alvo");
                  setSubMenuToken(null);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-zinc-950/80 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/40 flex items-center justify-between gap-2 transition-colors"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block truncate">
                    {acao.icone} {acao.nome}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Alcance {acao.alcanceMetros}m
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-bold shrink-0 ${
                    acao.tipo === "cura" ? "text-emerald-400" : "text-indigo-300"
                  }`}
                >
                  {acao.tipo === "cura" ? `+${acao.dano}` : acao.dano}
                </span>
              </button>
            ))}
          </div>
        )}

        {tokenSelecionado && subMenuToken === "status" && (
          <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-wrap items-center gap-1">
            {CONDICOES_DND.map((c) => {
              const ativa = (tokenSelecionado.condicoes || []).includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => void alternarCondicaoToken(c.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    ativa
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-950 text-zinc-400 hover:text-white"
                  }`}
                >
                  {c.icone} {c.nome}
                </button>
              );
            })}
          </div>
        )}

        {/* BARRA CONTEXTUAL DO TOKEN SELECIONADO (ESTILO OWLBEAR RODEO!) */}
        {tokenSelecionado && (
          <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl px-2.5 py-1.5 shadow-2xl flex flex-wrap items-center justify-center gap-1.5">
            <div className="flex items-center gap-1.5 pr-1">
              <span className="text-base">{tokenSelecionado.icone}</span>
              <span className="text-xs font-bold text-white max-w-[90px] sm:max-w-[130px] truncate">
                {tokenSelecionado.nome}
              </span>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-md">
                CA {tokenSelecionado.ca}
              </span>
            </div>

            {/* Controle rápido de PV inline (-1 / PV / +1) */}
            {podeControlarToken(tokenSelecionado) ? (
              <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl p-0.5">
                <button
                  onClick={() => void ajustarHpRapido(-5)}
                  title="Causar 5 de dano"
                  className="px-1.5 py-1 text-[10px] font-bold text-rose-400 hover:bg-rose-500/15 rounded-lg"
                >
                  -5
                </button>
                <button
                  onClick={() => void ajustarHpRapido(-1)}
                  title="Causar 1 de dano"
                  className="px-2 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/15 rounded-lg"
                >
                  −
                </button>
                <span className="px-2 text-xs font-mono font-bold text-emerald-400">
                  {tokenSelecionado.hpAtual}/{tokenSelecionado.hpMax}
                </span>
                <button
                  onClick={() => void ajustarHpRapido(1)}
                  title="Curar 1 PV"
                  className="px-2 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/15 rounded-lg"
                >
                  +
                </button>
                <button
                  onClick={() => void ajustarHpRapido(5)}
                  title="Curar 5 PV"
                  className="px-1.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/15 rounded-lg"
                >
                  +5
                </button>
              </div>
            ) : (
              <span className="text-xs font-mono text-emerald-400 px-2">
                {tokenSelecionado.hpAtual}/{tokenSelecionado.hpMax} PV
              </span>
            )}

            {/* Botões rápidos de ação, status, ficha, ocultar e remover */}
            {podeControlarToken(tokenSelecionado) && (
              <>
                <button
                  onClick={() =>
                    setSubMenuToken(subMenuToken === "acoes" ? null : "acoes")
                  }
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    subMenuToken === "acoes"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  }`}
                >
                  ⚔️ Ações
                </button>
                <button
                  onClick={() =>
                    setSubMenuToken(subMenuToken === "status" ? null : "status")
                  }
                  title="Condições de status"
                  className={`px-2 py-1.5 rounded-xl text-xs transition-colors ${
                    subMenuToken === "status"
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  ✨
                </button>
              </>
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
              title="Abrir Ficha"
              className="px-2 py-1.5 rounded-xl hover:bg-zinc-800 text-zinc-300 text-xs"
            >
              📄
            </button>

            {isMestre && (
              <>
                <button
                  onClick={() => void alternarVisibilidadeToken()}
                  title={
                    tokenSelecionado.oculto
                      ? "Revelar aos jogadores"
                      : "Ocultar dos jogadores"
                  }
                  className={`px-2 py-1.5 rounded-xl text-xs ${
                    tokenSelecionado.oculto
                      ? "bg-indigo-600/30 text-indigo-200"
                      : "hover:bg-zinc-800 text-zinc-400"
                  }`}
                >
                  👁️
                </button>
                <button
                  onClick={() => void removerToken(tokenSelecionado.id)}
                  title="Remover do mapa"
                  className="px-2 py-1.5 rounded-xl hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 text-xs"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        )}

        {/* DOCK DE PERSONAGENS / TOKENS (BANDEJA HORIZONTAL RETRÁTIL OWLBEAR) */}
        {painelAberto === "dock" && (
          <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl w-[88vw] max-w-xl space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-300">
                Arraste ou clique em um personagem para colocar no mapa
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {isMestre && (
                  <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spawnOculto}
                      onChange={(e) => setSpawnOculto(e.target.checked)}
                      className="accent-indigo-500"
                    />
                    Oculto
                  </label>
                )}
                <button
                  onClick={() => setPainelAberto(null)}
                  className="text-zinc-500 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {fichasMesa.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/70 border border-white/5 rounded-xl p-3">
                <span className="text-xs text-zinc-400">
                  Nenhum personagem na sala ainda.
                </span>
                <div className="flex gap-2">
                  {isMestre && (
                    <button
                      onClick={() => void gerarFichasPadroesNaMesa()}
                      disabled={carregandoFichas}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200"
                    >
                      {carregandoFichas ? "Carregando..." : "Carregar Exemplos"}
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/criar-ficha")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                  >
                    + Criar Ficha
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {fichasMesa
                  .filter(
                    (f) =>
                      isMestre ||
                      Number(f.usuarioId) === Number(usuarioLogado?.id)
                  )
                  .map((f) => {
                    const faccao = detectarFaccaoFicha(f);
                    const icone = obterIconeFicha(f, faccao);
                    const selecionado = fichaParaPosicionar?.id === f.id;
                    return (
                      <button
                        key={f.id}
                        draggable
                        onDragStart={() =>
                          setArrastandoItem({ tipo: "ficha", ficha: f })
                        }
                        onDragEnd={() => setArrastandoItem(null)}
                        onClick={() => {
                          setFichaParaPosicionar(f);
                          setFerramenta("posicionar");
                          setPainelAberto(null);
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border shrink-0 w-20 transition-all cursor-grab active:cursor-grabbing ${
                          selecionado
                            ? "bg-indigo-600/25 border-indigo-400"
                            : "bg-zinc-950/80 hover:bg-zinc-800 border-white/10"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg bg-zinc-900 border-2 ${
                            faccao === "inimigo"
                              ? "border-rose-500"
                              : "border-emerald-400"
                          }`}
                        >
                          {icone}
                        </div>
                        <span className="text-[10px] font-medium text-zinc-200 w-full truncate text-center">
                          {f.nome}
                        </span>
                      </button>
                    );
                  })}

                {isMestre && fichasMesa.length < 4 && (
                  <button
                    onClick={() => void gerarFichasPadroesNaMesa()}
                    disabled={carregandoFichas}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-white/15 hover:border-indigo-400 shrink-0 w-20 h-[76px] text-[10px] text-zinc-400 hover:text-white"
                  >
                    <span className="text-base">⚡</span>
                    <span>Exemplos</span>
                  </button>
                )}

                <button
                  onClick={() => navigate("/criar-ficha")}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-white/15 hover:border-indigo-400 shrink-0 w-20 h-[76px] text-[10px] text-zinc-400 hover:text-white"
                >
                  <span className="text-base">+</span>
                  <span>Nova Ficha</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botão Gatilho da Bandeja de Personagens */}
        <button
          onClick={() =>
            setPainelAberto(painelAberto === "dock" ? null : "dock")
          }
          className={`h-11 px-4 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center gap-2 text-xs font-semibold transition-colors ${
            painelAberto === "dock"
              ? "bg-indigo-600 border-indigo-400 text-white"
              : "bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-200"
          }`}
        >
          <span>🎭</span>
          <span>Personagens</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 7. CANTO INFERIOR DIREITO: CONTROLE DE ZOOM DISCRETO                */}
      {/* =================================================================== */}
      <div className="fixed bottom-4 right-3 sm:right-4 z-40 flex items-center bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-1 shadow-2xl">
        <button
          onClick={() => setTamanhoCelula((prev) => Math.max(28, prev - 6))}
          title="Diminuir zoom"
          className="w-7 sm:w-8 h-9 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-sm"
        >
          −
        </button>
        <button
          onClick={() => setTamanhoCelula(CELL_BASE)}
          title="Restaurar zoom 100%"
          className="px-2 text-[11px] font-mono text-zinc-400 hover:text-white hidden sm:inline"
        >
          {zoomPercent}%
        </button>
        <button
          onClick={() => setTamanhoCelula((prev) => Math.min(84, prev + 6))}
          title="Aumentar zoom"
          className="w-7 sm:w-8 h-9 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}
