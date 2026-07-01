using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace RasdAI.DAL.Extensions;

public static class AiUsageExtensions
{
    public static async Task<int> GetAiUsageCountAsync(this AppDbContext context, Guid tenantId)
    {
        return await context.Tenants
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == tenantId)
            .Select(t => t.AiRequestsUsed)
            .FirstOrDefaultAsync();
    }
}
