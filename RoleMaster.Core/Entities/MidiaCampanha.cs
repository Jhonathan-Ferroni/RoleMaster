using System.ComponentModel.DataAnnotations;

namespace RoleMaster.Core.Entities;

public enum TipoMidia
{
    ImagemCena,
    VideoCena,
    Musica
}

public enum StatusJogadorEncontro
{
    EmCombate,
    Assistindo,
    DeFora
}

public class MidiaCampanha
{
    [Key]
    public int Id { get; set; }
    public string MesaId { get; set; } = string.Empty;
    public TipoMidia Tipo { get; set; }
    public string NomeArquivo { get; set; } = string.Empty;
    public string CaminhoServidor { get; set; } = string.Empty; // Ex: "/midias/7CCE20/taverna.jpg"
    public DateTime DataExpiracao { get; set; }
    // Adicione esta linha junto das outras propriedades:
    public string PublicId { get; set; } = string.Empty;

    public Mesa? Mesa { get; set; }
}