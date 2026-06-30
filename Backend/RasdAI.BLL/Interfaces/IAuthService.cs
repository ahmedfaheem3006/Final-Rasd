using System.Collections.Generic;
using System.Threading.Tasks;
using RasdAI.BLL.DTOs.Auth;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<bool> RegisterUserAsync(RegisterDto registerDto, Guid tenantId);
    Task<User?> GetUserByIdAsync(int id);
    Task<List<UserDto>> GetTenantUsersAsync(Guid tenantId);
    Task<bool> UpdateUserRoleAsync(int targetUserId, int newRoleId, Guid tenantId, int currentUserId);
    Task<bool> DeleteUserAsync(int userId, Guid tenantId, int currentUserId);
    Task<bool> GeneratePasswordResetOtpAsync(string email);
    Task<bool> VerifyOtpAsync(string email, string otp);
    Task<bool> ResetPasswordAsync(string email, string otp, string newPassword);
    Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task<UserDashboardStatsDto> GetUserDashboardStatsAsync(Guid tenantId);
    Task<object> GetUserPermissionsAsync(int userId);
}
