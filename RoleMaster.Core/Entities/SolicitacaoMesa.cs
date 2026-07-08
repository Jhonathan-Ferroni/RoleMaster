namespace RoleMaster.Core.Entities;

public enum StatusSolicitacao
{
    Pendente,
    Aprovada,
    Recusada
}

public class SolicitacaoMesa
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string MesaId { get; set; } = string.Empty;
    public StatusSolicitacao Status { get; set; } = StatusSolicitacao.Pendente;

    // Relacionamentos
    public Usuario Usuario { get; set; } = null!;
    public Mesa Mesa { get; set; } = null!;
}
