using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.LeaveRequest;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class LeaveRequestService : ILeaveRequestService
{
    private readonly AppDbContext _context;

    public LeaveRequestService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<LeaveRequestDto>> GetLeaveRequestsAsync(Guid tenantId, string? role, int? userId)
    {
        var query = _context.LeaveRequests
            .AsNoTracking()
            .Where(lr => lr.TenantId == tenantId && !lr.IsDeleted);

        if (role != null && (role == "Employee" || role == "Sales"))
        {
            query = query.Where(lr => lr.EmployeeId == userId);
        }

        return await query
            .Include(lr => lr.Employee)
            .Include(lr => lr.Role)
            .Include(lr => lr.ApprovedByUser)
            .OrderByDescending(lr => lr.CreatedAt)
            .Select(lr => new LeaveRequestDto
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FullName,
                EmployeeAvatar = GetInitials(lr.Employee.FullName),
                RoleId = lr.RoleId,
                RoleName = lr.Role.Name,
                LeaveType = lr.LeaveType,
                StartDate = lr.StartDate,
                EndDate = lr.EndDate,
                TotalDays = lr.TotalDays,
                Reason = lr.Reason,
                Status = lr.Status,
                ApprovedByUserId = lr.ApprovedByUserId,
                ApprovedByName = lr.ApprovedByUser != null ? lr.ApprovedByUser.FullName : null,
                ApprovedAt = lr.ApprovedAt,
                RejectionReason = lr.RejectionReason,
                CreatedAt = lr.CreatedAt,
                CreatedBy = lr.CreatedBy
            })
            .ToListAsync();
    }

    public async Task<LeaveRequestDto?> GetLeaveRequestByIdAsync(int id, Guid tenantId)
    {
        return await _context.LeaveRequests
            .AsNoTracking()
            .Where(lr => lr.Id == id && lr.TenantId == tenantId && !lr.IsDeleted)
            .Include(lr => lr.Employee)
            .Include(lr => lr.Role)
            .Include(lr => lr.ApprovedByUser)
            .Select(lr => new LeaveRequestDto
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FullName,
                EmployeeAvatar = GetInitials(lr.Employee.FullName),
                RoleId = lr.RoleId,
                RoleName = lr.Role.Name,
                LeaveType = lr.LeaveType,
                StartDate = lr.StartDate,
                EndDate = lr.EndDate,
                TotalDays = lr.TotalDays,
                Reason = lr.Reason,
                Status = lr.Status,
                ApprovedByUserId = lr.ApprovedByUserId,
                ApprovedByName = lr.ApprovedByUser != null ? lr.ApprovedByUser.FullName : null,
                ApprovedAt = lr.ApprovedAt,
                RejectionReason = lr.RejectionReason,
                CreatedAt = lr.CreatedAt,
                CreatedBy = lr.CreatedBy
            })
            .FirstOrDefaultAsync();
    }

    public async Task<LeaveRequestDto> CreateLeaveRequestAsync(CreateLeaveRequestDto dto, Guid tenantId, int userId)
    {
        var employee = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == dto.EmployeeId && u.TenantId == tenantId);

        if (employee == null)
            throw new Exception("الموظف غير موجود أو لا ينتمي لشركتك");

        if (dto.StartDate > dto.EndDate)
            throw new Exception("تاريخ البداية يجب أن يكون قبل تاريخ النهاية أو مساوياً له");

        var leaveType = NormalizeLeaveType(dto.LeaveType);
        if (leaveType == null)
            throw new Exception("نوع الإجازة غير صالح. الأنواع المتاحة: Annual, Sick, Emergency, Personal, Unpaid");

        var totalDays = (dto.EndDate - dto.StartDate).Days + 1;
        if (totalDays < 1)
            totalDays = 1;

        var entity = new RasdAI.DAL.Entities.LeaveRequest
        {
            TenantId = tenantId,
            EmployeeId = dto.EmployeeId,
            RoleId = dto.RoleId,
            LeaveType = leaveType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            TotalDays = totalDays,
            Reason = dto.Reason,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.LeaveRequests.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetLeaveRequestByIdAsync(entity.Id, tenantId))!;
    }

    public async Task<LeaveRequestDto?> UpdateLeaveRequestAsync(int id, UpdateLeaveRequestDto dto, Guid tenantId, int userId)
    {
        var entity = await _context.LeaveRequests
            .FirstOrDefaultAsync(lr => lr.Id == id && lr.TenantId == tenantId && !lr.IsDeleted);

        if (entity == null) return null;

        if (entity.Status != "Pending")
            throw new Exception("لا يمكن تعديل طلب إجازة تمت الموافقة عليه أو رفضه");

        if (dto.StartDate > dto.EndDate)
            throw new Exception("تاريخ البداية يجب أن يكون قبل تاريخ النهاية أو مساوياً له");

        var leaveType = NormalizeLeaveType(dto.LeaveType);
        if (leaveType == null)
            throw new Exception("نوع الإجازة غير صالح");

        var totalDays = (dto.EndDate - dto.StartDate).Days + 1;
        if (totalDays < 1) totalDays = 1;

        entity.LeaveType = leaveType;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.TotalDays = totalDays;
        entity.Reason = dto.Reason;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return await GetLeaveRequestByIdAsync(id, tenantId);
    }

    public async Task<bool> DeleteLeaveRequestAsync(int id, Guid tenantId)
    {
        var entity = await _context.LeaveRequests
            .FirstOrDefaultAsync(lr => lr.Id == id && lr.TenantId == tenantId && !lr.IsDeleted);

        if (entity == null) return false;

        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<LeaveRequestDto?> ApproveLeaveRequestAsync(int id, Guid tenantId, int userId)
    {
        var entity = await _context.LeaveRequests
            .FirstOrDefaultAsync(lr => lr.Id == id && lr.TenantId == tenantId && !lr.IsDeleted);

        if (entity == null) return null;

        if (entity.Status != "Pending")
            throw new Exception("لا يمكن اعتماد طلب إجازة تم البت فيه مسبقاً");

        if (entity.EmployeeId == userId)
            throw new Exception("لا يمكن للموظف اعتماد طلب إجازة خاص به");

        entity.Status = "Approved";
        entity.ApprovedByUserId = userId;
        entity.ApprovedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return await GetLeaveRequestByIdAsync(id, tenantId);
    }

    public async Task<LeaveRequestDto?> RejectLeaveRequestAsync(int id, ApproveRejectDto dto, Guid tenantId, int userId)
    {
        var entity = await _context.LeaveRequests
            .FirstOrDefaultAsync(lr => lr.Id == id && lr.TenantId == tenantId && !lr.IsDeleted);

        if (entity == null) return null;

        if (entity.Status != "Pending")
            throw new Exception("لا يمكن رفض طلب إجازة تم البت فيه مسبقاً");

        if (entity.EmployeeId == userId)
            throw new Exception("لا يمكن للموظف رفض طلب إجازة خاص به");

        entity.Status = "Rejected";
        entity.RejectionReason = dto.RejectionReason;
        entity.ApprovedByUserId = userId;
        entity.ApprovedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return await GetLeaveRequestByIdAsync(id, tenantId);
    }

    private static string? NormalizeLeaveType(string type)
    {
        return type?.ToLower() switch
        {
            "annual" => "Annual",
            "sick" => "Sick",
            "emergency" => "Emergency",
            "personal" => "Personal",
            "unpaid" => "Unpaid",
            _ => null
        };
    }

    private static string GetInitials(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "م";
        var parts = name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2)
            return $"{parts[0][0]}{parts[1][0]}".ToUpper();
        return name[0].ToString();
    }
}
