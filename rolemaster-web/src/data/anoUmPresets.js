// ============================================================================
// GUIA DE CRIAÇÃO DE PERSONAGENS (SESSÃO 0) — ANO UM: APOCALIPSE RPG (V0.9.4b)
// Baseado estrita e exclusivamente no Guia Oficial da Campanha de 1950
// ============================================================================

export const CONTEXTO_1950 = {
  titulo: "Fevereiro de 1950. São Paulo, Brasil.",
  subtitulo:
    "Campanha de 1950 • São Miguel Paulista & Dr. Ray Grave & CIA (Ano Um — Apocalipse RPG V0.9.4b)",
  paragrafos: [
    "O mundo ainda tenta cicatrizar as feridas da Segunda Guerra Mundial, encerrada há cinco anos, mas a capital paulista vive uma febre de concreto, fumaça e promessas de modernidade. O Brasil se prepara para a primeira grande eleição presidencial após o fim do Estado Novo, e o rádio de válvula na sala de estar é o coração de cada família brasileira.",
    "Vocês vivem — ou estão de passagem — pela zona leste de São Paulo, nos arredores de São Miguel Paulista. É uma terra de contrastes brutais: de um lado, ruas de terra batida que viram lamaçal nas chuvas de verão, cortiços operários, carroças dividindo espaço com caminhões Chevrolet e o apito estridente dos trens da Central do Brasil; do outro, as chaminés colossais da Companhia Nitro Química Brasileira, que tingem o céu de cinza e deixam no ar um cheiro constante de enxofre e progresso forçado.",
    "Mas, nos últimos dezoito anos, outro nome engoliu a paisagem de São Paulo e do interior: a Dr. Ray Grave & CIA. Fundada originalmente na Califórnia pelo magnata Dr. Ray Grave e trazida ao Brasil em 1917 como uma rede de farmácias e laboratórios de ponta, a empresa deu uma guinada agressiva a partir de 1932, entrando no ramo da construção civil e infraestrutura. Onde uma empreiteira comum leva dois anos para erguer um edifício ou pavimentar uma rodovia, os canteiros da Ray Grave entregam a obra pronta em poucas semanas. Cidades inteiras do interior — como a antiga Nazaré Paulista, hoje rebatizada orgulhosamente de Nazaré Ray Grave Paulista — foram compradas e reformadas pela corporação.",
  ],
  boatos: [
    "Dizem que os operários dos turnos fechados da Ray Grave trabalham três dias seguidos sob sol e chuva sem demonstrar cansaço, com o olhar vidrado e as veias do pescoço saltadas, movidos pelos famosos 'tônicos revigorantes' distribuídos pelos médicos da empresa.",
    "Nas últimas semanas, tornaram-se frequentes os relatos de brigas violentíssimas dentro dos alojamentos da construtora — surtos repentinos abafados rapidamente pelos guardas particulares da companhia antes mesmo da polícia chegar.",
    "Mais estranho ainda é o destino dos veteranos: quase toda família tem um primo, um vizinho ou um cunhado que, após completar dois anos de serviço impecável nos canteiros da Ray Grave, simplesmente fechou a casa da noite para o dia. A versão oficial — sempre acompanhada de um telegrama carimbado pela diretoria — é que essas famílias inteiras foram 'transferidas com tudo pago para trabalhar na matriz norte-americana'. Ninguém nunca recebeu uma carta de volta.",
  ],
  radioComicio:
    "Há três dias, o país parou diante do rádio. Getúlio Vargas convocou uma transmissão extraordinária na Rádio Nacional. Com a voz estranhamente rígida, pausada e metálica, Vargas anunciou sua desistência da corrida presidencial e declarou apoio total a Eduardo Tombe, o excêntrico presidente da divisão brasileira da Dr. Ray Grave & CIA: 'O Brasil precisa de sangue novo e de braços incansáveis. Estou deixando essa nação com um aviso: elejam Eduardo Tombe.' Com o slogan de transformar as periferias operárias do Brasil em uma 'Nova York dos Trópicos', Eduardo Tombe escolheu justamente a praça da estação ferroviária de São Miguel Paulista para realizar o seu grande comício de abertura de campanha.",
};

export const GANCHOS_1950 = [
  {
    id: 1,
    titulo: "Operário da Nitro Química ou Ferroviário",
    pergunta:
      "Você trabalha duro em São Miguel Paulista. O que você acha das promessas da Ray Grave de dobrar os salários na região?",
  },
  {
    id: 2,
    titulo: 'Parente ou Amigo de um "Transferido"',
    pergunta:
      'Alguém importante para você trabalhou por 2 anos na Ray Grave e foi "transferido para os EUA" da noite para o dia sem se despedir. Quem é essa pessoa e por que você desconfia disso?',
  },
  {
    id: 3,
    titulo: "Ex-Funcionário ou Prestador da Ray Grave",
    pergunta:
      "Você trabalhou por pouco tempo em uma farmácia, escritório ou canteiro da Ray Grave e viu algo estranho (brigas nos alojamentos, tônicos sem rótulo). O que fez você sair ou desconfiar?",
  },
  {
    id: 4,
    titulo: "Profissional Local (Médico, Jornalista, Padre, Policial, Mecânico)",
    pergunta:
      "Você atende a população de São Miguel Paulista no dia a dia. Que mudanças estranhas você notou na saúde ou no comportamento dos operários recentemente?",
  },
  {
    id: 5,
    titulo: "Eleitor, Curioso ou Trabalhador do Comício",
    pergunta:
      "O anúncio de Getúlio Vargas no rádio chocou o país. Você foi até a praça da estação para ouvir Eduardo Tombe de perto, trabalhar no evento ou encontrar alguém na multidão?",
  },
];

export const ATRIBUTOS_INFO = {
  fisico: {
    sigla: "FIS",
    nome: "Físico (FIS)",
    descricao:
      "Força, vigor, agilidade e combate. Soma diretamente nos Pontos de Vida (PV) de cada parte do corpo, define quantas Ações por Turno você tem e quantos Espaços de Item você carrega sem mochila (3 a 6 espaços).",
  },
  inteligencia: {
    sigla: "INT",
    nome: "Inteligência (INT)",
    descricao:
      "Raciocínio, medicina, mecânica, percepção e pontaria técnica. Define quantas perícias extras você pode aprender ou aprimorar com estudo ao longo da campanha.",
  },
  social: {
    sigla: "SOC",
    nome: "Social (SOC)",
    descricao:
      "Carisma, sangue-frio, lábia, intimidação e empatia. Define o quão bem você acalma aliados, comanda grupos, engana guardas ou negocia sob pressão.",
  },
};

export const TABELA_CONVERSAO_ATRIBUTO = [
  {
    faixa: "0",
    min: 0,
    max: 0,
    bonus: null,
    bonusTexto: "Incapaz",
    nivel: "Debilitado / Incapaz de realizar testes desse atributo",
    acoesFisico: "0 Ações",
  },
  {
    faixa: "1 a 2",
    min: 1,
    max: 2,
    bonus: 0,
    bonusTexto: "+0",
    nivel: "Abaixo da média",
    acoesFisico: "1 Ação • 1 Reação por turno",
  },
  {
    faixa: "3",
    min: 3,
    max: 3,
    bonus: 1,
    bonusTexto: "+1",
    nivel: "Média humana comum",
    acoesFisico: "1 Ação • 1 Reação por turno",
  },
  {
    faixa: "4 a 5",
    min: 4,
    max: 5,
    bonus: 2,
    bonusTexto: "+2",
    nivel: "Acima da média / Treinado",
    acoesFisico: "1 Ação • 1 Reação por turno",
  },
  {
    faixa: "6 a 7",
    min: 6,
    max: 7,
    bonus: 3,
    bonusTexto: "+3",
    nivel: "Muito competente / Atlético ou Culto",
    acoesFisico: "1 Ação • 1 Reação por turno",
  },
  {
    faixa: "8 a 9",
    min: 8,
    max: 9,
    bonus: 4,
    bonusTexto: "+4",
    nivel: "Destaque profissional",
    acoesFisico: "1 Ação • 1 Reação por turno",
  },
  {
    faixa: "10 a 11",
    min: 10,
    max: 11,
    bonus: 5,
    bonusTexto: "+5",
    nivel: "Elite",
    acoesFisico: "2 Ações • 1 Reação por turno (a partir de 10 de FIS)",
  },
  {
    faixa: "12 a 15",
    min: 12,
    max: 15,
    bonus: 6,
    bonusTexto: "+6",
    nivel: "Ápice humano",
    acoesFisico: "2 Ações • 1 Reação por turno",
  },
  {
    faixa: "16 a 20",
    min: 16,
    max: 20,
    bonus: 7,
    bonusTexto: "+7",
    nivel: "Lendário (Limite máximo = 20)",
    acoesFisico: "2 Ações (com 16 FIS) / 3 Ações (com 17 a 20 FIS) • 1 Reação",
  },
  {
    faixa: "21 a 25",
    min: 21,
    max: 25,
    bonus: 8,
    bonusTexto: "+8",
    nivel: "Tanque Humano (Imparável, Limite = 25)",
    acoesFisico: "3 Ações • 1 Reação por turno",
  },
];

export function converterAtributoAnoUm(valorBruto, isImparavel = false) {
  const limite = isImparavel ? 25 : 20;
  const v = Math.max(0, Math.min(limite, Number(valorBruto) || 0));
  if (v === 0) return TABELA_CONVERSAO_ATRIBUTO[0];
  if (v <= 2) return TABELA_CONVERSAO_ATRIBUTO[1];
  if (v === 3) return TABELA_CONVERSAO_ATRIBUTO[2];
  if (v <= 5) return TABELA_CONVERSAO_ATRIBUTO[3];
  if (v <= 7) return TABELA_CONVERSAO_ATRIBUTO[4];
  if (v <= 9) return TABELA_CONVERSAO_ATRIBUTO[5];
  if (v <= 11) return TABELA_CONVERSAO_ATRIBUTO[6];
  if (v <= 15) return TABELA_CONVERSAO_ATRIBUTO[7];
  if (v <= 20) {
    return {
      ...TABELA_CONVERSAO_ATRIBUTO[8],
      acoesFisico:
        v === 16 ? "2 Ações • 1 Reação por turno" : "3 Ações • 1 Reação por turno",
    };
  }
  return TABELA_CONVERSAO_ATRIBUTO[9];
}

// ============================================================================
// PASSO 2 — TABELA COMPLETA DE PERÍCIAS PARA A SESSÃO 1
// ============================================================================
export const PERICIAS_ANO_UM = [
  // FÍSICO (FIS)
  {
    id: "acrobacia",
    nome: "Acrobacia",
    atributo: "fisico",
    desc: "saltar, equilibrar-se",
  },
  {
    id: "armasBrancas",
    nome: "Armas Brancas",
    atributo: "fisico",
    desc: "facas, porretes, chaves de grifo",
  },
  {
    id: "atletismo",
    nome: "Atletismo",
    atributo: "fisico",
    desc: "correr, escalar, nadar, arrombar",
  },
  {
    id: "bloqueio",
    nome: "Bloqueio",
    atributo: "fisico",
    desc: "reduz dano recebido ao se defender",
  },
  {
    id: "briga",
    nome: "Briga",
    atributo: "fisico",
    desc: "socos, chutes, agarrões e se soltar",
  },
  {
    id: "esquiva",
    nome: "Esquiva",
    atributo: "fisico",
    desc: "evitar ataques corpo a corpo",
  },
  {
    id: "folegoVigor",
    nome: "Fôlego / Vigor",
    atributo: "fisico",
    desc: "resistir a cansaço, dor e gases",
  },
  {
    id: "prestidigitacao",
    nome: "Prestidigitação",
    atributo: "fisico",
    desc: "mãos leves, pegar objetos rápido",
  },

  // INTELIGÊNCIA (INT)
  {
    id: "armasDeFogo",
    nome: "Armas de Fogo",
    atributo: "inteligencia",
    desc: "revólveres, rifles, escopetas",
  },
  {
    id: "conducao",
    nome: "Condução",
    atributo: "inteligencia",
    desc: "dirigir carros e caminhões de 1950",
  },
  {
    id: "conhecimentos",
    nome: "Conhecimentos",
    atributo: "inteligencia",
    desc: "história, química, geografia",
  },
  {
    id: "cozinha",
    nome: "Cozinha",
    atributo: "inteligencia",
    desc: "preparar refeições e avaliar água/comida",
  },
  {
    id: "fabricacao",
    nome: "Fabricação",
    atributo: "inteligencia",
    desc: "criar itens, gazuas, coquetel molotov",
  },
  {
    id: "furtividade",
    nome: "Furtividade",
    atributo: "inteligencia",
    desc: "esconder-se e andar em silêncio",
  },
  {
    id: "mecanica",
    nome: "Mecânica",
    atributo: "inteligencia",
    desc: "consertar motores, trancas e rádios",
  },
  {
    id: "medicina",
    nome: "Medicina",
    atributo: "inteligencia",
    desc: "primeiros socorros, estancar sangue",
  },
  {
    id: "percepcao",
    nome: "Percepção",
    atributo: "inteligencia",
    desc: "notar pistas, ouvir passos, vasculhar",
  },
  {
    id: "sobrevivencia",
    nome: "Sobrevivência",
    atributo: "inteligencia",
    desc: "orientar-se no mato, rastrear",
  },

  // SOCIAL (SOC)
  {
    id: "adestramento",
    nome: "Adestramento",
    atributo: "social",
    desc: "lidar com cavalos e cães",
  },
  {
    id: "charmeSeducao",
    nome: "Charme / Sedução",
    atributo: "social",
    desc: "atrair simpatia, distrair",
  },
  {
    id: "enganacao",
    nome: "Enganação",
    atributo: "social",
    desc: "mentir, disfarçar-se, blefar",
  },
  {
    id: "intimidacao",
    nome: "Intimidação",
    atributo: "social",
    desc: "coagir, impor medo ou respeito",
  },
  {
    id: "intuicao",
    nome: "Intuição",
    atributo: "social",
    desc: "perceber mentiras e intenções ocultas",
  },
  {
    id: "lideranca",
    nome: "Liderança",
    atributo: "social",
    desc: "comandar e inspirar aliados",
  },
  {
    id: "persuasao",
    nome: "Persuasão",
    atributo: "social",
    desc: "convencer com argumentos e diplomacia",
  },
  {
    id: "psicologia",
    nome: "Psicologia",
    atributo: "social",
    desc: "acalmar pânico/ansiedade e ler traumas",
  },
];

// ============================================================================
// PASSO 3 — PROFISSÕES DE 1950 POR ATRIBUTO (PÁGS. 30–31)
// ============================================================================
export const PROFISSOES_1950 = [
  // FÍSICO
  {
    id: "operario",
    nome: "Operário / Trabalhador Braçal (Nitro Química, construção civil)",
    atributo: "fisico",
    sugestaoUtensilio: "Chave de grifo pequena e luvas de couro",
    sugestaoRoupa: "Macacão surrado da fábrica",
  },
  {
    id: "ferroviario",
    nome: "Ferroviário / Estivador / Caminhoneiro",
    atributo: "fisico",
    sugestaoUtensilio: "Canivete pequeno e apito de metal",
    sugestaoRoupa: "Camisa de brim e boné de maquinista",
  },
  {
    id: "policial",
    nome: "Policial / Guarda Civil / Bombeiro",
    atributo: "fisico",
    sugestaoUtensilio: "Apito da Guarda Civil e algemas antigas",
    sugestaoRoupa: "Farda ou sobretudo de serviço",
  },
  {
    id: "militar",
    nome: "Militar / Ex-Pracinha da FEB (veterano da Itália)",
    atributo: "fisico",
    sugestaoUtensilio: "Canivete de campanha e bússola da FEB",
    sugestaoRoupa: "Jaqueta verde-oliva desbotada",
  },
  {
    id: "atleta",
    nome: "Atleta / Boxeador Amador / Segurança",
    atributo: "fisico",
    sugestaoUtensilio: "Faixas de mão para boxe e esparadrapo",
    sugestaoRoupa: "Camisa social justa e suspensórios",
  },
  {
    id: "lavrador",
    nome: "Lavrador / Lenhador / Caçador do Interior",
    atributo: "fisico",
    sugestaoUtensilio: "Canivete de fumo e caixa de fósforos",
    sugestaoRoupa: "Camisa xadrez grossa e botas de barro",
  },

  // INTELIGÊNCIA
  {
    id: "medico",
    nome: "Médico / Cirurgião / Enfermeiro(a)",
    atributo: "inteligencia",
    sugestaoUtensilio: "Rolo de gaze, bisturi pequeno e álcool",
    sugestaoRoupa: "Jaleco branco sobre terno de linho",
  },
  {
    id: "mecanico",
    nome: "Mecânico / Eletricista / Engenheiro",
    atributo: "inteligencia",
    sugestaoUtensilio: "Chave inglesa pequena e fita isolante",
    sugestaoRoupa: "Macacão manchado de graxa",
  },
  {
    id: "farmaceutico",
    nome: "Farmacêutico(a) / Químico(a) de Laboratório",
    atributo: "inteligencia",
    sugestaoUtensilio: "Caderneta de fórmulas e frasco conta-gotas",
    sugestaoRoupa: "Guarda-pó de laboratório",
  },
  {
    id: "professor",
    nome: "Professor(a) / Pesquisador(a) / Estudante",
    atributo: "inteligencia",
    sugestaoUtensilio: "Caderneta de anotações e lápis apontado",
    sugestaoRoupa: "Terno de lã ou saia plissada clássica",
  },
  {
    id: "investigador",
    nome: "Investigador / Detetive / Fotógrafo",
    atributo: "inteligencia",
    sugestaoUtensilio: "Lupa de bolso, caderneta e caixa de fósforos",
    sugestaoRoupa: "Sobretudo impermeável e chapéu fedora",
  },
  {
    id: "relojoeiro",
    nome: "Relojoeiro / Chaveiro / Alfaiate",
    atributo: "inteligencia",
    sugestaoUtensilio: "Jogo de chaves de precisão / gazua fina",
    sugestaoRoupa: "Colete de alfaiataria e mangas dobradas",
  },

  // SOCIAL
  {
    id: "jornalista",
    nome: "Jornalista / Radialista / Repórter",
    atributo: "social",
    sugestaoUtensilio: "Caderneta de imprensa e caneta-tinteiro",
    sugestaoRoupa: "Terno de linho claro e chapéu com credencial",
  },
  {
    id: "padre",
    nome: "Padre / Pastor / Religioso(a)",
    atributo: "social",
    sugestaoUtensilio: "Bíblia de bolso e frasco de óleo bento",
    sugestaoRoupa: "Batina preta ou traje eclesiástico",
  },
  {
    id: "advogado",
    nome: "Advogado(a) / Político / Sindicalista",
    atributo: "social",
    sugestaoUtensilio: "Caderneta sindical e charuto no bolso",
    sugestaoRoupa: "Terno risca de giz e gravata",
  },
  {
    id: "comerciante",
    nome: "Comerciante / Dono de Bar / Vendedor",
    atributo: "social",
    sugestaoUtensilio: "Abridor de garrafas, canivete e bloco de fiado",
    sugestaoRoupa: "Camisa arregaçada e avental de balcão",
  },
  {
    id: "artista",
    nome: "Artista / Músico de Rádio / Ator",
    atributo: "social",
    sugestaoUtensilio: "Gaita de bolso ou diapasão e cigarrilha",
    sugestaoRoupa: "Traje elegante de baile dos anos 50",
  },
  {
    id: "psicologo",
    nome: "Psicólogo / Assistente Social",
    atributo: "social",
    sugestaoUtensilio: "Caderneta clínica e lápis",
    sugestaoRoupa: "Casaco de tweed discreto",
  },
];

// ============================================================================
// PASSO 4 — TABELA A: ORIGENS ESSENCIAIS & TABELA B: SUBCLASSES ESSENCIAIS
// ============================================================================
export const ORIGENS_LIVRO = [
  {
    id: "polivalente",
    nome: "Polivalente (Pág. 32)",
    bonusResumo: "+1 em qualquer Atributo Base",
    atributosOpcoes: ["fisico", "inteligencia", "social"],
    bonusFixo: {},
    requisitoTexto: "Não pode ter Subclasse nem outra Origem.",
    habilidadeNome: "Versátil",
    habilidadeTexto:
      "Você cria o seu próprio estilo! Ganha +4 pontos extras de Perícia (totalizando 14 pontos no Passo 2) para distribuir livremente.",
    semSubclasse: true,
    pontosPericiaExtras: 4,
  },
  {
    id: "imparavel",
    nome: "Imparável (Pág. 33)",
    bonusResumo: "+2 Físico Base",
    atributosOpcoes: [],
    bonusFixo: { fisico: 2 },
    requisitoTexto: "Ter pelo menos 3 em Físico Base.",
    habilidadeNome: "Tanque Humano",
    habilidadeTexto:
      "O seu limite máximo de Físico Base sobe para 25 (bônus +8). Pode usar armas pesadas com uma mão e não sofre redução de movimento ao carregar peso.",
  },
  {
    id: "armeiro",
    nome: "Armeiro (Pág. 34)",
    bonusResumo: "+1 Físico ou +1 Inteligência Base",
    atributosOpcoes: ["fisico", "inteligencia"],
    bonusFixo: {},
    requisitoTexto: "Ter 2 em Armas Brancas, Armas de Fogo ou Arcos.",
    habilidadeNome: "Especialista em Armas",
    habilidadeTexto:
      "Escolha uma Arma Favorita (+1 de bônus permanente nos ataques com ela). Você sabe fazer manutenção de armas e nunca quebra armas em falhas comuns.",
    requerDetalhe: "Arma Favorita (ex.: Revólver .38, Chave de Grifo, Escopeta)",
  },
  {
    id: "piloto",
    nome: "Piloto (Pág. 35)",
    bonusResumo: "+1 Físico e +1 Inteligência Base",
    atributosOpcoes: [],
    bonusFixo: { fisico: 1, inteligencia: 1 },
    requisitoTexto: "Ter pelo menos 3 em Condução.",
    habilidadeNome: "Ás do Volante",
    habilidadeTexto:
      "Reduz em -2 a Dificuldade (CD/DT) de qualquer manobra ou fuga com veículos, gasta menos combustível e consegue fazer reparos rápidos de emergência.",
  },
  {
    id: "socorrista",
    nome: "Socorrista (Pág. 36)",
    bonusResumo: "+2 Inteligência Base",
    atributosOpcoes: [],
    bonusFixo: { inteligencia: 2 },
    requisitoTexto: "Ter pelo menos 3 em Medicina.",
    habilidadeNome: "Mãos que Salvam",
    habilidadeTexto:
      "Cura +5 PV adicionais sempre que aplica ataduras ou kits médicos e tem vantagem para estabilizar aliados com sangramento ou ferimento grave.",
  },
  {
    id: "liderFuncao",
    nome: "Líder-Função (Pág. 37)",
    bonusResumo: "+2 Social Base",
    atributosOpcoes: [],
    bonusFixo: { social: 2 },
    requisitoTexto: "Ter pelo menos 3 em Liderança ou Persuasão.",
    habilidadeNome: "Voz de Comando",
    habilidadeTexto:
      "Uma vez por cena, pode gastar 1 ação para coordenar o grupo, concedendo +1d6 de bônus no próximo teste de um aliado que possa ouvi-lo.",
  },
  {
    id: "dedicado",
    nome: "Dedicado (Pág. 39)",
    bonusResumo: "+2 Inteligência Base",
    atributosOpcoes: [],
    bonusFixo: { inteligencia: 2 },
    requisitoTexto: "Ter pelo menos 4 em Inteligência Base.",
    habilidadeNome: "Mente Brilhante",
    habilidadeTexto:
      "Começa com +3 pontos extras em Perícias de Inteligência e aprende novas receitas ou conhecimentos na metade do tempo.",
    pontosPericiaIntExtras: 3,
  },
];

export const SUBCLASSES_LIVRO = [
  {
    id: "furtivo",
    nome: "Furtivo (Pág. 41)",
    bonusResumo: "+1 FIS ou +1 INT Base",
    atributosOpcoes: ["fisico", "inteligencia"],
    bonusFixo: {},
    requisitoTexto: "Ter pelo menos 3 em Furtividade.",
    habilidadeNome: "Sombra",
    habilidadeTexto:
      "Não sofre penalidade por se mover escondido e causa +1 dado de dano extra ao atingir um alvo desprevenido/surpreso.",
  },
  {
    id: "galeno",
    nome: "Galeno (Pág. 42)",
    bonusResumo: "+1 Inteligência Base",
    atributosOpcoes: [],
    bonusFixo: { inteligencia: 1 },
    requisitoTexto: "Ter pelo menos 2 em Medicina.",
    habilidadeNome: "Médico de Campo",
    habilidadeTexto:
      "Pode improvisar tratamentos médicos sem sofrer penalidade de falta de material e identifica sintomas químicos ou biológicos com facilidade.",
  },
  {
    id: "fabricante",
    nome: "Fabricante (Pág. 43)",
    bonusResumo: "+1 Inteligência Base",
    atributosOpcoes: [],
    bonusFixo: { inteligencia: 1 },
    requisitoTexto: "Ter pelo menos 2 em Fabricação ou Mecânica.",
    habilidadeNome: "Engenhoso",
    habilidadeTexto:
      "Improvisa ferramentas, gazuas, barricadas e coquetéis molotov gastando metade dos materiais comuns.",
  },
  {
    id: "dupla",
    nome: "Dupla (Pág. 45)",
    bonusResumo: "+1 em qualquer Atributo Base",
    atributosOpcoes: ["fisico", "inteligencia", "social"],
    bonusFixo: {},
    requisitoTexto: "Escolher outro jogador como seu Parceiro de Dupla.",
    habilidadeNome: "Sintonia Perfeita",
    habilidadeTexto:
      "Enquanto estiverem próximos e protegendo um ao outro, ambos recebem +1 em testes de ataque e defesa conjunta.",
    requerDetalhe: "Nome do Parceiro de Dupla",
  },
  {
    id: "religioso",
    nome: "Religioso (Pág. 46)",
    bonusResumo: "+1 Social Base",
    atributosOpcoes: [],
    bonusFixo: { social: 1 },
    requisitoTexto: "Seguir uma fé/crença e portar um símbolo sagrado.",
    habilidadeNome: "Fé Inabalável",
    habilidadeTexto:
      "Pode realizar uma oração ou bênção (1x por descanso) para conceder +2 de Consciência e vantagem no próximo Teste de Moral aos aliados próximos.",
    requerDetalhe: "Fé / Símbolo Sagrado portado",
  },
  {
    id: "impostor",
    nome: "Impostor (Pág. 47)",
    bonusResumo: "+1 Social Base",
    atributosOpcoes: [],
    bonusFixo: { social: 1 },
    requisitoTexto: "Ter pelo menos 3 em Enganação.",
    habilidadeNome: "Camaleão Social",
    habilidadeTexto:
      "Mestre em blefes, documentos falsos e disfarces; recebe +1d6 de vantagem ao se passar por outra pessoa ou autoridade.",
  },
  {
    id: "terapeuta",
    nome: "Terapeuta (Pág. 48)",
    bonusResumo: "+1 Social ou +1 INT Base",
    atributosOpcoes: ["social", "inteligencia"],
    bonusFixo: {},
    requisitoTexto: "Ter pelo menos 3 em Psicologia.",
    habilidadeNome: "Conselheiro",
    habilidadeTexto:
      "Ao conversar com um aliado durante um descanso ou crise, remove estados de Ansiedade/Pânico com CD reduzida em -3 e recupera +3 de Consciência dele.",
  },
  {
    id: "musicista",
    nome: "Musicista (Pág. 44)",
    bonusResumo: "+1 Social Base",
    atributosOpcoes: [],
    bonusFixo: { social: 1 },
    requisitoTexto: "Saber tocar um instrumento ou cantar.",
    habilidadeNome: "Melodia de Esperança",
    habilidadeTexto:
      "Tocar ou cantar em momentos de calmaria restaura +2 de Consciência de todo o grupo.",
    requerDetalhe: "Instrumento musical ou estilo de canto",
  },
];

// ============================================================================
// PASSO 5 — QUALIDADES E DEFEITOS RECOMENDADOS (PÁGS. 55–60)
// ============================================================================
export const QUALIDADES_LIVRO = [
  {
    id: "atletaNato",
    nome: "Atleta Nato",
    efeito:
      "+1 FIS Base; +1 em testes de Físico em combate/fuga e +1d6 contra fadiga.",
    bonusAtributo: { fisico: 1 },
  },
  {
    id: "audicaoMelhorada",
    nome: "Audição Melhorada",
    efeito:
      "Sucesso automático em testes de Percepção para escutar ruídos e passos.",
  },
  {
    id: "bomDeMira",
    nome: "Bom de Mira",
    efeito:
      "+2 em Armas de Fogo ao mirar; falha crítica mirando apenas trava o tiro sem efeito grave.",
  },
  {
    id: "bomCuidador",
    nome: "Bom Cuidador (Req: 3 Medicina)",
    efeito: "Reduz em -5 a Dificuldade (CD) de todos os seus testes de Medicina.",
    reqPericia: { id: "medicina", min: 3 },
  },
  {
    id: "condicionamentoFisico",
    nome: "Condicionamento Físico",
    efeito: "+1 FIS Base e +1 Espaço de Item no inventário.",
    bonusAtributo: { fisico: 1 },
    espacoExtra: 1,
  },
  {
    id: "corajoso",
    nome: "Corajoso (Sem fobia/trauma)",
    efeito: "+1 em todas as perícias de Físico e imunidade a entrar em Pânico.",
    bonusPericiasFisico: 1,
  },
  {
    id: "determinacao",
    nome: "Determinação",
    efeito: "+1 ponto em qualquer Atributo Base de sua escolha.",
    escolheAtributo: true,
  },
  {
    id: "discreto",
    nome: "Discreto",
    efeito: "+2 de bônus permanente na perícia Furtividade.",
    bonusPericiaEspecifica: { furtividade: 2 },
  },
  {
    id: "duroDeMatar",
    nome: "Duro de Matar",
    efeito:
      "A primeira vez que uma parte vital cairia a 0 PV, ela fica com 1 PV (uso único).",
  },
  {
    id: "esportivo",
    nome: "Esportivo",
    efeito: "+2 de bônus na Reação Esquivar e +1 contra fadiga.",
  },
  {
    id: "estudado",
    nome: "Estudado",
    efeito:
      "+1 INT Base e +1 de bônus para se lembrar de informações acadêmicas/técnicas.",
    bonusAtributo: { inteligencia: 1 },
  },
  {
    id: "olhosDeAguia",
    nome: "Olhos de Águia",
    efeito: "+1 INT Base, +1 em Percepção e +1 em Armas de Fogo.",
    bonusAtributo: { inteligencia: 1 },
    bonusPericiaEspecifica: { percepcao: 1, armasDeFogo: 1 },
  },
  {
    id: "otimista",
    nome: "Otimista",
    efeito:
      "Tem vantagem em todos os Testes de Moral (rola 1d6 duas vezes e pega o menor).",
  },
  {
    id: "zeloso",
    nome: "Zeloso",
    efeito:
      "Ao defender alguém/algo sob seu cuidado, ganha +3 de Consciência e +1d6 em Social.",
  },
];

export const DEFEITOS_LIVRO = [
  {
    id: "ansiedade",
    nome: "Ansiedade",
    efeito:
      "Após cenas de adrenalina ou gatilho tenso, precisa ser acalmado (Psicologia CD 15).",
  },
  {
    id: "barulhento",
    nome: "Barulhento",
    efeito: "Sua Furtividade é 0 e você tem dificuldade em agir em silêncio.",
    zeraFurtividade: true,
  },
  {
    id: "cicatrizLesao",
    nome: "Cicatriz / Lesão Antiga",
    efeito: "Escolha um membro do corpo para ter -10 no limite máximo de PV.",
    escolheMembroLesao: true,
  },
  {
    id: "covarde",
    nome: "Covarde",
    efeito: "Perde -3 de Consciência ao entrar em combate e tem -3 contra Pânico.",
  },
  {
    id: "distraido",
    nome: "Distraído",
    efeito:
      "-2 em Percepção (ver) e precisa passar em INT CD 12 para notar detalhes sutis.",
    bonusPericiaEspecifica: { percepcao: -2 },
  },
  {
    id: "estomagoSensivel",
    nome: "Estômago Sensível",
    efeito:
      "-5 em testes de Físico diante de cenas grotescas/cadáveres (passa após 1d2 rodadas).",
  },
  {
    id: "fobia",
    nome: "Fobia (Sangue, Escuro, Lugares Fechados, etc.)",
    efeito:
      "Diante da fobia, deve passar em INT CD 17 ou entra em Pânico até ser ajudado.",
    requerDetalhe: "Qual é a fobia? (ex.: Sangue, Escuro, Lugares Fechados)",
  },
  {
    id: "honraCodigoMoral",
    nome: "Honra / Código Moral",
    efeito:
      "Segue um código rígido (ex.: nunca mentir, nunca abandonar um ferido) sob pena de perder Moral.",
    requerDetalhe: "Qual é o código moral rígido?",
  },
  {
    id: "insone",
    nome: "Insone",
    efeito:
      "Dificuldade para dormir em locais tensos (FIS CD 16 para descansar plenamente).",
  },
  {
    id: "miope",
    nome: "Míope (Usa Óculos)",
    efeito:
      "-2 em Percepção e desvantagem para acertar de longe caso seus óculos caiam/quebrem.",
    bonusPericiaEspecifica: { percepcao: -2 },
  },
  {
    id: "pessimaMira",
    nome: "Péssima Mira",
    efeito: "Não recebe bônus ao mirar com armas de fogo à distância.",
  },
  {
    id: "sedentario",
    nome: "Sedentário",
    efeito: "-3 no Físico Base (para personagens puramente intelectuais/sociais).",
    bonusAtributo: { fisico: -3 },
  },
  {
    id: "viciado",
    nome: "Viciado (Cigarro, Café forte, Álcool, Calmante)",
    efeito:
      "Sofre -1 em todos os testes caso passe o dia sem consumir o seu vício.",
    requerDetalhe: "Qual é o vício? (ex.: Cigarro Continental, Café forte, Álcool)",
  },
  {
    id: "passadoSombrio",
    nome: "Passado Sombrio / Dívida",
    efeito:
      "Guarda um segredo, dívida ou inimigo em São Paulo que pode complicar sua vida.",
    requerDetalhe: "Qual é o segredo, dívida ou inimigo em São Paulo?",
  },
];

// ============================================================================
// PASSO 6 — PARTES DO CORPO E CÁLCULO DE PV + ESPAÇOS DE INVENTÁRIO
// ============================================================================
export const PARTES_DO_CORPO = [
  {
    id: "cabeca",
    nome: "Cabeça (Vital)",
    vital: true,
    basePv: 20,
    formula: "20 + Físico Base",
    efeitoZeroPv: "Inconsciência / Risco de Morte imediata.",
  },
  {
    id: "torso",
    nome: "Torso / Tronco (Vital)",
    vital: true,
    basePv: 35,
    formula: "35 + Físico Base",
    efeitoZeroPv: "Colapso / Hemorragia grave (precisa ser estabilizado).",
  },
  {
    id: "bracoDireito",
    nome: "Braço Direito",
    vital: false,
    basePv: 15,
    formula: "15 + Físico Base",
    efeitoZeroPv: "Braço inutilizado (não pode segurar armas/objetos com ele).",
  },
  {
    id: "bracoEsquerdo",
    nome: "Braço Esquerdo",
    vital: false,
    basePv: 15,
    formula: "15 + Físico Base",
    efeitoZeroPv: "Braço inutilizado (não pode usar armas de 2 mãos).",
  },
  {
    id: "pernaDireita",
    nome: "Perna Direita",
    vital: false,
    basePv: 15,
    formula: "15 + Físico Base",
    efeitoZeroPv: "Perna inutilizada (movimento cai pela metade; não pode correr).",
  },
  {
    id: "pernaEsquerda",
    nome: "Perna Esquerda",
    vital: false,
    basePv: 15,
    formula: "15 + Físico Base",
    efeitoZeroPv: "Perna inutilizada (se ambas zerarem, só pode se arrastar).",
  },
];

export const ESTADO_INICIAL_ANO_UM = {
  sistema: "ano1",
  nome: "",
  nomeJogador: "",
  idade: "",
  bairro1950: "",
  retratoBase64: "",
  conexaoComGrupo: "",

  // Seção 1: Gancho do Comício de 1950
  ganchoId: 1,
  ganchoResposta: "",

  // Atributos Base (1 inicial em cada + 6 pontos livres distribuídos pelo jogador)
  pontosAtributoDist: {
    fisico: 0,
    inteligencia: 0,
    social: 0,
  },

  // Perícias (10 pontos livres, máx 6 na mesma perícia)
  periciasPontos: {
    acrobacia: 0,
    armasBrancas: 0,
    atletismo: 0,
    bloqueio: 0,
    briga: 0,
    esquiva: 0,
    folegoVigor: 0,
    prestidigitacao: 0,
    armasDeFogo: 0,
    conducao: 0,
    conhecimentos: 0,
    cozinha: 0,
    fabricacao: 0,
    furtividade: 0,
    mecanica: 0,
    medicina: 0,
    percepcao: 0,
    sobrevivencia: 0,
    adestramento: 0,
    charmeSeducao: 0,
    enganacao: 0,
    intimidacao: 0,
    intuicao: 0,
    lideranca: 0,
    persuasao: 0,
    psicologia: 0,
  },

  // Profissão de 1950
  modalidadeProfissao: "atual", // 'atual' (+2 Atributo e +1 Defeito) | 'ex' (+1 Atributo, sem defeito extra)
  profissaoId: "operario",

  // Origem e Subclasses
  modoEstilo: "origem_subclasse", // 'origem_subclasse' | 'polivalente' | 'duas_subclasses'
  origemId: "imparavel",
  origemAtributoEscolha: "fisico",
  origemDetalhe: "",
  subclasse1Id: "furtivo",
  subclasse1AtributoEscolha: "fisico",
  subclasse1Detalhe: "",
  subclasse2Id: "galeno",
  subclasse2AtributoEscolha: "inteligencia",
  subclasse2Detalhe: "",

  // Moral, Consciência, Alinhamento, Qualidades e Defeitos (campos de escrita vazios)
  moralAtual: 3,
  conscienciaAtual: 1,
  moralDourada: 0,
  ancorasMoral: ["", "", ""],
  alinhamentoCerto: "",
  alinhamentoRepudia: "",
  alinhamentoTeme: "",

  qualidadesIds: [],
  determinacaoAtributo: "fisico",
  defeitosIds: [],
  membroCicatrizId: "pernaEsquerda",
  detalhesDefeitos: {},

  // Kit Inicial de 1950 no Bolso no Dia do Comício (campos de escrita vazios)
  kitRoupa1950: "",
  kitDocumentosDinheiro: "",
  kitObjetoSentimental: "",
  kitUtensilioProfissao: "",
  notasExtras: "",
};

// ============================================================================
// MOTOR DE CÁLCULO COMPLETO FIEL ÀS TABELAS DO GUIA (PASSOS 1 A 6)
// ============================================================================
export function calcularFichaAnoUm(dados) {
  const d = { ...ESTADO_INICIAL_ANO_UM, ...dados };

  const bonusZero = () => ({ fisico: 0, inteligencia: 0, social: 0 });
  const bonusInicial = { fisico: 1, inteligencia: 0 + 1, social: 1 };
  const bonusProfissao = bonusZero();
  const bonusOrigem = bonusZero();
  const bonusSubclasse1 = bonusZero();
  const bonusSubclasse2 = bonusZero();
  const bonusQualidadesDefeitos = bonusZero();

  // 1. Pontos Livres de Atributo (6 pontos)
  const distFis = Number(d.pontosAtributoDist?.fisico ?? 0);
  const distInt = Number(d.pontosAtributoDist?.inteligencia ?? 0);
  const distSoc = Number(d.pontosAtributoDist?.social ?? 0);
  const pontosAtributoGastos = distFis + distInt + distSoc;
  const pontosAtributoRestantes = 6 - pontosAtributoGastos;

  // 2. Bônus da Profissão (Profissão Atual = +2 | Ex-Profissão = +1)
  const profissaoObj =
    PROFISSOES_1950.find((p) => p.id === d.profissaoId) || PROFISSOES_1950[0];
  const bonusProfissaoValor = d.modalidadeProfissao === "atual" ? 2 : 1;
  if (profissaoObj.atributo === "fisico") bonusProfissao.fisico += bonusProfissaoValor;
  if (profissaoObj.atributo === "inteligencia") bonusProfissao.inteligencia += bonusProfissaoValor;
  if (profissaoObj.atributo === "social") bonusProfissao.social += bonusProfissaoValor;

  // 3. Bônus de Origem e Subclasses
  const modoEstilo = d.modoEstilo || "origem_subclasse";

  const origemObj =
    modoEstilo === "duas_subclasses"
      ? null
      : modoEstilo === "polivalente"
        ? ORIGENS_LIVRO.find((o) => o.id === "polivalente")
        : ORIGENS_LIVRO.find(
            (o) => o.id === d.origemId && o.id !== "polivalente"
          ) || ORIGENS_LIVRO[1];

  const subclasse1Obj =
    modoEstilo === "polivalente"
      ? null
      : SUBCLASSES_LIVRO.find((s) => s.id === d.subclasse1Id) || null;

  const subclasse2Obj =
    modoEstilo === "duas_subclasses" &&
    d.subclasse2Id &&
    d.subclasse2Id !== d.subclasse1Id
      ? SUBCLASSES_LIVRO.find((s) => s.id === d.subclasse2Id) || null
      : null;

  const extrairBonusItem = (item, escolhaAtributo, destino) => {
    if (!item) return;
    if (item.bonusFixo?.fisico) destino.fisico += item.bonusFixo.fisico;
    if (item.bonusFixo?.inteligencia)
      destino.inteligencia += item.bonusFixo.inteligencia;
    if (item.bonusFixo?.social) destino.social += item.bonusFixo.social;
    if (item.atributosOpcoes?.length > 0) {
      const attr = item.atributosOpcoes.includes(escolhaAtributo)
        ? escolhaAtributo
        : item.atributosOpcoes[0];
      if (attr === "fisico") destino.fisico += 1;
      if (attr === "inteligencia") destino.inteligencia += 1;
      if (attr === "social") destino.social += 1;
    }
  };

  extrairBonusItem(origemObj, d.origemAtributoEscolha, bonusOrigem);
  extrairBonusItem(subclasse1Obj, d.subclasse1AtributoEscolha, bonusSubclasse1);
  extrairBonusItem(subclasse2Obj, d.subclasse2AtributoEscolha, bonusSubclasse2);

  // 4. Bônus de Qualidades e Defeitos
  const qualidadesSelecionadas = (d.qualidadesIds || [])
    .map((id) => QUALIDADES_LIVRO.find((q) => q.id === id))
    .filter(Boolean);
  const defeitosSelecionados = (d.defeitosIds || [])
    .map((id) => DEFEITOS_LIVRO.find((df) => df.id === id))
    .filter(Boolean);

  for (const q of qualidadesSelecionadas) {
    if (q.bonusAtributo?.fisico)
      bonusQualidadesDefeitos.fisico += q.bonusAtributo.fisico;
    if (q.bonusAtributo?.inteligencia)
      bonusQualidadesDefeitos.inteligencia += q.bonusAtributo.inteligencia;
    if (q.bonusAtributo?.social)
      bonusQualidadesDefeitos.social += q.bonusAtributo.social;
    if (q.escolheAtributo) {
      const attr = d.determinacaoAtributo || "fisico";
      if (attr === "fisico") bonusQualidadesDefeitos.fisico += 1;
      if (attr === "inteligencia") bonusQualidadesDefeitos.inteligencia += 1;
      if (attr === "social") bonusQualidadesDefeitos.social += 1;
    }
  }

  for (const df of defeitosSelecionados) {
    if (df.bonusAtributo?.fisico)
      bonusQualidadesDefeitos.fisico += df.bonusAtributo.fisico;
    if (df.bonusAtributo?.inteligencia)
      bonusQualidadesDefeitos.inteligencia += df.bonusAtributo.inteligencia;
    if (df.bonusAtributo?.social)
      bonusQualidadesDefeitos.social += df.bonusAtributo.social;
  }

  const baseAntesLivres = {
    fisico:
      bonusInicial.fisico +
      bonusProfissao.fisico +
      bonusOrigem.fisico +
      bonusSubclasse1.fisico +
      bonusSubclasse2.fisico +
      bonusQualidadesDefeitos.fisico,
    inteligencia:
      bonusInicial.inteligencia +
      bonusProfissao.inteligencia +
      bonusOrigem.inteligencia +
      bonusSubclasse1.inteligencia +
      bonusSubclasse2.inteligencia +
      bonusQualidadesDefeitos.inteligencia,
    social:
      bonusInicial.social +
      bonusProfissao.social +
      bonusOrigem.social +
      bonusSubclasse1.social +
      bonusSubclasse2.social +
      bonusQualidadesDefeitos.social,
  };

  let fis = baseAntesLivres.fisico + distFis;
  let int = baseAntesLivres.inteligencia + distInt;
  let soc = baseAntesLivres.social + distSoc;

  const isImparavel = origemObj?.id === "imparavel";
  fis = Math.max(0, Math.min(isImparavel ? 25 : 20, fis));
  int = Math.max(0, Math.min(20, int));
  soc = Math.max(0, Math.min(20, soc));

  const convFis = converterAtributoAnoUm(fis, isImparavel);
  const convInt = converterAtributoAnoUm(int, false);
  const convSoc = converterAtributoAnoUm(soc, false);

  // 5. Cálculo de Perícias (Passo 2)
  const orcamentoPericiasBase =
    10 +
    (origemObj?.pontosPericiaExtras || 0) +
    (origemObj?.pontosPericiaIntExtras || 0);

  const temBarulhento = defeitosSelecionados.some((df) => df.zeraFurtividade);
  const temCorajoso = qualidadesSelecionadas.some((q) => q.bonusPericiasFisico);

  let pontosPericiaGastos = 0;
  let pontosPericiaIntGastos = 0;

  const periciasCalculadas = PERICIAS_ANO_UM.map((per) => {
    const brutos = Math.max(
      0,
      Math.min(6, Number(d.periciasPontos?.[per.id] ?? 0))
    );
    pontosPericiaGastos += brutos;
    if (per.atributo === "inteligencia") {
      pontosPericiaIntGastos += brutos;
    }

    const pontosEfetivos =
      per.id === "furtividade" && temBarulhento ? 0 : brutos;

    let bonusExtraQualidadeDefeito = 0;
    if (temCorajoso && per.atributo === "fisico") {
      bonusExtraQualidadeDefeito += 1;
    }
    for (const q of qualidadesSelecionadas) {
      if (q.bonusPericiaEspecifica?.[per.id]) {
        bonusExtraQualidadeDefeito += q.bonusPericiaEspecifica[per.id];
      }
    }
    for (const df of defeitosSelecionados) {
      if (df.bonusPericiaEspecifica?.[per.id]) {
        bonusExtraQualidadeDefeito += df.bonusPericiaEspecifica[per.id];
      }
    }

    const bonusAtributo =
      per.atributo === "fisico"
        ? convFis.bonus ?? 0
        : per.atributo === "inteligencia"
          ? convInt.bonus ?? 0
          : convSoc.bonus ?? 0;

    if (pontosEfetivos === 0) {
      const modLeigo = -3 + bonusExtraQualidadeDefeito;
      return {
        ...per,
        pontos: brutos,
        pontosEfetivos: 0,
        leigo: true,
        bonusAtributo: 0,
        bonusExtra: bonusExtraQualidadeDefeito,
        modTotal: modLeigo,
        formulaRolagem: `2d6 ${modLeigo >= 0 ? `+ ${modLeigo}` : `- ${Math.abs(modLeigo)}`} (Leigo)`,
      };
    }

    const modTotal =
      bonusAtributo + pontosEfetivos + bonusExtraQualidadeDefeito;
    return {
      ...per,
      pontos: brutos,
      pontosEfetivos,
      leigo: false,
      bonusAtributo,
      bonusExtra: bonusExtraQualidadeDefeito,
      modTotal,
      formulaRolagem: `2d6 ${modTotal >= 0 ? `+ ${modTotal}` : `- ${Math.abs(modTotal)}`}`,
    };
  });

  const pontosPericiaRestantes = orcamentoPericiasBase - pontosPericiaGastos;

  // 6. Validação de Qualidades vs Defeitos (Passo 5)
  const defeitosObrigatorios =
    qualidadesSelecionadas.length + (d.modalidadeProfissao === "atual" ? 1 : 0);

  // 7. Cálculo de PV por Parte do Corpo e Inventário (Passo 6)
  const temCicatriz = defeitosSelecionados.some((df) => df.escolheMembroLesao);
  const partesCorpoCalculadas = PARTES_DO_CORPO.map((parte) => {
    const penalidadeCicatriz =
      temCicatriz && d.membroCicatrizId === parte.id ? 10 : 0;
    const pvMax = Math.max(1, parte.basePv + fis - penalidadeCicatriz);
    return {
      ...parte,
      penalidadeCicatriz,
      pvMax,
    };
  });

  const espacosBase =
    fis <= 3 ? 3 : fis <= 6 ? 4 : fis <= 9 ? 5 : 6;
  const espacosExtras = qualidadesSelecionadas.reduce(
    (acc, q) => acc + (q.espacoExtra || 0),
    0
  );
  const espacosInventario = espacosBase + espacosExtras;

  return {
    atributosFinais: {
      fisico: fis,
      inteligencia: int,
      social: soc,
    },
    detalhamentoAtributos: {
      inicial: bonusInicial,
      profissao: bonusProfissao,
      origem: bonusOrigem,
      subclasse1: bonusSubclasse1,
      subclasse2: bonusSubclasse2,
      qualidadesDefeitos: bonusQualidadesDefeitos,
      baseAntesLivres,
      livres: {
        fisico: distFis,
        inteligencia: distInt,
        social: distSoc,
      },
    },
    conversao: {
      fisico: convFis,
      inteligencia: convInt,
      social: convSoc,
    },
    pontosAtributoGastos,
    pontosAtributoRestantes,
    orcamentoPericiasBase,
    pontosPericiaGastos,
    pontosPericiaIntGastos,
    pontosPericiaRestantes,
    periciasCalculadas,
    profissaoObj,
    bonusProfissaoValor,
    modoEstilo,
    origemObj,
    subclasse1Obj,
    subclasse2Obj,
    qualidadesSelecionadas,
    defeitosSelecionados,
    defeitosObrigatorios,
    partesCorpoCalculadas,
    pvPartes: partesCorpoCalculadas,
    espacosInventario,
  };
}

// ============================================================================
// GERADOR DE PDF NATIVO ESTILIZADO COM TEMA ZUMBI (APOCALIPSE 1950)
// Renderiza 2 páginas A4 em alta resolução (1240x1754) e empacota em .PDF real
// ============================================================================

function quebrarLinhasCanvas(ctx, texto, maxWidth) {
  const palavras = String(texto || "—").split(/\s+/);
  const linhas = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > maxWidth && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas.length > 0 ? linhas : ["—"];
}

function desenharFundoZumbiA4(ctx, W, H, numeroPagina) {
  // Fundo papel envelhecido escuro / dossiê de quarentena 1950
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#12100e");
  grad.addColorStop(0.5, "#191512");
  grad.addColorStop(1, "#0e0c0a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Manchas de sangue / infecção zumbi nos cantos
  const manchas = [
    { x: W - 110, y: 95, r: 160, cor: "rgba(136, 19, 25, 0.32)" },
    { x: 90, y: H - 120, r: 190, cor: "rgba(110, 15, 20, 0.25)" },
    { x: W - 180, y: H - 220, r: 140, cor: "rgba(65, 90, 35, 0.14)" },
    { x: 240, y: 120, r: 90, cor: "rgba(150, 20, 20, 0.18)" },
  ];
  for (const m of manchas) {
    const rg = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.r);
    rg.addColorStop(0, m.cor);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Respingos de sangue estilizados
  ctx.fillStyle = "rgba(155, 22, 28, 0.38)";
  const gotas = [
    [W - 70, 58, 9],
    [W - 52, 82, 5],
    [W - 88, 92, 4],
    [W - 140, 66, 6],
    [72, H - 70, 8],
    [95, H - 55, 4],
    [55, H - 95, 5],
  ];
  for (const [gx, gy, gr] of gotas) {
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moldura dupla de dossiê militar / hospitalar de 1950
  ctx.strokeStyle = "#5c1d1d";
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, W - 64, H - 64);

  ctx.strokeStyle = "rgba(212, 190, 152, 0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Rodapé do dossiê
  ctx.fillStyle = "#8a7e6d";
  ctx.font = "bold 15px monospace";
  ctx.fillText(
    "ANO UM — APOCALIPSE RPG (V0.9.4b) • SÃO PAULO, FEVEREIRO DE 1950 • DR. RAY GRAVE & CIA",
    56,
    H - 48
  );
  ctx.fillText(`PÁG. ${numeroPagina}/2`, W - 135, H - 48);
}

function desenharCaixaSecao(ctx, x, y, w, h, titulo, corBorda = "#7f1d1d") {
  ctx.fillStyle = "rgba(28, 24, 21, 0.92)";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = corBorda;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Faixa de título
  ctx.fillStyle = corBorda;
  ctx.fillRect(x, y, w, 34);

  ctx.fillStyle = "#f5ebe0";
  ctx.font = "bold 17px monospace";
  ctx.fillText(titulo.toUpperCase(), x + 14, y + 23);
}

function carregarImagemElemento(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function montarPdfBinarioDeJpegs(paginasDataUrl) {
  const paginasBytes = paginasDataUrl.map((dataUrl) => {
    const base64 = dataUrl.split(",")[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  });

  const W_PT = 595.28;
  const H_PT = 841.89;
  const numPaginas = paginasBytes.length;

  // Objetos PDF:
  // 1: Catalog
  // 2: Pages
  // Para cada página i (0..numPaginas-1):
  //   objPage = 3 + i * 3
  //   objContent = 4 + i * 3
  //   objImage = 5 + i * 3
  const totalObjetos = 2 + numPaginas * 3;
  const offsets = new Array(totalObjetos + 1).fill(0);
  const chunks = [];
  let tamanhoAtual = 0;

  const encoder = new TextEncoder();
  const pushTexto = (str) => {
    const b = encoder.encode(str);
    chunks.push(b);
    tamanhoAtual += b.length;
  };
  const pushBytes = (uint8) => {
    chunks.push(uint8);
    tamanhoAtual += uint8.length;
  };

  pushTexto("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  // Obj 1: Catalog
  offsets[1] = tamanhoAtual;
  pushTexto("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Obj 2: Pages
  const kidsRefs = Array.from(
    { length: numPaginas },
    (_, i) => `${3 + i * 3} 0 R`
  ).join(" ");
  offsets[2] = tamanhoAtual;
  pushTexto(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${numPaginas} >>\nendobj\n`
  );

  for (let i = 0; i < numPaginas; i++) {
    const objPage = 3 + i * 3;
    const objContent = 4 + i * 3;
    const objImage = 5 + i * 3;
    const imgBytes = paginasBytes[i];
    const nomeImg = `/Im${i + 1}`;

    const conteudoStream = `q\n${W_PT.toFixed(2)} 0 0 ${H_PT.toFixed(2)} 0 0 cm\n${nomeImg} Do\nQ\n`;

    offsets[objPage] = tamanhoAtual;
    pushTexto(
      `${objPage} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${W_PT.toFixed(2)} ${H_PT.toFixed(2)} ] /Resources << /XObject << ${nomeImg} ${objImage} 0 R >> >> /Contents ${objContent} 0 R >>\nendobj\n`
    );

    offsets[objContent] = tamanhoAtual;
    pushTexto(
      `${objContent} 0 obj\n<< /Length ${conteudoStream.length} >>\nstream\n${conteudoStream}endstream\nendobj\n`
    );

    offsets[objImage] = tamanhoAtual;
    pushTexto(
      `${objImage} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
    );
    pushBytes(imgBytes);
    pushTexto("\nendstream\nendobj\n");
  }

  const startXref = tamanhoAtual;
  pushTexto(`xref\n0 ${totalObjetos + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= totalObjetos; id++) {
    const offStr = String(offsets[id]).padStart(10, "0");
    pushTexto(`${offStr} 00000 n \n`);
  }
  pushTexto(
    `trailer\n<< /Size ${totalObjetos + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`
  );

  return new Blob(chunks, { type: "application/pdf" });
}

export async function gerarPdfFichaAnoUm(dadosBrutos, calculos) {
  const dados = { ...ESTADO_INICIAL_ANO_UM, ...dadosBrutos };
  const calc = calculos || calcularFichaAnoUm(dados);
  const W = 1240;
  const H = 1754;

  const imgRetrato = await carregarImagemElemento(dados.retratoBase64);
  const ganchoObj =
    GANCHOS_1950.find((g) => Number(g.id) === Number(dados.ganchoId)) ||
    GANCHOS_1950[0];

  // =========================================================================
  // PÁGINA 1: IDENTIFICAÇÃO, RETRATO, ATRIBUTOS, SAÚDE POR MEMBRO, MORAL E PERÍCIAS
  // =========================================================================
  const canvas1 = document.createElement("canvas");
  canvas1.width = W;
  canvas1.height = H;
  const ctx1 = canvas1.getContext("2d");

  desenharFundoZumbiA4(ctx1, W, H, 1);

  // Cabeçalho Zumbi 1950
  ctx1.fillStyle = "#7f1d1d";
  ctx1.fillRect(56, 56, W - 112, 92);
  ctx1.strokeStyle = "#dc2626";
  ctx1.lineWidth = 2;
  ctx1.strokeRect(56, 56, W - 112, 92);

  ctx1.fillStyle = "#fca5a5";
  ctx1.font = "bold 15px monospace";
  ctx1.fillText(
    "☣ DOSSIÊ DE SOBREVIVENTE • ZONA DE SURTO: SÃO MIGUEL PAULISTA (FEV. 1950)",
    76,
    84
  );

  ctx1.fillStyle = "#ffffff";
  ctx1.font = "bold 34px Georgia, serif";
  ctx1.fillText(
    (dados.nome || "SOBREVIVENTE SEM NOME").toUpperCase(),
    76,
    128
  );

  // Carimbo "QUARENTENA / CASO 1950"
  ctx1.save();
  ctx1.translate(W - 220, 102);
  ctx1.rotate(-0.08);
  ctx1.strokeStyle = "#f87171";
  ctx1.lineWidth = 3;
  ctx1.strokeRect(-115, -24, 230, 48);
  ctx1.fillStyle = "#fecaca";
  ctx1.font = "bold 18px monospace";
  ctx1.fillText("☣ ANO UM • 1950", -88, 6);
  ctx1.restore();

  // Bloco Retrato (Esquerda) + Identidade/Profissão/Estilo (Direita)
  desenharCaixaSecao(ctx1, 56, 168, 260, 290, "Foto 3×4 (1950)", "#52525b");
  if (imgRetrato) {
    ctx1.save();
    ctx1.beginPath();
    ctx1.rect(70, 214, 232, 230);
    ctx1.clip();
    const scale = Math.max(232 / imgRetrato.width, 230 / imgRetrato.height);
    const dw = imgRetrato.width * scale;
    const dh = imgRetrato.height * scale;
    ctx1.drawImage(
      imgRetrato,
      70 + (232 - dw) / 2,
      214 + (230 - dh) / 2,
      dw,
      dh
    );
    ctx1.restore();
  } else {
    ctx1.fillStyle = "#27272a";
    ctx1.fillRect(70, 214, 232, 230);
    ctx1.fillStyle = "#71717a";
    ctx1.font = "bold 18px monospace";
    ctx1.fillText("SEM FOTO 3×4", 122, 332);
  }

  desenharCaixaSecao(
    ctx1,
    334,
    168,
    W - 390,
    290,
    "Registro Civil & Ocupação em 1950",
    "#7f1d1d"
  );

  const infoLinhas = [
    [
      `JOGADOR: ${dados.nomeJogador || "—"}`,
      `IDADE: ${dados.idade || "—"} anos`,
      `LOCAL: ${dados.bairro1950 || "São Miguel Paulista"}`,
    ],
    [
      `${dados.modalidadeProfissao === "atual" ? "PROFISSÃO ATUAL (+2 Attr / +1 Defeito / +1d6 Ofício)" : "EX-PROFISSÃO (+1 Attr / Sem Defeito Extra)"}:`,
    ],
    [`  → ${calc.profissaoObj.nome}`],
    [
      `ESTILO DE SOBREVIVENTE (PASSO 4): ${
        calc.modoEstilo === "polivalente"
          ? `Origem Polivalente (+4 Perícias)`
          : calc.modoEstilo === "duas_subclasses"
            ? `2 Subclasses: ${calc.subclasse1Obj?.nome || ""} + ${calc.subclasse2Obj?.nome || ""}`
            : `${calc.origemObj?.nome || ""} + ${calc.subclasse1Obj?.nome || ""}`
      }`,
    ],
    [`GANCHO NO COMÍCIO (#${ganchoObj.id}): ${ganchoObj.titulo}`],
  ];

  let iy = 228;
  ctx1.font = "bold 17px monospace";
  ctx1.fillStyle = "#e7e5e4";
  ctx1.fillText(infoLinhas[0].join("   •   "), 352, iy);

  iy += 34;
  ctx1.fillStyle = "#fca5a5";
  ctx1.font = "bold 15px monospace";
  ctx1.fillText(infoLinhas[1][0], 352, iy);

  iy += 24;
  ctx1.fillStyle = "#ffffff";
  ctx1.font = "bold 18px sans-serif";
  ctx1.fillText(infoLinhas[2][0], 352, iy);

  iy += 32;
  ctx1.fillStyle = "#fcd34d";
  ctx1.font = "bold 16px monospace";
  ctx1.fillText(infoLinhas[3][0], 352, iy);

  iy += 32;
  ctx1.fillStyle = "#d6d3d1";
  ctx1.font = "bold 15px monospace";
  ctx1.fillText(infoLinhas[4][0], 352, iy);

  if (dados.ganchoResposta) {
    iy += 24;
    ctx1.fillStyle = "#a8a29e";
    ctx1.font = "italic 15px Georgia, serif";
    const linhasGancho = quebrarLinhasCanvas(
      ctx1,
      `"${dados.ganchoResposta}"`,
      W - 425
    ).slice(0, 2);
    for (const l of linhasGancho) {
      ctx1.fillText(l, 352, iy);
      iy += 20;
    }
  }

  // PASSO 1: ATRIBUTOS BASE E CONVERSÃO 2d6
  desenharCaixaSecao(
    ctx1,
    56,
    476,
    W - 112,
    162,
    "Passo 1 — Atributos Base, Bônus no Dado (2d6) e Ações por Turno",
    "#7f1d1d"
  );

  const cardsAttr = [
    {
      chave: "fisico",
      titulo: "FÍSICO (FIS)",
      valor: calc.atributosFinais.fisico,
      conv: calc.conversao.fisico,
      extra: `${calc.conversao.fisico.acoesFisico} • ${calc.espacosInventario} Espaços no Bolso`,
      cor: "#ef4444",
    },
    {
      chave: "inteligencia",
      titulo: "INTELIGÊNCIA (INT)",
      valor: calc.atributosFinais.inteligencia,
      conv: calc.conversao.inteligencia,
      extra: calc.conversao.inteligencia.nivel,
      cor: "#38bdf8",
    },
    {
      chave: "social",
      titulo: "SOCIAL (SOC)",
      valor: calc.atributosFinais.social,
      conv: calc.conversao.social,
      extra: calc.conversao.social.nivel,
      cor: "#fbbf24",
    },
  ];

  cardsAttr.forEach((c, idx) => {
    const cx = 74 + idx * 368;
    const cy = 522;
    ctx1.fillStyle = "#141210";
    ctx1.fillRect(cx, cy, 350, 102);
    ctx1.strokeStyle = c.cor;
    ctx1.lineWidth = 1.5;
    ctx1.strokeRect(cx, cy, 350, 102);

    ctx1.fillStyle = c.cor;
    ctx1.font = "bold 16px monospace";
    ctx1.fillText(c.titulo, cx + 14, cy + 26);

    ctx1.fillStyle = "#ffffff";
    ctx1.font = "bold 36px monospace";
    ctx1.fillText(`${c.valor}`, cx + 14, cy + 68);

    ctx1.fillStyle = "#e7e5e4";
    ctx1.font = "bold 20px monospace";
    ctx1.fillText(`Bônus 2d6: ${c.conv.bonusTexto}`, cx + 82, cy + 62);

    ctx1.fillStyle = "#a8a29e";
    ctx1.font = "13px sans-serif";
    ctx1.fillText(c.extra.slice(0, 46), cx + 14, cy + 90);
  });

  // PASSO 6 (ESQUERDA): VIDA POR PARTE DO CORPO & LIMIAR DA DOR
  desenharCaixaSecao(
    ctx1,
    56,
    656,
    550,
    420,
    "Passo 6 — Pontos de Vida por Parte do Corpo",
    "#991b1b"
  );

  let py = 714;
  for (const parte of calc.partesCorpoCalculadas) {
    ctx1.fillStyle = parte.vital
      ? "rgba(127, 29, 29, 0.32)"
      : "rgba(39, 39, 42, 0.65)";
    ctx1.fillRect(72, py - 22, 518, 48);
    ctx1.strokeStyle = parte.vital ? "#dc2626" : "#52525b";
    ctx1.lineWidth = 1;
    ctx1.strokeRect(72, py - 22, 518, 48);

    ctx1.fillStyle = "#ffffff";
    ctx1.font = "bold 16px monospace";
    ctx1.fillText(parte.nome, 84, py - 2);

    ctx1.fillStyle = "#fca5a5";
    ctx1.font = "bold 20px monospace";
    ctx1.fillText(
      `[   / ${parte.pvMax} PV ]`,
      425,
      py + 2
    );

    ctx1.fillStyle = "#a8a29e";
    ctx1.font = "12px sans-serif";
    ctx1.fillText(`0 PV: ${parte.efeitoZeroPv}`, 84, py + 17);
    py += 54;
  }

  ctx1.fillStyle = "#fbbf24";
  ctx1.font = "bold 13px monospace";
  ctx1.fillText(
    "⚠ LIMIAR DA DOR: Golpe único > 15 dano faz perder o próximo turno/reação!",
    72,
    1056
  );

  // SEÇÃO 2 (DIREITA): MORAL (1-6), CONSCIÊNCIA (1-12) E TESTE DE MORAL (1d6)
  desenharCaixaSecao(
    ctx1,
    624,
    656,
    560,
    420,
    "Seção 2 — Moral (1–6), Consciência (1–12) e Âncoras",
    "#3f6212"
  );

  ctx1.fillStyle = "#ecfccb";
  ctx1.font = "bold 16px monospace";
  ctx1.fillText(
    `MORAL ATUAL: ${dados.moralAtual} / 6   •   MORAL DOURADA: ${dados.moralDourada}`,
    642,
    714
  );

  // Caixinhas visuais de Moral 1..6
  for (let m = 1; m <= 6; m++) {
    const mx = 642 + (m - 1) * 86;
    const ativo = m <= dados.moralAtual;
    ctx1.fillStyle = ativo ? "#4d7c0f" : "#1c1917";
    ctx1.fillRect(mx, 726, 76, 30);
    ctx1.strokeStyle = ativo ? "#a3e635" : "#44403c";
    ctx1.strokeRect(mx, 726, 76, 30);
    ctx1.fillStyle = "#ffffff";
    ctx1.font = "bold 14px monospace";
    ctx1.fillText(`M${m}`, mx + 26, 746);
  }

  ctx1.fillStyle = "#fde68a";
  ctx1.font = "bold 15px monospace";
  ctx1.fillText(
    `CONSCIÊNCIA: ${dados.conscienciaAtual} / 12 (Ao chegar em 12 = +1 Moral e volta a 1)`,
    642,
    782
  );

  for (let c = 1; c <= 12; c++) {
    const cx = 642 + (c - 1) * 43;
    const ativo = c <= dados.conscienciaAtual;
    ctx1.fillStyle = ativo ? "#b45309" : "#1c1917";
    ctx1.fillRect(cx, 792, 38, 24);
    ctx1.strokeStyle = ativo ? "#fbbf24" : "#44403c";
    ctx1.strokeRect(cx, 792, 38, 24);
    ctx1.fillStyle = "#ffffff";
    ctx1.font = "12px monospace";
    ctx1.fillText(`${c}`, cx + 12, 809);
  }

  ctx1.fillStyle = "#a8a29e";
  ctx1.font = "13px monospace";
  ctx1.fillText(
    "Teste de Moral (1d6): Passa se Resultado < Moral Atual (Moral 1 = falha auto).",
    642,
    838
  );

  // As 3 Âncoras de Moral
  ctx1.fillStyle = "#d9f99d";
  ctx1.font = "bold 15px monospace";
  ctx1.fillText("AS 3 ÂNCORAS DE MORAL (RAZÕES PARA VIVER):", 642, 868);

  let ay = 894;
  (dados.ancorasMoral || []).slice(0, 3).forEach((anc, i) => {
    ctx1.fillStyle = "#e7e5e4";
    ctx1.font = "14px Georgia, serif";
    const linhasAnc = quebrarLinhasCanvas(
      ctx1,
      `${i + 1}. ${anc || "—"}`,
      524
    ).slice(0, 2);
    for (const la of linhasAnc) {
      ctx1.fillText(la, 642, ay);
      ay += 20;
    }
    ay += 8;
  });

  // PASSO 2: TABELA COMPLETA DE PERÍCIAS (3 COLUNAS)
  desenharCaixaSecao(
    ctx1,
    56,
    1094,
    W - 112,
    588,
    "Passo 2 — Perícias da Sessão 1 (0 pts = 2d6 - 3 Leigo s/ Atributo | 1–6 pts = 2d6 + Bônus Attr + Perícia)",
    "#52525b"
  );

  const gruposPericias = [
    {
      chave: "fisico",
      titulo: `PERÍCIAS DE FÍSICO (Bônus ${calc.conversao.fisico.bonusTexto})`,
      cor: "#f87171",
    },
    {
      chave: "inteligencia",
      titulo: `PERÍCIAS DE INTELIGÊNCIA (Bônus ${calc.conversao.inteligencia.bonusTexto})`,
      cor: "#38bdf8",
    },
    {
      chave: "social",
      titulo: `PERÍCIAS DE SOCIAL (Bônus ${calc.conversao.social.bonusTexto})`,
      cor: "#fbbf24",
    },
  ];

  gruposPericias.forEach((grp, gIdx) => {
    const gx = 74 + gIdx * 368;
    let gy = 1152;

    ctx1.fillStyle = grp.cor;
    ctx1.font = "bold 14px monospace";
    ctx1.fillText(grp.titulo, gx, gy);
    gy += 24;

    const lista = calc.periciasCalculadas.filter(
      (p) => p.atributo === grp.chave
    );
    for (const p of lista) {
      ctx1.fillStyle = p.leigo
        ? "rgba(24, 24, 27, 0.7)"
        : "rgba(63, 98, 18, 0.28)";
      ctx1.fillRect(gx, gy - 17, 350, 42);
      ctx1.strokeStyle = p.leigo ? "#3f3f46" : "#84cc16";
      ctx1.strokeRect(gx, gy - 17, 350, 42);

      ctx1.fillStyle = p.leigo ? "#a1a1aa" : "#ffffff";
      ctx1.font = p.leigo ? "14px sans-serif" : "bold 15px sans-serif";
      ctx1.fillText(`${p.nome} (Nv.${p.pontosEfetivos})`, gx + 10, gy);

      ctx1.fillStyle = p.leigo ? "#f87171" : "#bef264";
      ctx1.font = "bold 14px monospace";
      ctx1.fillText(p.formulaRolagem, gx + 195, gy);

      ctx1.fillStyle = "#71717a";
      ctx1.font = "11px sans-serif";
      ctx1.fillText(p.desc, gx + 10, gy + 17);

      gy += 48;
    }
  });

  // =========================================================================
  // PÁGINA 2: ALINHAMENTO, ORIGEM/SUBCLASSE, QUALIDADES, DEFEITOS E KIT 1950
  // =========================================================================
  const canvas2 = document.createElement("canvas");
  canvas2.width = W;
  canvas2.height = H;
  const ctx2 = canvas2.getContext("2d");

  desenharFundoZumbiA4(ctx2, W, H, 2);

  // Cabeçalho Página 2
  ctx2.fillStyle = "#3f6212";
  ctx2.fillRect(56, 56, W - 112, 72);
  ctx2.fillStyle = "#ffffff";
  ctx2.font = "bold 24px monospace";
  ctx2.fillText(
    `☣ ${(dados.nome || "SOBREVIVENTE").toUpperCase()} — PSICOLOGIA, HABILIDADES E INVENTÁRIO DE 1950`,
    76,
    100
  );

  // Alinhamento (O que acha Certo, Repudia e Teme)
  desenharCaixaSecao(
    ctx2,
    56,
    148,
    W - 112,
    190,
    "Seção 2 — Alinhamento Moral & Gatilhos de Consciência",
    "#7f1d1d"
  );

  const itensAlinhamento = [
    [
      "1. O QUE VOCÊ ACHA CERTO (+2 Consciência ao agir de acordo):",
      dados.alinhamentoCerto || "—",
    ],
    [
      "2. O QUE VOCÊ REPUDIA / ACHA ERRADO (-2 Consciência ao contrariar/presenciar):",
      dados.alinhamentoRepudia || "—",
    ],
    [
      "3. O QUE VOCÊ TEME (Gatilho de Pânico / Pressão):",
      dados.alinhamentoTeme || "—",
    ],
  ];

  let aly = 206;
  for (const [rotulo, valor] of itensAlinhamento) {
    ctx2.fillStyle = "#fca5a5";
    ctx2.font = "bold 14px monospace";
    ctx2.fillText(rotulo, 74, aly);
    ctx2.fillStyle = "#ffffff";
    ctx2.font = "16px Georgia, serif";
    ctx2.fillText(valor.slice(0, 110), 74, aly + 22);
    aly += 48;
  }

  // Passo 4: Habilidades Especiais da Origem e Subclasse
  desenharCaixaSecao(
    ctx2,
    56,
    358,
    W - 112,
    270,
    "Passo 4 — Origem e Subclasse do Livro (Habilidades Especiais)",
    "#b45309"
  );

  let oy = 418;
  const blocosEstilo = [];
  if (calc.origemObj) {
    blocosEstilo.push({
      tipo: "ORIGEM",
      item: calc.origemObj,
      detalhe: dados.origemDetalhe,
    });
  }
  if (calc.subclasse1Obj) {
    blocosEstilo.push({
      tipo: "SUBCLASSE",
      item: calc.subclasse1Obj,
      detalhe: dados.subclasse1Detalhe,
    });
  }
  if (calc.subclasse2Obj) {
    blocosEstilo.push({
      tipo: "2ª SUBCLASSE",
      item: calc.subclasse2Obj,
      detalhe: dados.subclasse2Detalhe,
    });
  }

  for (const b of blocosEstilo) {
    ctx2.fillStyle = "#fcd34d";
    ctx2.font = "bold 17px monospace";
    ctx2.fillText(
      `[${b.tipo}] ${b.item.nome} — ${b.item.habilidadeNome} (${b.item.bonusResumo})`,
      74,
      oy
    );
    oy += 24;
    ctx2.fillStyle = "#e7e5e4";
    ctx2.font = "15px sans-serif";
    const linhasHab = quebrarLinhasCanvas(
      ctx2,
      b.item.habilidadeTexto + (b.detalhe ? ` • Detalhe: ${b.detalhe}` : ""),
      W - 150
    );
    for (const lh of linhasHab) {
      ctx2.fillText(lh, 74, oy);
      oy += 22;
    }
    oy += 16;
  }

  // Passo 5: Qualidades e Defeitos
  desenharCaixaSecao(
    ctx2,
    56,
    648,
    550,
    460,
    `Passo 5 — Qualidades (${calc.qualidadesSelecionadas.length}/3)`,
    "#3f6212"
  );

  let qy = 708;
  if (calc.qualidadesSelecionadas.length === 0) {
    ctx2.fillStyle = "#71717a";
    ctx2.font = "15px sans-serif";
    ctx2.fillText("Nenhuma qualidade selecionada.", 74, qy);
  } else {
    for (const q of calc.qualidadesSelecionadas) {
      ctx2.fillStyle = "#bef264";
      ctx2.font = "bold 16px monospace";
      ctx2.fillText(`✦ ${q.nome}`, 74, qy);
      qy += 22;
      ctx2.fillStyle = "#e7e5e4";
      ctx2.font = "14px sans-serif";
      const lq = quebrarLinhasCanvas(ctx2, q.efeito, 510);
      for (const l of lq) {
        ctx2.fillText(l, 74, qy);
        qy += 20;
      }
      qy += 18;
    }
  }

  desenharCaixaSecao(
    ctx2,
    624,
    648,
    560,
    460,
    `Passo 5 — Defeitos (${calc.defeitosSelecionados.length}/${calc.defeitosObrigatorios})`,
    "#991b1b"
  );

  let dy = 708;
  if (calc.defeitosSelecionados.length === 0) {
    ctx2.fillStyle = "#71717a";
    ctx2.font = "15px sans-serif";
    ctx2.fillText("Nenhum defeito selecionado.", 642, dy);
  } else {
    for (const df of calc.defeitosSelecionados) {
      const det = dados.detalhesDefeitos?.[df.id];
      const sufixoMembro =
        df.escolheMembroLesao && dados.membroCicatrizId
          ? ` (Membro: ${PARTES_DO_CORPO.find((p) => p.id === dados.membroCicatrizId)?.nome || dados.membroCicatrizId})`
          : "";
      ctx2.fillStyle = "#fca5a5";
      ctx2.font = "bold 16px monospace";
      ctx2.fillText(`☠ ${df.nome}${sufixoMembro}`, 642, dy);
      dy += 22;
      ctx2.fillStyle = "#e7e5e4";
      ctx2.font = "14px sans-serif";
      const ld = quebrarLinhasCanvas(
        ctx2,
        df.efeito + (det ? ` • [${det}]` : ""),
        520
      );
      for (const l of ld) {
        ctx2.fillText(l, 642, dy);
        dy += 20;
      }
      dy += 18;
    }
  }

  // Passo 6: Kit Inicial de 1950 nos Bolsos/Cinto (Sem Mochila)
  desenharCaixaSecao(
    ctx2,
    56,
    1128,
    W - 112,
    340,
    `Passo 6 — Kit Inicial de 1950 no Bolso no Dia do Comício (${calc.espacosInventario} Espaços Sem Mochila)`,
    "#52525b"
  );

  const itensKit = [
    ["1. ROUPAS COMUNS DE FEVEREIRO DE 1950:", dados.kitRoupa1950],
    [
      "2. DOCUMENTOS NO BOLSO & DINHEIRO (Cr$ 50 a Cr$ 200):",
      dados.kitDocumentosDinheiro,
    ],
    [
      "3. OBJETO PESSOAL DE VALOR SENTIMENTAL (LIGADO À ÂNCORA DE MORAL):",
      dados.kitObjetoSentimental,
    ],
    [
      "4. PEQUENO UTENSÍLIO DE BOLSO COERENTE COM A PROFISSÃO:",
      dados.kitUtensilioProfissao,
    ],
  ];

  let ky = 1188;
  for (const [tituloKit, valKit] of itensKit) {
    ctx2.fillStyle = "#fde68a";
    ctx2.font = "bold 14px monospace";
    ctx2.fillText(tituloKit, 74, ky);
    ctx2.fillStyle = "#ffffff";
    ctx2.font = "16px sans-serif";
    ctx2.fillText((valKit || "—").slice(0, 105), 74, ky + 24);
    ky += 62;
  }

  // Conexão com o grupo e notas
  desenharCaixaSecao(
    ctx2,
    56,
    1486,
    W - 112,
    190,
    "Conexões em São Miguel Paulista & Anotações de Sobrevivência",
    "#3f3f46"
  );

  ctx2.fillStyle = "#d6d3d1";
  ctx2.font = "15px Georgia, serif";
  const textoNotas = [
    dados.conexaoComGrupo
      ? `Conexão com outros personagens: ${dados.conexaoComGrupo}`
      : "",
    dados.notasExtras ? `Notas: ${dados.notasExtras}` : "",
  ]
    .filter(Boolean)
    .join("   |   ");

  const linhasNotas = quebrarLinhasCanvas(
    ctx2,
    textoNotas ||
      "Armas pesadas e mochilas serão conquistadas durante a Sessão 1.",
    W - 150
  ).slice(0, 4);
  let ny = 1546;
  for (const ln of linhasNotas) {
    ctx2.fillText(ln, 74, ny);
    ny += 24;
  }

  const jpg1 = canvas1.toDataURL("image/jpeg", 0.92);
  const jpg2 = canvas2.toDataURL("image/jpeg", 0.92);
  const pdfBlob = montarPdfBinarioDeJpegs([jpg1, jpg2]);

  const nomeLimpo = (dados.nome || "Sobrevivente_1950")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_");

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Ficha_AnoUm_1950_${nomeLimpo}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
