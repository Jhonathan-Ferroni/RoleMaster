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

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var fichas = await _context.Characters
            .Include(c => c.Equipamento)
            .Include(c => c.Magia)
            .ToListAsync();
        return Ok(fichas);
    }

    [HttpGet("mesa/{mesaId}")]
    public async Task<IActionResult> ListarFichasDaMesa(string mesaId)
    {
        // Retorna TODAS as fichas da mesa com seus equipamentos e magias
        var fichas = await _context.Characters
            .Include(c => c.Equipamento)
            .Include(c => c.Magia)
            .Where(c => c.MesaId == mesaId)
            .ToListAsync();

        return Ok(fichas);
    }

    [HttpGet("mesa/{mesaId}/minhas")]
    public async Task<IActionResult> ListarMinhasFichas(string mesaId)
    {
        // Retorna APENAS as fichas do jogador logado (usado pelo Jogador no Lobby da Campanha)
        var userIdString = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int usuarioId))
        {
            return Unauthorized("Usuário não identificado.");
        }

        var fichas = await _context.Characters
            .Include(c => c.Equipamento)
            .Include(c => c.Magia)
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

    [HttpPatch("{id}/hp")]
    public async Task<IActionResult> AtualizarHpCombate(int id, [FromBody] AtualizarHpDto dto)
    {
        var character = await _context.Characters.FindAsync(id);
        if (character == null) return NotFound("Ficha não encontrada.");

        character.PontosDeVidaAtuais = Math.Clamp(dto.PontosDeVidaAtuais, 0, character.PontosDeVidaMaximos);
        character.PontosDeVidaTemporarios = Math.Max(0, dto.PontosDeVidaTemporarios);
        character.SalvaguardaMorteSucessos = Math.Clamp(dto.SalvaguardaMorteSucessos, 0, 3);
        character.SalvaguardaMorteFalhas = Math.Clamp(dto.SalvaguardaMorteFalhas, 0, 3);

        await _context.SaveChangesAsync();
        return Ok(character);
    }

    [HttpPost("mesa/{mesaId}/padroes")]
    public async Task<IActionResult> GerarFichasPadroes(string mesaId)
    {
        if (string.IsNullOrWhiteSpace(mesaId))
            return BadRequest("MesaId é obrigatório.");

        var padroes = ObterTemplatesPadroes(mesaId);
        var existentes = await _context.Characters
            .Where(c => c.MesaId == mesaId)
            .Select(c => c.Nome)
            .ToListAsync();

        var novos = padroes.Where(p => !existentes.Contains(p.Nome)).ToList();
        if (novos.Any())
        {
            _context.Characters.AddRange(novos);
            await _context.SaveChangesAsync();
        }

        var todas = await _context.Characters
            .Include(c => c.Equipamento)
            .Include(c => c.Magia)
            .Where(c => c.MesaId == mesaId)
            .ToListAsync();

        return Ok(todas);
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
        var userIdString = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(userIdString) && int.TryParse(userIdString, out int usuarioId))
        {
            novoCharacter.UsuarioId = usuarioId;
        }

        if (string.IsNullOrEmpty(novoCharacter.MesaId))
        {
            novoCharacter.MesaId = novoCharacter.TenantId ?? "DEFAULT";
        }

        if (novoCharacter.Status == 0)
        {
            novoCharacter.Status = StatusPersonagem.Pendente;
        }

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

    private static List<Character> ObterTemplatesPadroes(string mesaId)
    {
        return new List<Character>
        {
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Thorin Escudo-de-Ferro",
                Raca = "Anão da Montanha",
                Classe = "Guerreiro",
                Nivel = 3,
                Alinhamento = "Leal e Bom",
                Antecedente = "Soldado",
                NomeDoJogador = "Ficha Padrão (Herói)",
                Forca = 16, StrMod = 3,
                Destreza = 12, DexMod = 1,
                Constituicao = 16, ConMod = 3,
                Inteligencia = 10, IntMod = 0,
                Sabedoria = 12, WisMod = 1,
                Carisma = 8, ChaMod = -1,
                BonusProficiencia = 2,
                ClasseArmadura = 18,
                Iniciativa = 1,
                Deslocamento = 7,
                PontosDeVidaMaximos = 31,
                PontosDeVidaAtuais = 31,
                DadoDeVida = "3d10",
                SalvaGuardaForca = true,
                SalvaGuardaConstituicao = true,
                Atletismo = 5, Intimidacao = 1, Percepcao = 3,
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Machado de Batalha", Damage = "1d8", Properties = "Corpo a Corpo (1.5m) • Versátil (1d10)" },
                    new Equipamento { Name = "Besta Leve", Damage = "1d8", Properties = "Distância (12m)" }
                },
                Magia = new List<Magia>
                {
                    new Magia { Name = "Retomar o Fôlego", Description = "Recupera 1d10 + 3 de PV como Ação Bônus.", Properties = "cura:1d10+3", Slot = 1 }
                }
            },
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Lyra Vento-Estelar",
                Raca = "Alto Elfo",
                Classe = "Mago",
                Nivel = 3,
                Alinhamento = "Neutro e Bom",
                Antecedente = "Sábio",
                NomeDoJogador = "Ficha Padrão (Herói)",
                Forca = 8, StrMod = -1,
                Destreza = 14, DexMod = 2,
                Constituicao = 12, ConMod = 1,
                Inteligencia = 17, IntMod = 3,
                Sabedoria = 13, WisMod = 1,
                Carisma = 10, ChaMod = 0,
                BonusProficiencia = 2,
                ClasseArmadura = 15,
                Iniciativa = 2,
                Deslocamento = 9,
                PontosDeVidaMaximos = 18,
                PontosDeVidaAtuais = 18,
                DadoDeVida = "3d6",
                SalvaGuardaInteligencia = true,
                SalvaGuardaSabedoria = true,
                Arcanismo = 5, Historia = 5, Investigacao = 5,
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Cajado Arcano", Damage = "1d6", Properties = "Corpo a Corpo (1.5m)" },
                    new Equipamento { Name = "Adaga Élfica", Damage = "1d4", Properties = "Acuidade, Arremesso (6m)" }
                },
                Magia = new List<Magia>
                {
                    new Magia { Name = "Raio de Fogo", Description = "Dispara um dardo flamejante a até 18m (1d10 de dano de fogo).", Properties = "ataque:1d10:18", Slot = 0 },
                    new Magia { Name = "Mísseis Mágicos", Description = "Três dardos de energia arcana que acertam automaticamente (3d4+3).", Properties = "ataque:3d4:18", Slot = 1 },
                    new Magia { Name = "Mãos Flamejantes", Description = "Cone de chamas a curta distância (3d6 de dano de fogo).", Properties = "ataque:3d6:3", Slot = 1 }
                }
            },
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Seraphina Luz-da-Alvorada",
                Raca = "Humana",
                Classe = "Clérigo",
                Nivel = 3,
                Alinhamento = "Leal e Boa",
                Antecedente = "Acólita",
                NomeDoJogador = "Ficha Padrão (Herói)",
                Forca = 14, StrMod = 2,
                Destreza = 10, DexMod = 0,
                Constituicao = 14, ConMod = 2,
                Inteligencia = 11, IntMod = 0,
                Sabedoria = 16, WisMod = 3,
                Carisma = 13, ChaMod = 1,
                BonusProficiencia = 2,
                ClasseArmadura = 18,
                Iniciativa = 0,
                Deslocamento = 9,
                PontosDeVidaMaximos = 24,
                PontosDeVidaAtuais = 24,
                DadoDeVida = "3d8",
                SalvaGuardaSabedoria = true,
                SalvaGuardaCarisma = true,
                Medicina = 5, Religiao = 2, Intuicao = 5,
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Maça Sagrada", Damage = "1d6", Properties = "Corpo a Corpo (1.5m)" }
                },
                Magia = new List<Magia>
                {
                    new Magia { Name = "Curar Ferimentos", Description = "Toque divino que restaura 1d8 + 3 PV.", Properties = "cura:1d8+3:4.5", Slot = 1 },
                    new Magia { Name = "Palavra Curativa", Description = "Prece à distância (18m) que restaura 1d4 + 3 PV.", Properties = "cura:1d4+3:18", Slot = 1 },
                    new Magia { Name = "Chama Sagrada", Description = "Radiação celeste que queima o inimigo (1d8 radiante, 18m).", Properties = "ataque:1d8:18", Slot = 0 }
                }
            },
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Kaelen Sombra-Veloz",
                Raca = "Halfling Pés-Leves",
                Classe = "Ladino",
                Nivel = 3,
                Alinhamento = "Caótico e Neutro",
                Antecedente = "Criminoso",
                NomeDoJogador = "Ficha Padrão (Herói)",
                Forca = 10, StrMod = 0,
                Destreza = 17, DexMod = 3,
                Constituicao = 12, ConMod = 1,
                Inteligencia = 13, IntMod = 1,
                Sabedoria = 12, WisMod = 1,
                Carisma = 14, ChaMod = 2,
                BonusProficiencia = 2,
                ClasseArmadura = 15,
                Iniciativa = 3,
                Deslocamento = 9,
                PontosDeVidaMaximos = 21,
                PontosDeVidaAtuais = 21,
                DadoDeVida = "3d8",
                SalvaGuardaDestreza = true,
                SalvaGuardaInteligencia = true,
                Furtividade = 7, Acrobacia = 5, Prestidigitacao = 5,
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Rapieira + Ataque Furtivo", Damage = "2d6", Properties = "Acuidade, Corpo a Corpo (1.5m)" },
                    new Equipamento { Name = "Arco Curto", Damage = "1d6", Properties = "Distância (15m)" }
                },
                Magia = new List<Magia>()
            },
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Goblin Saqueador",
                Raca = "Goblinóide",
                Classe = "Inimigo (ND 1/4)",
                Nivel = 1,
                Alinhamento = "Neutro e Mau",
                Antecedente = "Monstro",
                NomeDoJogador = "NPC / Monstro",
                Forca = 8, StrMod = -1,
                Destreza = 14, DexMod = 2,
                Constituicao = 10, ConMod = 0,
                Inteligencia = 10, IntMod = 0,
                Sabedoria = 8, WisMod = -1,
                Carisma = 8, ChaMod = -1,
                BonusProficiencia = 2,
                ClasseArmadura = 15,
                Iniciativa = 2,
                Deslocamento = 9,
                PontosDeVidaMaximos = 12,
                PontosDeVidaAtuais = 12,
                DadoDeVida = "2d6",
                Furtividade = 6,
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Cimitarra Enferrujada", Damage = "1d6", Properties = "Acuidade, Corpo a Corpo (1.5m)" },
                    new Equipamento { Name = "Arco Curto de Osso", Damage = "1d6", Properties = "Distância (12m)" }
                },
                Magia = new List<Magia>()
            },
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Orc Berserker",
                Raca = "Orc",
                Classe = "Inimigo (ND 1/2)",
                Nivel = 2,
                Alinhamento = "Caótico e Mau",
                Antecedente = "Monstro",
                NomeDoJogador = "NPC / Monstro",
                Forca = 16, StrMod = 3,
                Destreza = 12, DexMod = 1,
                Constituicao = 16, ConMod = 3,
                Inteligencia = 7, IntMod = -2,
                Sabedoria = 11, WisMod = 0,
                Carisma = 10, ChaMod = 0,
                BonusProficiencia = 2,
                ClasseArmadura = 13,
                Iniciativa = 1,
                Deslocamento = 9,
                PontosDeVidaMaximos = 22,
                PontosDeVidaAtuais = 22,
                DadoDeVida = "2d8+6",
                Intimidacao = 2,
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Machado Grande Brutal", Damage = "1d12", Properties = "Pesado, Corpo a Corpo (1.5m)" },
                    new Equipamento { Name = "Azagaia de Arremesso", Damage = "1d6", Properties = "Arremesso (9m)" }
                },
                Magia = new List<Magia>()
            },
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Esqueleto Guardião",
                Raca = "Morto-Vivo",
                Classe = "Inimigo (ND 1/4)",
                Nivel = 1,
                Alinhamento = "Leal e Mau",
                Antecedente = "Monstro",
                NomeDoJogador = "NPC / Monstro",
                Forca = 10, StrMod = 0,
                Destreza = 14, DexMod = 2,
                Constituicao = 15, ConMod = 2,
                Inteligencia = 6, IntMod = -2,
                Sabedoria = 8, WisMod = -1,
                Carisma = 5, ChaMod = -3,
                BonusProficiencia = 2,
                ClasseArmadura = 13,
                Iniciativa = 2,
                Deslocamento = 9,
                PontosDeVidaMaximos = 15,
                PontosDeVidaAtuais = 15,
                DadoDeVida = "2d8+4",
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Espada Curta Antiga", Damage = "1d6", Properties = "Acuidade, Corpo a Corpo (1.5m)" },
                    new Equipamento { Name = "Arco Composto", Damage = "1d6", Properties = "Distância (15m)" }
                },
                Magia = new List<Magia>()
            },
            new Character
            {
                MesaId = mesaId,
                Status = StatusPersonagem.Aprovado,
                Nome = "Ignis, Dragão Vermelho Jovem",
                Raca = "Dragão",
                Classe = "Chefe (ND 4)",
                Nivel = 6,
                Alinhamento = "Caótico e Mau",
                Antecedente = "Chefe de Masmorra",
                NomeDoJogador = "NPC / Monstro",
                Forca = 19, StrMod = 4,
                Destreza = 10, DexMod = 0,
                Constituicao = 17, ConMod = 3,
                Inteligencia = 12, IntMod = 1,
                Sabedoria = 11, WisMod = 0,
                Carisma = 15, ChaMod = 2,
                BonusProficiencia = 3,
                ClasseArmadura = 17,
                Iniciativa = 0,
                Deslocamento = 12,
                PontosDeVidaMaximos = 75,
                PontosDeVidaAtuais = 75,
                DadoDeVida = "10d10+20",
                Percepcao = 6, Furtividade = 3,
                Equipamento = new List<Equipamento>
                {
                    new Equipamento { Name = "Mordida Dracônica", Damage = "2d10", Properties = "Alcance 3m + Fogo" },
                    new Equipamento { Name = "Garras Dilacerantes", Damage = "2d6", Properties = "Corpo a Corpo (1.5m)" }
                },
                Magia = new List<Magia>
                {
                    new Magia { Name = "Sopro de Fogo", Description = "Exala um cone devastador de chamas ardentes (6d6 de dano de fogo, alcance 9m).", Properties = "ataque:6d6:9", Slot = 1 }
                }
            }
        };
    }
}

public class AtualizarHpDto
{
    public int PontosDeVidaAtuais { get; set; }
    public int PontosDeVidaTemporarios { get; set; }
    public int SalvaguardaMorteSucessos { get; set; }
    public int SalvaguardaMorteFalhas { get; set; }
}