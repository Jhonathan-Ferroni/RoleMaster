
namespace RoleMaster.Core.Entities;

public class Character : BaseEntity
{
    // --- Dados Principais ---
    public string Nome { get; set; } = string.Empty; // [cite: 3]
    public string Classe { get; set; } = string.Empty; // [cite: 4]
    public string Raca { get; set; } = string.Empty; // [cite: 7]
    public int Nivel { get; set; } = 1; // [cite: 4]
    public string Alinhamento { get; set; } = string.Empty; // [cite: 8]
    public string Antecedente { get; set; } = string.Empty; // [cite: 5]
    public string NomeDoJogador { get; set; } = string.Empty; // [cite: 6]
    public int PontosDeExperiencia { get; set; } // [cite: 9]

    // --- Atributos Básicos ---
    public int Forca { get; set; } // [cite: 1]
    public int StrMod { get; set; }
    public int Destreza { get; set; } // [cite: 15]
    public int DexMod { get; set; }
    public int Constituicao { get; set; } // [cite: 16]
    public int ConMod { get; set; }
    public int Inteligencia { get; set; } // [cite: 30]
    public int IntMod { get; set; }
    public int Sabedoria { get; set; } // [cite: 31]
    public int WisMod { get; set; }
    public int Carisma { get; set; } // [cite: 32]
    public int ChaMod { get; set; }

    // --- Status de Jogo ---
    public int Inspiracao { get; set; } // [cite: 10]
    public int BonusProficiencia { get; set; } // [cite: 14]
    public int ClasseArmadura { get; set; } // [cite: 11]
    public int Iniciativa { get; set; } // [cite: 12]
    public int Deslocamento { get; set; } // [cite: 13]

    // --- Pontos de Vida (HP) ---
    public int PontosDeVidaMaximos { get; set; } // [cite: 24]
    public int PontosDeVidaAtuais { get; set; } // [cite: 25]
    public int PontosDeVidaTemporarios { get; set; } // [cite: 26]
    public string DadoDeVida { get; set; } = string.Empty; // [cite: 51]
    public int SalvaguardaMorteSucessos { get; set; } // [cite: 49, 52]
    public int SalvaguardaMorteFalhas { get; set; } // [cite: 50, 52]

    // --- Salvaguardas (Saving Throws - indicando proficiência) ---
    public bool SalvaGuardaForca { get; set; } // [cite: 17, 23]
    public bool SalvaGuardaDestreza { get; set; } // [cite: 18, 23]
    public bool SalvaGuardaConstituicao { get; set; } // [cite: 19, 23]
    public bool SalvaGuardaInteligencia { get; set; } // [cite: 20, 23]
    public bool SalvaGuardaSabedoria { get; set; } // [cite: 21, 23]
    public bool SalvaGuardaCarisma { get; set; } // [cite: 22, 23]

    // --- Perícias (Skills) ---
    public int Acrobacia { get; set; } // [cite: 33, 46]
    public int Arcanismo { get; set; } // [cite: 34, 46]
    public int Atletismo { get; set; } // [cite: 35, 46]
    public int Atuacao { get; set; } // [cite: 36, 46]
    public int Enganacao { get; set; } // [cite: 37, 46]
    public int Furtividade { get; set; } // [cite: 37, 46]
    public int Historia { get; set; } // [cite: 38, 46]
    public int Intimidacao { get; set; } // [cite: 39, 46]
    public int Intuicao { get; set; } // [cite: 39, 46]
    public int Investigacao { get; set; } // [cite: 39, 46]
    public int LidarComAnimais { get; set; } // [cite: 40, 46]
    public int Medicina { get; set; } // [cite: 41, 46]
    public int Natureza { get; set; } // [cite: 42, 46]
    public int Percepcao { get; set; } // [cite: 43, 46]
    public int Persuasao { get; set; } // [cite: 44, 46]
    public int Prestidigitacao { get; set; } // [cite: 44, 46]
    public int Religiao { get; set; } // [cite: 44, 46]
    public int Sobrevivencia { get; set; } // [cite: 45, 46]

    public int SabedoriaPassivaPercepcao { get; set; } // [cite: 56]

    // --- Personalidade ---
    public string? TracosDePersonalidade { get; set; } = string.Empty; // [cite: 27]
    public string? Ideais { get; set; } = string.Empty; // [cite: 28]
    public string? Vinculos { get; set; } = string.Empty; // [cite: 29]
    public string? Fraquezas { get; set; } = string.Empty; // [cite: 53]

    // --- Características Físicas e História (Página 2) ---
    public int? Idade { get; set; } // [cite: 61]
    public string? Altura { get; set; } = string.Empty; // [cite: 62]
    public string? Peso { get; set; } = string.Empty; // [cite: 63]
    public string? CorDosOlhos { get; set; } = string.Empty; // [cite: 65]
    public string? CorDaPele { get; set; } = string.Empty; // [cite: 66]
    public string? CorDoCabelo { get; set; } = string.Empty; // [cite: 67]
    public string? AparenciaDoPersonagem { get; set; } = string.Empty; // [cite: 69]
    public string? AliadosEOrganizacoes { get; set; } = string.Empty; // [cite: 70]
    public string? HistoriaDoPersonagem { get; set; } = string.Empty; // [cite: 71]

    // --- Equipamentos e Proficiências Extras ---
    public string? OutrasProficienciasEIdiomas { get; set; } = string.Empty; // [cite: 57]
    public List<Equipamento>? Equipamento { get; set; }
    public string? Tesouros { get; set; } = string.Empty; // [cite: 73]
    public string? CaracteristicasETalentos { get; set; } = string.Empty; // [cite: 60, 72]

    public List<Magia>? Magia { get; set; }
}