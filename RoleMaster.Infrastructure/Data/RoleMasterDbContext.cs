using Microsoft.EntityFrameworkCore;
using RoleMaster.Core.Entities;
using RoleMaster.Core.Interfaces;

namespace RoleMaster.Infrastructure.Data;

public class RoleMasterDbContext : DbContext
{
    private readonly string _tenantId;

    public RoleMasterDbContext(
        DbContextOptions<RoleMasterDbContext> options,
        ITenantProvider tenantProvider) : base(options)
    {
        _tenantId = tenantProvider.GetTenantId() ?? string.Empty;
    }

    // MAPEAR TODAS AS SUAS ENTIDADES AQUI
    // (Ajustei de Personagem para Character para bater com o seu arquivo)
    public DbSet<Character> Characters { get; set; }
    public DbSet<Equipamento> Equipamentos { get; set; }
    public DbSet<Magia> Magias { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // O personagem AINDA é estritamente isolado por mesa (não existem personagens globais)
        modelBuilder.Entity<Character>().HasQueryFilter(c => c.TenantId == _tenantId);

        // Equipamentos e Magias trazem os itens da mesa atual + os itens globais do sistema
        modelBuilder.Entity<Equipamento>().HasQueryFilter(e => e.TenantId == _tenantId || e.TenantId == null);
        modelBuilder.Entity<Magia>().HasQueryFilter(m => m.TenantId == _tenantId || m.TenantId == null);
    }

    // O SaveChangesAsync permanece igual, garantindo o TenantId para todas as tabelas
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.TenantId = _tenantId;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}