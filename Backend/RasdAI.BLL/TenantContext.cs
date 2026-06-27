using System;

namespace RasdAI.BLL;

public class TenantContext
{
    public Guid? TenantId { get; set; }
    public int? UserId { get; set; }
    public string? Role { get; set; }
}
