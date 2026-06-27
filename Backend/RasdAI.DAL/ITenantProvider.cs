using System;

namespace RasdAI.DAL;

public interface ITenantProvider
{
    Guid? TenantId { get; set; }
}
