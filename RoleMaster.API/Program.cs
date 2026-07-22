using Microsoft.OpenApi.Models;
using RoleMaster.Core.Interfaces;
using RoleMaster.API.Middlewares;
using Microsoft.EntityFrameworkCore;
using RoleMaster.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CloudinaryDotNet;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<RoleMasterDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 1. ADICIONAR SERVIÇOS AO CONTAINER
builder.Services.AddControllers();

// === INÍCIO DA CONFIGURAÇÃO SEGURA DE CORS ===
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
// === FIM DA CONFIGURAÇÃO DE CORS ===

// Configuração do JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key is not configured."));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// Configuração do Swagger para o .NET 8 com suporte a JWT Bearer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RoleMaster API", Version = "v1" });

    // Configuração para utilizar JWT no Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization Header usando o esquema Bearer. Exemplo: 'Bearer {seu_token_jwt}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddScoped<ITenantProvider, TenantProvider>();

builder.Services.AddSignalR();

var cloudinaryAccount = new Account(
    builder.Configuration["Cloudinary:CloudName"],
    builder.Configuration["Cloudinary:ApiKey"],
    builder.Configuration["Cloudinary:ApiSecret"]
);
var cloudinary = new Cloudinary(cloudinaryAccount);
builder.Services.AddSingleton(cloudinary);

builder.Services.AddHostedService<RoleMaster.API.Workers.LimpadorDeMidiasWorker>();

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

// === APLICAÇÃO DO CORS ===
// Deve obrigatoriamente ficar AQUI: após o Https e antes do Tenant/Auth.
// Assim, a requisição OPTIONS (Preflight) do navegador consegue passar livremente.
app.UseCors("PermitirReact");

app.UseStaticFiles(); // Libera a pasta wwwroot para acesso público via URL

app.UseMiddleware<TenantMiddleware>();

// É CRÍTICO ativar UseAuthentication antes de UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<RoleMaster.API.Hubs.CampanhaHub>("/campanhaHub");

app.Run();