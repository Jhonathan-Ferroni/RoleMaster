using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using RoleMaster.API.Controllers;
using RoleMaster.Core.Entities;
using RoleMaster.Core.Interfaces;
using RoleMaster.Infrastructure.Data;
using Xunit;

namespace RoleMaster.Tests;

public class CharactersControllerTests
{
    private Mock<ITenantProvider> CriarMockTenantProvider(string tenantId)
    {
        var mock = new Mock<ITenantProvider>();
        mock.Setup(t => t.GetTenantId()).Returns(tenantId);
        return mock;
    }

    [Fact]
    public async Task Listar_DeveRetornarApenasPersonagensDaMesaAtiva()
    {
        // Arrange (Preparação)
        var options = new DbContextOptionsBuilder<RoleMasterDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // 1. Criar o contexto fingindo que estamos na "Mesa_A" e salvar dois personagens
        var tenantMockA = CriarMockTenantProvider("Mesa_A");
        using (var contextSetup = new RoleMasterDbContext(options, tenantMockA.Object))
        {
            contextSetup.Characters.Add(new Character { Nome = "Aragorn", Classe = "Guerreiro" });
            contextSetup.Characters.Add(new Character { Nome = "Legolas", Classe = "Arqueiro" });
            await contextSetup.SaveChangesAsync(); // O SaveChangesAsync vai injetar "Mesa_A" automaticamente
        }

        // 2. Criar o contexto fingindo que estamos na "Mesa_B" e salvar um personagem
        var tenantMockB = CriarMockTenantProvider("Mesa_B");
        using (var contextSetup = new RoleMasterDbContext(options, tenantMockB.Object))
        {
            contextSetup.Characters.Add(new Character { Nome = "Gimli", Classe = "Barbaro" });
            await contextSetup.SaveChangesAsync(); // Injeta "Mesa_B"
        }

        // Act (Ação) - Vamos instanciar o controller logados na "Mesa_A"
        using (var contextTest = new RoleMasterDbContext(options, tenantMockA.Object))
        {
            var controller = new CharactersController(contextTest);
            var resultado = await controller.Listar();

            // Assert (Verificação)
            var okResult = Assert.IsType<OkObjectResult>(resultado);
            var lista = Assert.IsAssignableFrom<IEnumerable<Character>>(okResult.Value);

            // Deve trazer apenas os 2 personagens da Mesa_A, ignorando o da Mesa_B
            Assert.Equal(2, lista.Count());
            Assert.Contains(lista, c => c.Nome == "Aragorn");
            Assert.Contains(lista, c => c.Nome == "Legolas");
            Assert.DoesNotContain(lista, c => c.Nome == "Gimli");
        }
    }

    [Fact]
    public async Task Obter_DeveRetornarNotFound_QuandoPersonagemForDeOutraMesa()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RoleMasterDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        int idDoPersonagemDaMesaB;

        // Criando personagem na Mesa_B
        var tenantMockB = CriarMockTenantProvider("Mesa_B");
        using (var contextSetup = new RoleMasterDbContext(options, tenantMockB.Object))
        {
            var heroi = new Character { Nome = "Gandalf", Classe = "Mago" };
            contextSetup.Characters.Add(heroi);
            await contextSetup.SaveChangesAsync();
            idDoPersonagemDaMesaB = heroi.Id;
        }

        // Act - Tentando buscar o personagem da Mesa_B estando logado na Mesa_A
        var tenantMockA = CriarMockTenantProvider("Mesa_A");
        using (var contextTest = new RoleMasterDbContext(options, tenantMockA.Object))
        {
            var controller = new CharactersController(contextTest);
            var resultado = await controller.Obter(idDoPersonagemDaMesaB);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(resultado);
            Assert.Equal("Personagem não encontrado nesta mesa.", notFoundResult.Value);
        }
    }

    [Fact]
    public async Task Criar_DeveSalvarPersonagemComSucesso()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RoleMasterDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var tenantMock = CriarMockTenantProvider("Mesa_Alfa");
        using (var context = new RoleMasterDbContext(options, tenantMock.Object))
        {
            var controller = new CharactersController(context);
            var novoCharacter = new Character { Nome = "Frodo", Classe = "Ladino" };

            // Act
            var resultado = await controller.Criar(novoCharacter);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(resultado);
            var characterSalvo = Assert.IsType<Character>(createdResult.Value);

            Assert.Equal("Frodo", characterSalvo.Nome);
            // Garante que o interceptor injetou o TenantId correto em segundo plano
            Assert.Equal("Mesa_Alfa", characterSalvo.TenantId);
        }
    }
}