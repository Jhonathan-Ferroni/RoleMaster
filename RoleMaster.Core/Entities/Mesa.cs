using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RoleMaster.Core.Entities;

public class Mesa
{
    
    public string Nome { get; set; } = string.Empty;
    [Key]
    public string CodigoConvite { get; set; } = string.Empty;
    public int MestreId { get; set; }

    // Relacionamentos
    public Usuario Mestre { get; set; } = null!;
    public ICollection<SolicitacaoMesa> Solicitacoes { get; set; } = new List<SolicitacaoMesa>();
}
