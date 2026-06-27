using System;

namespace RasdAI.DAL;

public class TenantProvider : ITenantProvider
{
    public Guid? TenantId { get; set; }
}
