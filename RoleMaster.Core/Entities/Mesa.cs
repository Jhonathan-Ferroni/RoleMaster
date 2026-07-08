using System.Collections.Generic;

namespace RoleMaster.Core.Entities;

public class Mesa
{
    public string Id { get; set; } = string.Empty; // Usada como TenantId
    public string Nome { get; set; } = string.Empty;
    public string CodigoConvite { get; set; } = string.Empty;
    public int MestreId { get; set; }

    // Relacionamentos
    public Usuario Mestre { get; set; } = null!;
    public ICollection<SolicitacaoMesa> Solicitacoes { get; set; } = new List<SolicitacaoMesa>();
}
