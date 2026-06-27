using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace RasdAI.API.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinTenantGroup(string tenantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, tenantId);
    }

    public async Task LeaveTenantGroup(string tenantId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, tenantId);
    }
}
