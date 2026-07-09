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

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        // Retorna a lista de forma mais leve, ideal para a tela de seleção de personagens do jogador
        var characters = await _context.Characters.ToListAsync();
        return Ok(characters);
    }

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