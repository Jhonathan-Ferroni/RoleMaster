using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoleMaster.Core.Entities;
using RoleMaster.Infrastructure.Data;

namespace RoleMaster.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CharactersController : ControllerBase
{
    private readonly RoleMasterDbContext _context;

    public CharactersController(RoleMasterDbContext context)
    {
        _context = context;
    }

    // --- ROTAS DE LISTAGEM --- //

    [HttpGet("mesa/{mesaId}")]
    public async Task<IActionResult> ListarFichasDaMesa(string mesaId)
    {
        // Retorna TODAS as fichas da mesa (usado pelo Mestre na tela de Gestão)
        var fichas = await _context.Characters
            .Where(c => c.MesaId == mesaId)
            .ToListAsync();

        return Ok(fichas);
    }

    [HttpGet("mesa/{mesaId}/minhas")]
    public async Task<IActionResult> ListarMinhasFichas(string mesaId)
    {
        // Retorna APENAS as fichas do jogador logado (usado pelo Jogador no Lobby da Campanha)
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int usuarioId))
        {
            return Unauthorized("Usuário não identificado.");
        }

        var fichas = await _context.Characters
            .Where(c => c.MesaId == mesaId && c.UsuarioId == usuarioId)
            .ToListAsync();

        return Ok(fichas);
    }

    [HttpGet("mesa/{mesaId}/pendentes")]
    public async Task<IActionResult> ListarFichasPendentes(string mesaId)
    {
        // Retorna apenas as pendentes (útil para notificações)
        var fichas = await _context.Characters
            .Where(c => c.MesaId == mesaId && c.Status == StatusPersonagem.Pendente)
            .ToListAsync();

        return Ok(fichas);
    }

    // --- ROTAS DE GERENCIAMENTO (MESTRE) --- //

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> MudarStatus(int id, [FromBody] StatusPersonagem novoStatus)
    {
        var character = await _context.Characters.FindAsync(id);

        if (character == null)
            return NotFound("Personagem não encontrado.");

        character.Status = novoStatus;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Status atualizado para {novoStatus}" });
    }

    [HttpPatch("{id}/atribuir")]
    public async Task<IActionResult> AtribuirJogador(int id, [FromBody] int? novoUsuarioId)
    {
        var character = await _context.Characters.FindAsync(id);
        if (character == null) return NotFound("Ficha não encontrada.");

        character.UsuarioId = novoUsuarioId; // Pode ser o ID de um jogador ou null (sem dono)
        await _context.SaveChangesAsync();

        return Ok(new { message = "Posse da ficha atualizada com sucesso!" });
    }

    // --- ROTAS DE CRUD TRADICIONAL --- //

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(int id)
    {
        // Usa o Include para carregar os itens do inventário e as magias vinculadas a essa ficha
        var character = await _context.Characters
            .Include(c => c.Equipamento)
            .Include(c => c.Magia)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (character == null)
            return NotFound("Personagem não encontrado nesta mesa.");

        return Ok(character);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] Character novoCharacter)
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int usuarioId))
        {
            return Unauthorized("Apenas aventureiros logados podem forjar heróis.");
        }

        // TRAVA DE SEGURANÇA: Impede a criação de fichas fantasmas (sem mesa)
        if (string.IsNullOrEmpty(novoCharacter.MesaId))
        {
            return BadRequest(new { message = "Um herói não pode nascer no vazio. É preciso estar em uma mesa para forjar a ficha." });
        }

        novoCharacter.UsuarioId = usuarioId;
        novoCharacter.Status = StatusPersonagem.Pendente;

        _context.Characters.Add(novoCharacter);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Obter), new { id = novoCharacter.Id }, novoCharacter);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] Character characterAtualizado)
    {
        var character = await _context.Characters.FindAsync(id);

        if (character == null)
            return NotFound("Personagem não encontrado.");

        // TRUQUE SÊNIOR: Atualiza as mais de 50 propriedades de uma única vez
        _context.Entry(character).CurrentValues.SetValues(characterAtualizado);

        await _context.SaveChangesAsync();

        return Ok(character);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var character = await _context.Characters.FindAsync(id);

        if (character == null)
            return NotFound("Personagem não encontrado.");

        _context.Characters.Remove(character);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}