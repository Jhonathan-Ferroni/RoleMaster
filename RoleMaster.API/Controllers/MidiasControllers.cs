using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoleMaster.Core.Entities;
using RoleMaster.Infrastructure.Data;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace RoleMaster.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MidiasController : ControllerBase
{
    private readonly RoleMasterDbContext _context;
    private readonly Cloudinary _cloudinary;

    public MidiasController(RoleMasterDbContext context, Cloudinary cloudinary)
    {
        _context = context;
        _cloudinary = cloudinary;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadMidia([FromForm] IFormFile arquivo, [FromForm] string mesaId, [FromForm] TipoMidia tipo)
    {
        if (arquivo == null || arquivo.Length == 0) return BadRequest("Nenhum feitiço detectado.");

        using var stream = arquivo.OpenReadStream();
        string urlCompleta = "";
        string publicId = "";

        // O Cloudinary classifica Áudio como "Video" internamente
        if (tipo == TipoMidia.ImagemCena)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(arquivo.FileName, stream),
                Folder = $"rolemaster/{mesaId}" // Organiza em pastas no Cloudinary
            };
            var resultado = await _cloudinary.UploadAsync(uploadParams);
            urlCompleta = resultado.SecureUrl.ToString();
            publicId = resultado.PublicId;
        }
        else
        {
            var uploadParams = new VideoUploadParams
            {
                File = new FileDescription(arquivo.FileName, stream),
                Folder = $"rolemaster/{mesaId}"
            };
            var resultado = await _cloudinary.UploadAsync(uploadParams);
            urlCompleta = resultado.SecureUrl.ToString();
            publicId = resultado.PublicId;
        }

        var novaMidia = new MidiaCampanha
        {
            MesaId = mesaId,
            Tipo = tipo,
            NomeArquivo = arquivo.FileName,
            CaminhoServidor = urlCompleta, // Agora salva o link limpo e direto da web!
            PublicId = publicId,           // Salva o ID para apagar depois
            DataExpiracao = DateTime.UtcNow.AddDays(10)
        };

        _context.MidiasCampanha.Add(novaMidia);
        await _context.SaveChangesAsync();

        return Ok(novaMidia);
    }

    [HttpGet("{mesaId}")]
    public async Task<IActionResult> ListarMidiasDaMesa(string mesaId)
    {
        var midias = await _context.MidiasCampanha
            .Where(m => m.MesaId == mesaId && m.DataExpiracao > DateTime.UtcNow)
            .OrderByDescending(m => m.Id)
            .ToListAsync();
        return Ok(midias);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> ExcluirMidia(int id)
    {
        var midia = await _context.MidiasCampanha.FindAsync(id);
        if (midia == null) return NotFound("Mídia não encontrada nos pergaminhos.");

        // 1. Apaga fisicamente do Cloudinary
        if (!string.IsNullOrEmpty(midia.PublicId))
        {
            var deleteParams = new DeletionParams(midia.PublicId)
            {
                // Lembrando: Cloudinary trata áudio como Video nas exclusões
                ResourceType = midia.Tipo == TipoMidia.ImagemCena ? ResourceType.Image : ResourceType.Video
            };
            await _cloudinary.DestroyAsync(deleteParams);
        }

        // 2. Apaga do banco de dados (Aiven)
        _context.MidiasCampanha.Remove(midia);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Mídia incinerada com sucesso." });
    }
}