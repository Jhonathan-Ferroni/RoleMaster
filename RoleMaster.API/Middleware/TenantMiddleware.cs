using RoleMaster.Core.Interfaces;

namespace RoleMaster.API.Middlewares;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private const string TenantHeaderName = "X-Tenant-ID";

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider)
    {
        // Tenta buscar o cabeçalho personalizado enviado pelo React
        if (context.Request.Headers.TryGetValue(TenantHeaderName, out var tenantId))
        {
            if (!string.IsNullOrEmpty(tenantId))
            {
                tenantProvider.SetTenantId(tenantId!);
            }
        }

        // Continua o fluxo da requisição HTTP
        await _next(context);
    }
}