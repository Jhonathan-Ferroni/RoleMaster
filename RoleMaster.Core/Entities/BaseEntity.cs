namespace RoleMaster.Core.Entities;

public abstract class BaseEntity
{
    public int Id { get; set; }
    // Esta propriedade vai amarrar o registro a uma mesa específica
    public string? TenantId { get; set; }
    // O ponto de interrogação (?) permite que o TenantId seja nulo para itens globais
}