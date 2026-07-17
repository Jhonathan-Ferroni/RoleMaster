using Microsoft.EntityFrameworkCore;
using RoleMaster.Infrastructure.Data;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using RoleMaster.Core.Entities;

namespace RoleMaster.API.Workers;

public class LimpadorDeMidiasWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly Cloudinary _cloudinary; // Injeta o Cloudinary aqui

    public LimpadorDeMidiasWorker(IServiceProvider serviceProvider, Cloudinary cloudinary)
    {
        _serviceProvider = serviceProvider;
        _cloudinary = cloudinary;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<RoleMasterDbContext>();

                var midiasExpiradas = await context.MidiasCampanha
                    .Where(m => m.DataExpiracao <= DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                if (midiasExpiradas.Any())
                {
                    foreach (var midia in midiasExpiradas)
                    {
                        // 1. Apaga do Cloudinary
                        var deleteParams = new DeletionParams(midia.PublicId)
                        {
                            ResourceType = midia.Tipo == TipoMidia.ImagemCena ? ResourceType.Image : ResourceType.Video
                        };
                        await _cloudinary.DestroyAsync(deleteParams);
                    }

                    // 2. Apaga do Banco de Dados
                    context.MidiasCampanha.RemoveRange(midiasExpiradas);
                    await context.SaveChangesAsync(stoppingToken);
                    Console.WriteLine($"[Limpeza] {midiasExpiradas.Count} mídias foram incineradas.");
                }
            }
            await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
        }
    }
}