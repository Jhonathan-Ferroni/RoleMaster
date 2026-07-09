using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoleMaster.Core.Entities;
using RoleMaster.Infrastructure.Data;

namespace RoleMaster.API.Controllers;

[Authorize] // Obriga o uso do Token JWT recebido no login
[ApiController]
[Route("api/[controller]")]
public class MesasController : ControllerBase
{
    private readonly RoleMasterDbContext _context;

    public MesasController(RoleMasterDbContext context)
    {
        _context = context;
    }

    // Método auxiliar para pegar o ID do usuário que está dentro do Token JWT
    private int ObterUsuarioIdLogado()
    {
        return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    // 1. CRIAR UMA MESA (O usuário atual vira o Mestre)
    [HttpPost]
    public async Task<IActionResult> CriarMesa([FromBody] string nomeMesa)
    {
        var mestreId = ObterUsuarioIdLogado();

        // Gera um código de 6 caracteres aleatórios (Ex: 8F3A9C)
        var codigoConvite = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        var mesa = new Mesa
        {
            Nome = nomeMesa,
            MestreId = mestreId,
            CodigoConvite = codigoConvite
        };

        _context.Mesas.Add(mesa);
        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Mesa criada!", Mesa = mesa });
    }

    // 2. SOLICITAR ENTRADA (O jogador usa o código do Mestre)
    [HttpPost("solicitar-entrada/{codigoConvite}")]
    public async Task<IActionResult> SolicitarEntrada(string codigoConvite)
    {
        var usuarioId = ObterUsuarioIdLogado();

        var mesa = await _context.Mesas.FirstOrDefaultAsync(m => m.CodigoConvite == codigoConvite);
        if (mesa == null)
            return NotFound("Código de convite inválido.");

        if (mesa.MestreId == usuarioId)
            return BadRequest("Você já é o mestre desta mesa.");

        var jaSolicitou = await _context.SolicitacoesMesa
            .AnyAsync(s => s.MesaId == mesa.Id && s.UsuarioId == usuarioId);

        if (jaSolicitou)
            return BadRequest("Você já enviou uma solicitação para esta mesa.");

        var solicitacao = new SolicitacaoMesa
        {
            MesaId = mesa.Id,
            UsuarioId = usuarioId,
            Status = StatusSolicitacao.Pendente
        };

        _context.SolicitacoesMesa.Add(solicitacao);
        await _context.SaveChangesAsync();

        return Ok("Solicitação enviada ao mestre.");
    }

    // 3. LISTAR SOLICITAÇÕES PENDENTES (Apenas o Mestre pode ver)
    [HttpGet("{mesaId}/solicitacoes")]
    public async Task<IActionResult> ListarSolicitacoes(string mesaId)
    {
        var mestreId = ObterUsuarioIdLogado();

        var ehOMestre = await _context.Mesas.AnyAsync(m => m.Id == mesaId && m.MestreId == mestreId);
        if (!ehOMestre)
            return Forbid("Apenas o mestre pode ver as solicitações.");

        var solicitacoes = await _context.SolicitacoesMesa
            .Include(s => s.Usuario) // Traz os dados do usuário para o mestre ver o nome
            .Where(s => s.MesaId == mesaId && s.Status == StatusSolicitacao.Pendente)
            .Select(s => new {
                s.Id,
                NomeJogador = s.Usuario!.Nome,
                s.Status
            })
            .ToListAsync();

        return Ok(solicitacoes);
    }

    // 4. APROVAR OU RECUSAR JOGADOR
    [HttpPut("avaliar-solicitacao/{solicitacaoId}")]
    public async Task<IActionResult> AvaliarSolicitacao(int solicitacaoId, [FromQuery] bool aprovar)
    {
        var mestreId = ObterUsuarioIdLogado();

        var solicitacao = await _context.SolicitacoesMesa
            .Include(s => s.Mesa)
            .FirstOrDefaultAsync(s => s.Id == solicitacaoId);

        if (solicitacao == null)
            return NotFound("Solicitação não encontrada.");

        if (solicitacao.Mesa!.MestreId != mestreId)
            return Forbid("Apenas o mestre pode avaliar esta solicitação.");

        solicitacao.Status = aprovar ? StatusSolicitacao.Aprovada : StatusSolicitacao.Recusada;

        await _context.SaveChangesAsync();

        return Ok(aprovar ? "Jogador aprovado!" : "Jogador recusado.");
    }
}