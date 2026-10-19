using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoleMaster.Core.Entities;
using RoleMaster.Infrastructure.Data;

namespace RoleMaster.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CenariosController : ControllerBase
{
    private readonly RoleMasterDbContext _context;

    public CenariosController(RoleMasterDbContext context)
    {
        _context = context;
    }

    [HttpGet("mesa/{mesaId}")]
    public async Task<IActionResult> ListarPorMesa(string mesaId)
    {
        var cenarios = await _context.CenariosBatalha
            .Where(c => c.MesaId == mesaId)
            .OrderByDescending(c => c.AtualizadoEm)
            .ToListAsync();

        return Ok(cenarios);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(int id)
    {
        var cenario = await _context.CenariosBatalha.FindAsync(id);
        if (cenario == null)
            return NotFound("Cenário não encontrado.");

        return Ok(cenario);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CenarioBatalha novoCenario)
    {
        if (string.IsNullOrWhiteSpace(novoCenario.Nome))
            return BadRequest("O nome do cenário é obrigatório.");

        novoCenario.AtualizadoEm = DateTime.UtcNow;
        _context.CenariosBatalha.Add(novoCenario);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Obter), new { id = novoCenario.Id }, novoCenario);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] CenarioBatalha cenarioAtualizado)
    {
        var cenario = await _context.CenariosBatalha.FindAsync(id);
        if (cenario == null)
            return NotFound("Cenário não encontrado.");

        cenario.Nome = cenarioAtualizado.Nome;
        cenario.Tema = cenarioAtualizado.Tema;
        cenario.FundoUrl = cenarioAtualizado.FundoUrl;
        cenario.Largura = cenarioAtualizado.Largura;
        cenario.Altura = cenarioAtualizado.Altura;
        cenario.PropsJson = cenarioAtualizado.PropsJson;
        cenario.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(cenario);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var cenario = await _context.CenariosBatalha.FindAsync(id);
        if (cenario == null)
            return NotFound("Cenário não encontrado.");

        _context.CenariosBatalha.Remove(cenario);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
