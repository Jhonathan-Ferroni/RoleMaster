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
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Mesa> Mesas { get; set; }
    public DbSet<SolicitacaoMesa> SolicitacoesMesa { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // O personagem AINDA é estritamente isolado por mesa (não existem personagens globais)
        modelBuilder.Entity<Character>().HasQueryFilter(c => c.TenantId == _tenantId);

        // Equipamentos e Magias trazem os itens da mesa atual + os itens globais do sistema
        modelBuilder.Entity<Equipamento>().HasQueryFilter(e => e.TenantId == _tenantId || e.TenantId == null);
        modelBuilder.Entity<Magia>().HasQueryFilter(m => m.TenantId == _tenantId || m.TenantId == null);

        // Configuração para Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Nome).IsRequired();
            entity.Property(u => u.Email).IsRequired();
            entity.Property(u => u.SenhaHash).IsRequired();
        });

        // Configuração para Mesa
        modelBuilder.Entity<Mesa>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.HasIndex(m => m.CodigoConvite).IsUnique();
            entity.Property(m => m.Nome).IsRequired();
            entity.Property(m => m.CodigoConvite).IsRequired();

            entity.HasOne(m => m.Mestre)
                .WithMany(u => u.MesasMestre)
                .HasForeignKey(m => m.MestreId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração para SolicitacaoMesa
        modelBuilder.Entity<SolicitacaoMesa>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Status).HasConversion<string>(); // Salvar enum como string no BD

            entity.HasOne(s => s.Usuario)
                .WithMany(u => u.Solicitacoes)
                .HasForeignKey(s => s.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Mesa)
                .WithMany(m => m.Solicitacoes)
                .HasForeignKey(s => s.MesaId)
                .OnDelete(DeleteBehavior.Cascade);
        });
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