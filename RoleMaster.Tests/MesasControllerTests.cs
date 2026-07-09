using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using RoleMaster.API.Controllers;
using RoleMaster.Core.Entities;
using RoleMaster.Core.Interfaces;
using RoleMaster.Infrastructure.Data;
using Xunit;

namespace RoleMaster.Tests;

public class MesasControllerTests
{
    private readonly RoleMasterDbContext _context;
    private readonly MesasController _controller;
    private readonly Mock<ITenantProvider> _tenantProviderMock;

    public MesasControllerTests()
    {
        // 1. Configurar banco de dados em memória para os testes
        var options = new DbContextOptionsBuilder<RoleMasterDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Um banco novo por teste
            .Options;

        _tenantProviderMock = new Mock<ITenantProvider>();
        _tenantProviderMock.Setup(t => t.GetTenantId()).Returns((string?)null);

        _context = new RoleMasterDbContext(options, _tenantProviderMock.Object);

        // 2. Instanciar o controller
        _controller = new MesasController(_context);

        // 3. Simular um usuário logado (User.Claims) com ID = 1
        var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        }, "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    [Fact]
    public async Task SolicitarEntrada_DeveRetornarNotFound_QuandoCodigoForInvalido()
    {
        // Arrange (Preparação)
        var codigoInvalido = "CODIGO_FALSO";

        // Act (Ação)
        var resultado = await _controller.SolicitarEntrada(codigoInvalido);

        // Assert (Verificação)
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(resultado);
        Assert.Equal("Código de convite inválido.", notFoundResult.Value);
    }

    [Fact]
    public async Task SolicitarEntrada_DeveRetornarBadRequest_QuandoJogadorForOMestreDaMesa()
    {
        // Arrange (Preparação)
        // Criamos uma mesa onde o MestreId é 1 (o mesmo ID do nosso usuário simulado)
        var mesa = new Mesa
        {
            Id = Guid.NewGuid().ToString(),
            Nome = "A Caverna do Dragão",
            CodigoConvite = "DRAGAO",
            MestreId = 1
        };

        _context.Mesas.Add(mesa);
        await _context.SaveChangesAsync();

        // Act (Ação)
        var resultado = await _controller.SolicitarEntrada(mesa.CodigoConvite);

        // Assert (Verificação)
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(resultado);
        Assert.Equal("Você já é o mestre desta mesa.", badRequestResult.Value);
    }
}