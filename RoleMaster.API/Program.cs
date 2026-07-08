using Microsoft.OpenApi.Models;
using RoleMaster.Core.Interfaces;
using RoleMaster.API.Middlewares;
using Microsoft.EntityFrameworkCore;
using RoleMaster.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<RoleMasterDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 1. ADICIONAR SERVIÇOS AO CONTAINER

builder.Services.AddControllers();

// Configuração do Swagger para o .NET 8
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RoleMaster API", Version = "v1" });
});

builder.Services.AddScoped<ITenantProvider, TenantProvider>();

var app = builder.Build();

// 2. CONFIGURAR O PIPELINE DE REQUISIÇÕES HTTP (MIDDLEWARES)

// Ativa o Swagger apenas em ambiente de desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "RoleMaster API v1");
    });
}

app.UseHttpsRedirection();

app.UseMiddleware<TenantMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();