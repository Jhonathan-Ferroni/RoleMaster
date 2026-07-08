namespace RoleMaster.Core.Interfaces;

public class TenantProvider : ITenantProvider
{
    private string? _tenantId;

    public string? GetTenantId() => _tenantId;

    public void SetTenantId(string tenantId)
    {
        _tenantId = tenantId;
    }
}