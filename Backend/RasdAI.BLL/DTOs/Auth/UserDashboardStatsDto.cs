namespace RasdAI.BLL.DTOs.Auth;

public class UserDashboardStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int PendingUsers { get; set; }
    public int RolesCount { get; set; }
}
