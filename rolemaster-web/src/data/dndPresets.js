// ============================================================================
// REGRAS D&D 5e, FICHAS PADRÕES, PROPS E CENÁRIOS PRÉ-CONFIGURADOS
// ============================================================================

export const calcularModificador = (valor = 10) => Math.floor((Number(valor) - 10) / 2);

export const formatarModificador = (valor = 10) => {
  const mod = calcularModificador(valor);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

// Cada quadrado no D&D 5e equivale a 1,5 metros (5 pés)
export const METROS_POR_QUADRADO = 1.5;

export const calcularQuadradosDistancia = (x1, y1, x2, y2) => {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
};

export const calcularDistanciaMetros = (x1, y1, x2, y2) => {
  return Number((calcularQuadradosDistancia(x1, y1, x2, y2) * METROS_POR_QUADRADO).toFixed(1));
};

export const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

// Interpreta expressões de dados D&D como "1d8", "2d6+3", "3d4+3", "1d10-1"
export const rolarExpressaoDados = (expressao = "1d6", critico = false) => {
  const limpa = String(expressao).replace(/\s+/g, "").toLowerCase();
  const match = limpa.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    const fixo = parseInt(limpa, 10);
    if (!isNaN(fixo)) {
      return { total: fixo, dados: [fixo], bonus: 0, formula: `${fixo}` };
    }
    const d = rolarDado(6);
    return { total: d, dados: [d], bonus: 0, formula: "1d6" };
  }

  const qtdBase = parseInt(match[1], 10);
  const faces = parseInt(match[2], 10);
  const bonus = match[3] ? parseInt(match[3], 10) : 0;
  const qtdDados = critico ? qtdBase * 2 : qtdBase;

  const dados = [];
  for (let i = 0; i < qtdDados; i++) {
    dados.push(rolarDado(faces));
  }

  const somaDados = dados.reduce((acc, v) => acc + v, 0);
  const total = Math.max(1, somaDados + bonus);

  return {
    total,
    dados,
    bonus,
    formula: `${qtdDados}d${faces}${bonus > 0 ? `+${bonus}` : bonus < 0 ? `${bonus}` : ""}`,
  };
};

// Extrai as ações de combate disponíveis a partir dos dados reais da Ficha do Personagem
export const obterAcoesDaFicha = (ficha) => {
  if (!ficha) return [];

  const strMod = calcularModificador(ficha.forca ?? 10);
  const dexMod = calcularModificador(ficha.destreza ?? 10);
  const intMod = calcularModificador(ficha.inteligencia ?? 10);
  const wisMod = calcularModificador(ficha.sabedoria ?? 10);
  const chaMod = calcularModificador(ficha.carisma ?? 10);
  const prof = Number(ficha.bonusProficiencia ?? 2);

  const maiorModMental = Math.max(intMod, wisMod, chaMod);
  const acoes = [];

  // 1. Armas do inventário (Equipamento)
  const equipamentos = Array.isArray(ficha.equipamento) ? ficha.equipamento : [];
  equipamentos.forEach((eq, idx) => {
    const props = (eq.properties || "").toLowerCase();
    const isDistancia = props.includes("distância") || props.includes("distancia") || props.includes("arco") || props.includes("besta") || props.includes("arremesso");
    const isAcuidade = props.includes("acuidade");
    const modAtributo = isDistancia ? dexMod : isAcuidade ? Math.max(strMod, dexMod) : strMod;

    // Extrai alcance em metros se especificado, ex: (12m), senão usa padrão 1.5m ou 12m
    const matchAlcance = props.match(/(\d+(?:\.\d+)?)m/);
    const alcance = matchAlcance ? parseFloat(matchAlcance[1]) : isDistancia ? 12 : 1.5;

    acoes.push({
      id: `eq-${eq.id || idx}-${eq.name}`,
      nome: eq.name || "Ataque com Arma",
      tipo: "ataque",
      categoria: isDistancia ? "Ataque à Distância" : "Ataque Corpo a Corpo",
      icone: isDistancia ? "🏹" : "⚔️",
      dano: eq.damage || "1d6",
      bonusAtaque: modAtributo + prof,
      bonusDano: modAtributo,
      alcanceMetros: alcance,
      custo: "acao",
      descricao: eq.properties || `${eq.damage || "1d6"} + ${modAtributo} de dano`,
    });
  });

  // Se a ficha não tiver equipamentos cadastrados, fornece ataques básicos da classe/ficha
  if (acoes.length === 0) {
    const classeLower = (ficha.classe || "").toLowerCase();
    if (classeLower.includes("mago") || classeLower.includes("feiticeiro") || classeLower.includes("bruxo")) {
      acoes.push({
        id: "basico-cajado",
        nome: "Golpe de Cajado",
        tipo: "ataque",
        categoria: "Corpo a Corpo",
        icone: "🦯",
        dano: "1d6",
        bonusAtaque: strMod + prof,
        bonusDano: strMod,
        alcanceMetros: 1.5,
        custo: "acao",
        descricao: "Ataque básico corpo a corpo (1,5m)",
      });
      acoes.push({
        id: "basico-raio",
        nome: "Raio de Fogo (Truque)",
        tipo: "ataque",
        categoria: "Magia de Ataque",
        icone: "🔥",
        dano: "1d10",
        bonusAtaque: maiorModMental + prof,
        bonusDano: 0,
        alcanceMetros: 18,
        custo: "acao",
        descricao: "Disparo arcano flamejante a até 18m",
      });
    } else if (classeLower.includes("ladino") || classeLower.includes("arqueiro") || classeLower.includes("patrulheiro")) {
      acoes.push({
        id: "basico-rapieira",
        nome: "Lâmina Ágil",
        tipo: "ataque",
        categoria: "Corpo a Corpo (Acuidade)",
        icone: "🗡️",
        dano: "1d8",
        bonusAtaque: Math.max(strMod, dexMod) + prof,
        bonusDano: Math.max(strMod, dexMod),
        alcanceMetros: 1.5,
        custo: "acao",
        descricao: "Ataque preciso corpo a corpo (1,5m)",
      });
      acoes.push({
        id: "basico-arco",
        nome: "Disparo Preciso",
        tipo: "ataque",
        categoria: "Ataque à Distância",
        icone: "🏹",
        dano: "1d8",
        bonusAtaque: dexMod + prof,
        bonusDano: dexMod,
        alcanceMetros: 15,
        custo: "acao",
        descricao: "Flecha disparada a até 15m",
      });
    } else {
      acoes.push({
        id: "basico-espada",
        nome: "Ataque Armado",
        tipo: "ataque",
        categoria: "Corpo a Corpo",
        icone: "⚔️",
        dano: "1d8",
        bonusAtaque: Math.max(strMod, dexMod) + prof,
        bonusDano: Math.max(strMod, dexMod),
        alcanceMetros: 1.5,
        custo: "acao",
        descricao: "Golpe marcial padrão (1,5m)",
      });
      acoes.push({
        id: "basico-arremesso",
        nome: "Arma de Arremesso",
        tipo: "ataque",
        categoria: "Ataque à Distância",
        icone: "🪓",
        dano: "1d6",
        bonusAtaque: Math.max(strMod, dexMod) + prof,
        bonusDano: Math.max(strMod, dexMod),
        alcanceMetros: 9,
        custo: "acao",
        descricao: "Ataque à distância até 9m",
      });
    }
  }

  // 2. Magias e Habilidades da Ficha (Magia)
  const magias = Array.isArray(ficha.magia) ? ficha.magia : [];
  magias.forEach((mag, idx) => {
    const props = (mag.properties || "").toLowerCase();
    const nomeLower = (mag.name || "").toLowerCase();
    const descLower = (mag.description || "").toLowerCase();

    const isCura =
      props.startsWith("cura") ||
      nomeLower.includes("cura") ||
      nomeLower.includes("fôlego") ||
      nomeLower.includes("folego") ||
      descLower.includes("recupera") ||
      descLower.includes("restaura");

    const matchDados = (mag.properties + " " + mag.description).match(/(\d+d\d+(?:[+-]\d+)?)/i);
    const expressaoDados = matchDados ? matchDados[1] : isCura ? "1d8" : "2d6";

    const partesProps = props.split(":");
    const alcanceMagia = partesProps[2] ? parseFloat(partesProps[2]) : isCura ? 9 : 15;

    acoes.push({
      id: `mag-${mag.id || idx}-${mag.name}`,
      nome: mag.name || "Magia Arcana",
      tipo: isCura ? "cura" : "ataque",
      categoria: isCura ? "Magia de Cura" : "Magia de Combate",
      icone: isCura ? "✨" : "🔮",
      dano: expressaoDados,
      bonusAtaque: maiorModMental + prof,
      bonusDano: isCura ? maiorModMental : 0,
      alcanceMetros: alcanceMagia,
      custo: nomeLower.includes("palavra") || nomeLower.includes("fôlego") ? "bonus" : "acao",
      descricao: mag.description || `${isCura ? "Cura" : "Dano"}: ${expressaoDados}`,
    });
  });

  // 3. Ações Universais de Combate D&D 5e (Cura por Poção / Primeiros Socorros)
  acoes.push({
    id: "universal-pocao-cura",
    nome: "Poção de Cura (2d4+2)",
    tipo: "cura",
    categoria: "Item / Suporte (1,5m)",
    icone: "🧪",
    dano: "2d4+2",
    bonusAtaque: 0,
    bonusDano: 0,
    alcanceMetros: 1.5,
    custo: "bonus",
    descricao: "Bebe ou aplica em um aliado adjacente para restaurar 2d4 + 2 PV (Ação Bônus).",
  });

  const classeLower = (ficha.classe || "").toLowerCase();
  if (
    (classeLower.includes("clérigo") ||
      classeLower.includes("clerigo") ||
      classeLower.includes("paladino") ||
      classeLower.includes("bardo") ||
      classeLower.includes("druida")) &&
    !acoes.some((a) => a.tipo === "cura" && a.id.startsWith("mag-"))
  ) {
    acoes.push({
      id: "classe-curar-ferimentos",
      nome: "Curar Ferimentos",
      tipo: "cura",
      categoria: "Magia Divina",
      icone: "💖",
      dano: "1d8",
      bonusAtaque: 0,
      bonusDano: Math.max(1, maiorModMental),
      alcanceMetros: 9,
      custo: "acao",
      descricao: "Canaliza energia positiva para restaurar 1d8 + Mod. de conjuração em um aliado.",
    });
  }

  return acoes;
};

// ============================================================================
// CATÁLOGO DE PROPS INTERATIVOS PARA O CENÁRIO
// ============================================================================
export const PROPS_CATALOGO = [
  {
    tipo: "parede",
    nome: "Parede de Masmorra",
    icone: "🧱",
    cor: "bg-stone-700 border-stone-500",
    bloqueiaMovimento: true,
    terrenoDificil: false,
    descricao: "Bloqueia movimento e linha de passagem.",
  },
  {
    tipo: "pilar",
    nome: "Pilar de Pedra",
    icone: "🏛️",
    cor: "bg-zinc-700 border-zinc-400",
    bloqueiaMovimento: true,
    terrenoDificil: false,
    descricao: "Coluna maciça que bloqueia a célula e fornece cobertura.",
  },
  {
    tipo: "arvore",
    nome: "Árvore Antiga",
    icone: "🌲",
    cor: "bg-emerald-950 border-emerald-700",
    bloqueiaMovimento: true,
    terrenoDificil: false,
    descricao: "Tronco espesso que impede passagem.",
  },
  {
    tipo: "rocha",
    nome: "Pedregulho",
    icone: "🪨",
    cor: "bg-stone-800 border-stone-600",
    bloqueiaMovimento: true,
    terrenoDificil: false,
    descricao: "Obstáculo rochoso intransponível.",
  },
  {
    tipo: "mesa",
    nome: "Mesa / Barricada",
    icone: "🪑",
    cor: "bg-amber-950/80 border-amber-700",
    bloqueiaMovimento: false,
    terrenoDificil: true,
    descricao: "Terreno difícil (custa 3m para atravessar) e meia-cobertura.",
  },
  {
    tipo: "agua",
    nome: "Água / Pântano",
    icone: "🌊",
    cor: "bg-sky-950/80 border-sky-600",
    bloqueiaMovimento: false,
    terrenoDificil: true,
    descricao: "Terreno difícil: cada quadrado custa o dobro de deslocamento (3m).",
  },
  {
    tipo: "fogo",
    nome: "Fogueira / Lava",
    icone: "🔥",
    cor: "bg-orange-950/90 border-orange-500",
    bloqueiaMovimento: false,
    terrenoDificil: true,
    danoAmbiental: "1d6",
    descricao: "Perigo ambiental flamejante (terreno difícil).",
  },
  {
    tipo: "bau",
    nome: "Baú de Tesouro",
    icone: "📦",
    cor: "bg-yellow-950/80 border-yellow-500",
    bloqueiaMovimento: false,
    terrenoDificil: false,
    descricao: "Objeto interativo de saque ou objetivo da missão.",
  },
  {
    tipo: "porta",
    nome: "Porta / Portal",
    icone: "🚪",
    cor: "bg-amber-900/70 border-amber-500",
    bloqueiaMovimento: false,
    terrenoDificil: false,
    descricao: "Entrada ou passagem entre aposentos.",
  },
  {
    tipo: "altar",
    nome: "Altar Arcano",
    icone: "🔮",
    cor: "bg-purple-950/80 border-purple-500",
    bloqueiaMovimento: true,
    terrenoDificil: false,
    descricao: "Relíquia mística no centro do ritual.",
  },
  {
    tipo: "armadilha",
    nome: "Armadilha de Espinhos",
    icone: "⚙️",
    cor: "bg-red-950/70 border-red-600",
    bloqueiaMovimento: false,
    terrenoDificil: true,
    danoAmbiental: "2d4",
    descricao: "Mecanismo perigoso no piso.",
  },
];

// ============================================================================
// TEMAS VISUAIS DE TABULEIRO
// ============================================================================
export const TEMAS_TABULEIRO = {
  masmorra: {
    nome: "Masmorra de Pedra",
    bgGrid: "bg-zinc-900",
    cellBg: "bg-zinc-900/75 hover:bg-zinc-800/80",
    borderColor: "border-zinc-700/60",
    accent: "text-zinc-300",
  },
  floresta: {
    nome: "Floresta Selvagem",
    bgGrid: "bg-emerald-950",
    cellBg: "bg-emerald-950/70 hover:bg-emerald-900/75",
    borderColor: "border-emerald-800/50",
    accent: "text-emerald-300",
  },
  taverna: {
    nome: "Taverna de Madeira",
    bgGrid: "bg-amber-950",
    cellBg: "bg-amber-950/70 hover:bg-amber-900/75",
    borderColor: "border-amber-800/50",
    accent: "text-amber-300",
  },
  vulcao: {
    nome: "Covil Vulcânico",
    bgGrid: "bg-red-950",
    cellBg: "bg-red-950/75 hover:bg-red-900/75",
    borderColor: "border-red-800/50",
    accent: "text-red-300",
  },
  cripta: {
    nome: "Cripta Sombria",
    bgGrid: "bg-slate-950",
    cellBg: "bg-slate-950/80 hover:bg-slate-900/80",
    borderColor: "border-purple-900/50",
    accent: "text-purple-300",
  },
};

// ============================================================================
// CENÁRIOS PRÉ-PRONTOS (PRESETS DO MESTRE)
// ============================================================================
export const CENARIOS_PADROES = [
  {
    id: "preset-masmorra",
    nome: "Câmara do Altar Profano",
    tema: "masmorra",
    largura: 14,
    altura: 10,
    fundoUrl: "",
    props: [
      { id: "p1", x: 3, y: 2, tipo: "pilar", nome: "Pilar de Pedra", icone: "🏛️", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "p2", x: 10, y: 2, tipo: "pilar", nome: "Pilar de Pedra", icone: "🏛️", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "p3", x: 3, y: 7, tipo: "pilar", nome: "Pilar de Pedra", icone: "🏛️", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "p4", x: 10, y: 7, tipo: "pilar", nome: "Pilar de Pedra", icone: "🏛️", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "p5", x: 7, y: 4, tipo: "altar", nome: "Altar Arcano", icone: "🔮", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "p6", x: 7, y: 5, tipo: "bau", nome: "Baú de Tesouro", icone: "📦", bloqueiaMovimento: false, terrenoDificil: false },
      { id: "p7", x: 0, y: 4, tipo: "porta", nome: "Porta Principal", icone: "🚪", bloqueiaMovimento: false, terrenoDificil: false },
      { id: "p8", x: 6, y: 2, tipo: "fogo", nome: "Braseiro", icone: "🔥", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "p9", x: 6, y: 7, tipo: "fogo", nome: "Braseiro", icone: "🔥", bloqueiaMovimento: false, terrenoDificil: true },
    ],
  },
  {
    id: "preset-floresta",
    nome: "Emboscada na Estrada da Floresta",
    tema: "floresta",
    largura: 14,
    altura: 10,
    fundoUrl: "",
    props: [
      { id: "f1", x: 2, y: 1, tipo: "arvore", nome: "Árvore Antiga", icone: "🌲", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "f2", x: 4, y: 2, tipo: "arvore", nome: "Árvore Antiga", icone: "🌲", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "f3", x: 10, y: 1, tipo: "arvore", nome: "Árvore Antiga", icone: "🌲", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "f4", x: 11, y: 3, tipo: "arvore", nome: "Árvore Antiga", icone: "🌲", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "f5", x: 2, y: 8, tipo: "arvore", nome: "Árvore Antiga", icone: "🌲", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "f6", x: 9, y: 8, tipo: "arvore", nome: "Árvore Antiga", icone: "🌲", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "f7", x: 6, y: 3, tipo: "rocha", nome: "Pedregulho", icone: "🪨", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "f8", x: 7, y: 6, tipo: "fogo", nome: "Fogueira do Acampamento", icone: "🔥", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "f9", x: 5, y: 5, tipo: "agua", nome: "Riacho Raso", icone: "🌊", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "f10", x: 5, y: 6, tipo: "agua", nome: "Riacho Raso", icone: "🌊", bloqueiaMovimento: false, terrenoDificil: true },
    ],
  },
  {
    id: "preset-taverna",
    nome: "Salão da Taverna em Chamas",
    tema: "taverna",
    largura: 14,
    altura: 10,
    fundoUrl: "",
    props: [
      { id: "t1", x: 3, y: 3, tipo: "mesa", nome: "Mesa de Carvalho", icone: "🪑", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "t2", x: 4, y: 3, tipo: "mesa", nome: "Mesa de Carvalho", icone: "🪑", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "t3", x: 3, y: 6, tipo: "mesa", nome: "Mesa Virada", icone: "🪑", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "t4", x: 8, y: 4, tipo: "mesa", nome: "Balcão do Taverneiro", icone: "🪑", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "t5", x: 8, y: 5, tipo: "mesa", nome: "Balcão do Taverneiro", icone: "🪑", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "t6", x: 8, y: 6, tipo: "mesa", nome: "Balcão do Taverneiro", icone: "🪑", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "t7", x: 11, y: 5, tipo: "bau", nome: "Estoque do Taverneiro", icone: "📦", bloqueiaMovimento: false, terrenoDificil: false },
      { id: "t8", x: 0, y: 5, tipo: "porta", nome: "Entrada da Taverna", icone: "🚪", bloqueiaMovimento: false, terrenoDificil: false },
    ],
  },
  {
    id: "preset-vulcao",
    nome: "Santuário do Dragão Vermelho",
    tema: "vulcao",
    largura: 14,
    altura: 10,
    fundoUrl: "",
    props: [
      { id: "v1", x: 5, y: 1, tipo: "fogo", nome: "Fenda de Lava", icone: "🔥", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "v2", x: 5, y: 2, tipo: "fogo", nome: "Fenda de Lava", icone: "🔥", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "v3", x: 5, y: 7, tipo: "fogo", nome: "Fenda de Lava", icone: "🔥", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "v4", x: 5, y: 8, tipo: "fogo", nome: "Fenda de Lava", icone: "🔥", bloqueiaMovimento: false, terrenoDificil: true },
      { id: "v5", x: 9, y: 3, tipo: "rocha", nome: "Coluna Basáltica", icone: "🪨", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "v6", x: 9, y: 6, tipo: "rocha", nome: "Coluna Basáltica", icone: "🪨", bloqueiaMovimento: true, terrenoDificil: false },
      { id: "v7", x: 12, y: 4, tipo: "bau", nome: "Tesouro Dracônico", icone: "📦", bloqueiaMovimento: false, terrenoDificil: false },
      { id: "v8", x: 12, y: 5, tipo: "altar", nome: "Trono de Obsidiana", icone: "🔮", bloqueiaMovimento: true, terrenoDificil: false },
    ],
  },
];

// ============================================================================
// FICHAS PADRÕES (FALLBACK LOCAL + SEED PARA O BANCO)
// ============================================================================
export const FICHAS_PADROES_LOCAIS = [
  {
    nome: "Thorin Escudo-de-Ferro",
    raca: "Anão da Montanha",
    classe: "Guerreiro",
    nivel: 3,
    alinhamento: "Leal e Bom",
    antecedente: "Soldado",
    nomeDoJogador: "Ficha Padrão (Herói)",
    forca: 16,
    destreza: 12,
    constituicao: 16,
    inteligencia: 10,
    sabedoria: 12,
    carisma: 8,
    bonusProficiencia: 2,
    classeArmadura: 18,
    iniciativa: 1,
    deslocamento: 7.5,
    pontosDeVidaMaximos: 31,
    pontosDeVidaAtuais: 31,
    dadoDeVida: "3d10",
    salvaGuardaForca: true,
    salvaGuardaConstituicao: true,
    equipamento: [
      { name: "Machado de Batalha", damage: "1d8", properties: "Corpo a Corpo (1.5m)" },
      { name: "Besta Leve", damage: "1d8", properties: "Distância (12m)" },
    ],
    magia: [
      { name: "Retomar o Fôlego", description: "Recupera 1d10+3 de PV (Ação Bônus)", properties: "cura:1d10+3:1.5", slot: 1 },
    ],
  },
  {
    nome: "Lyra Vento-Estelar",
    raca: "Alto Elfo",
    classe: "Mago",
    nivel: 3,
    alinhamento: "Neutro e Bom",
    antecedente: "Sábio",
    nomeDoJogador: "Ficha Padrão (Herói)",
    forca: 8,
    destreza: 14,
    constituicao: 12,
    inteligencia: 17,
    sabedoria: 13,
    carisma: 10,
    bonusProficiencia: 2,
    classeArmadura: 15,
    iniciativa: 2,
    deslocamento: 9,
    pontosDeVidaMaximos: 18,
    pontosDeVidaAtuais: 18,
    dadoDeVida: "3d6",
    salvaGuardaInteligencia: true,
    salvaGuardaSabedoria: true,
    equipamento: [
      { name: "Cajado Arcano", damage: "1d6", properties: "Corpo a Corpo (1.5m)" },
    ],
    magia: [
      { name: "Raio de Fogo", description: "Disparo ígneo a até 18m (1d10)", properties: "ataque:1d10:18", slot: 0 },
      { name: "Mísseis Mágicos", description: "Três dardos arcanos (3d4+3)", properties: "ataque:3d4+3:18", slot: 1 },
    ],
  },
  {
    nome: "Seraphina Luz-da-Alvorada",
    raca: "Humana",
    classe: "Clérigo",
    nivel: 3,
    alinhamento: "Leal e Boa",
    antecedente: "Acólita",
    nomeDoJogador: "Ficha Padrão (Herói)",
    forca: 14,
    destreza: 10,
    constituicao: 14,
    inteligencia: 11,
    sabedoria: 16,
    carisma: 13,
    bonusProficiencia: 2,
    classeArmadura: 18,
    iniciativa: 0,
    deslocamento: 9,
    pontosDeVidaMaximos: 24,
    pontosDeVidaAtuais: 24,
    dadoDeVida: "3d8",
    salvaGuardaSabedoria: true,
    salvaGuardaCarisma: true,
    equipamento: [
      { name: "Maça Sagrada", damage: "1d6", properties: "Corpo a Corpo (1.5m)" },
    ],
    magia: [
      { name: "Curar Ferimentos", description: "Restaura 1d8+3 PV", properties: "cura:1d8+3:4.5", slot: 1 },
      { name: "Palavra Curativa", description: "Prece curativa a 18m (1d4+3 PV)", properties: "cura:1d4+3:18", slot: 1 },
      { name: "Chama Sagrada", description: "Fogo celeste a 18m (1d8 radiante)", properties: "ataque:1d8:18", slot: 0 },
    ],
  },
  {
    nome: "Kaelen Sombra-Veloz",
    raca: "Halfling Pés-Leves",
    classe: "Ladino",
    nivel: 3,
    alinhamento: "Caótico e Neutro",
    antecedente: "Criminoso",
    nomeDoJogador: "Ficha Padrão (Herói)",
    forca: 10,
    destreza: 17,
    constituicao: 12,
    inteligencia: 13,
    sabedoria: 12,
    carisma: 14,
    bonusProficiencia: 2,
    classeArmadura: 15,
    iniciativa: 3,
    deslocamento: 9,
    pontosDeVidaMaximos: 21,
    pontosDeVidaAtuais: 21,
    dadoDeVida: "3d8",
    salvaGuardaDestreza: true,
    salvaGuardaInteligencia: true,
    equipamento: [
      { name: "Rapieira Furtiva", damage: "2d6", properties: "Acuidade, Corpo a Corpo (1.5m)" },
      { name: "Arco Curto", damage: "1d6", properties: "Distância (15m)" },
    ],
    magia: [],
  },
  {
    nome: "Goblin Saqueador",
    raca: "Goblinóide",
    classe: "Inimigo (ND 1/4)",
    nivel: 1,
    alinhamento: "Neutro e Mau",
    antecedente: "Monstro",
    nomeDoJogador: "NPC / Monstro",
    forca: 8,
    destreza: 14,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 8,
    carisma: 8,
    bonusProficiencia: 2,
    classeArmadura: 15,
    iniciativa: 2,
    deslocamento: 9,
    pontosDeVidaMaximos: 12,
    pontosDeVidaAtuais: 12,
    dadoDeVida: "2d6",
    equipamento: [
      { name: "Cimitarra", damage: "1d6", properties: "Acuidade, Corpo a Corpo (1.5m)" },
      { name: "Arco Curto", damage: "1d6", properties: "Distância (12m)" },
    ],
    magia: [],
  },
  {
    nome: "Orc Berserker",
    raca: "Orc",
    classe: "Inimigo (ND 1/2)",
    nivel: 2,
    alinhamento: "Caótico e Mau",
    antecedente: "Monstro",
    nomeDoJogador: "NPC / Monstro",
    forca: 16,
    destreza: 12,
    constituicao: 16,
    inteligencia: 7,
    sabedoria: 11,
    carisma: 10,
    bonusProficiencia: 2,
    classeArmadura: 13,
    iniciativa: 1,
    deslocamento: 9,
    pontosDeVidaMaximos: 22,
    pontosDeVidaAtuais: 22,
    dadoDeVida: "2d8+6",
    equipamento: [
      { name: "Machado Grande", damage: "1d12", properties: "Pesado, Corpo a Corpo (1.5m)" },
      { name: "Azagaia", damage: "1d6", properties: "Arremesso (9m)" },
    ],
    magia: [],
  },
  {
    nome: "Esqueleto Guardião",
    raca: "Morto-Vivo",
    classe: "Inimigo (ND 1/4)",
    nivel: 1,
    alinhamento: "Leal e Mau",
    antecedente: "Monstro",
    nomeDoJogador: "NPC / Monstro",
    forca: 10,
    destreza: 14,
    constituicao: 15,
    inteligencia: 6,
    sabedoria: 8,
    carisma: 5,
    bonusProficiencia: 2,
    classeArmadura: 13,
    iniciativa: 2,
    deslocamento: 9,
    pontosDeVidaMaximos: 15,
    pontosDeVidaAtuais: 15,
    dadoDeVida: "2d8+4",
    equipamento: [
      { name: "Espada Curta", damage: "1d6", properties: "Acuidade, Corpo a Corpo (1.5m)" },
      { name: "Arco Composto", damage: "1d6", properties: "Distância (15m)" },
    ],
    magia: [],
  },
  {
    nome: "Ignis, Dragão Vermelho Jovem",
    raca: "Dragão",
    classe: "Chefe (ND 4)",
    nivel: 6,
    alinhamento: "Caótico e Mau",
    antecedente: "Chefe de Masmorra",
    nomeDoJogador: "NPC / Monstro",
    forca: 19,
    destreza: 10,
    constituicao: 17,
    inteligencia: 12,
    sabedoria: 11,
    carisma: 15,
    bonusProficiencia: 3,
    classeArmadura: 17,
    iniciativa: 0,
    deslocamento: 12,
    pontosDeVidaMaximos: 75,
    pontosDeVidaAtuais: 75,
    dadoDeVida: "10d10+20",
    equipamento: [
      { name: "Mordida Dracônica", damage: "2d10", properties: "Corpo a Corpo (3m)" },
    ],
    magia: [
      { name: "Sopro de Fogo", description: "Cone de chamas (6d6 de fogo, 9m)", properties: "ataque:6d6:9", slot: 1 },
    ],
  },
];
