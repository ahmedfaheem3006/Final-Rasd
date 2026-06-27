using System;
using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.LeaveRequest;

public class CreateLeaveRequestDto
{
    [Required(ErrorMessage = "معرف الموظف مطلوب")]
    public int EmployeeId { get; set; }

    [Required(ErrorMessage = "معرف الدور الوظيفي مطلوب")]
    public int RoleId { get; set; }

    [Required(ErrorMessage = "نوع الإجازة مطلوب")]
    public string LeaveType { get; set; } = string.Empty;

    [Required(ErrorMessage = "تاريخ البداية مطلوب")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "تاريخ النهاية مطلوب")]
    public DateTime EndDate { get; set; }

    public string? Reason { get; set; }
}
