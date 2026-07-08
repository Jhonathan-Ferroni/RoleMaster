using System;
using System.Collections.Generic;

namespace RoleMaster.Core.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    // Relacionamentos
    public ICollection<Mesa> MesasMestre { get; set; } = new List<Mesa>();
    public ICollection<SolicitacaoMesa> Solicitacoes { get; set; } = new List<SolicitacaoMesa>();
}
