using System.ComponentModel.DataAnnotations;

namespace RoleMaster.Core.Entities;

public class CenarioBatalha : BaseEntity
{
    [Required]
    public string MesaId { get; set; } = string.Empty;

    [Required]
    public string Nome { get; set; } = string.Empty;

    public string Tema { get; set; } = "masmorra";

    public string? FundoUrl { get; set; }

    public int Largura { get; set; } = 16;

    public int Altura { get; set; } = 12;

    // JSON serializado dos props posicionados no tabuleiro
    public string PropsJson { get; set; } = "[]";

    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}
