using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RoleMaster.Core.Entities;
using RoleMaster.Infrastructure.Data;

namespace RoleMaster.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly RoleMasterDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(RoleMasterDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha) || string.IsNullOrWhiteSpace(request.Nome))
        {
            return BadRequest(new { message = "Todos os campos (Nome, Email, Senha) são obrigatórios." });
        }

        // Normalizar e-mail
        var emailNormalizado = request.Email.Trim().ToLower();

        // Verificar e-mail duplicado
        var usuarioExistente = await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == emailNormalizado);
        if (usuarioExistente)
        {
            return BadRequest(new { message = "E-mail já cadastrado no sistema." });
        }

        var novoUsuario = new Usuario
        {
            Nome = request.Nome.Trim(),
            Email = emailNormalizado,
            SenhaHash = HashPassword(request.Senha),
            DataCriacao = DateTime.UtcNow
        };

        _context.Usuarios.Add(novoUsuario);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Usuário registrado com sucesso!", usuarioId = novoUsuario.Id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha))
        {
            return BadRequest(new { message = "E-mail e senha são obrigatórios." });
        }

        var emailNormalizado = request.Email.Trim().ToLower();

        // Buscar usuário
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);
        if (usuario == null)
        {
            return Unauthorized(new { message = "E-mail ou senha inválidos." });
        }

        // Validar hash
        var senhaValida = VerifyPassword(request.Senha, usuario.SenhaHash);
        if (!senhaValida)
        {
            return Unauthorized(new { message = "E-mail ou senha inválidos." });
        }

        // Gerar Token JWT
        var token = GerarTokenJwt(usuario);

        return Ok(new
        {
            token,
            usuario = new
            {
                id = usuario.Id,
                nome = usuario.Nome,
                email = usuario.Email
            }
        });
    }

    private string GerarTokenJwt(Usuario usuario)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var keyString = jwtSettings["Key"] ?? throw new InvalidOperationException("Chave JWT não configurada.");
        var key = Encoding.UTF8.GetBytes(keyString);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Email, usuario.Email)
        };

        var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8), // Expiração de 8 horas
            SigningCredentials = creds,
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }
}

public class RegisterRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}
