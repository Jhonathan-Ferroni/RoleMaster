namespace RoleMaster.Core.Interfaces;

public interface ITenantProvider
{
	string? GetTenantId();
	void SetTenantId(string tenantId);
}