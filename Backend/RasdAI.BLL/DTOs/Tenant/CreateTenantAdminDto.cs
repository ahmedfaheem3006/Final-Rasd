using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Tenant;

public class CreateTenantAdminDto : CreateTenantDto
{
    [Required(ErrorMessage = "سعر الاشتراك مطلوب")]
    [Range(0, double.MaxValue, ErrorMessage = "سعر الاشتراك لا يمكن أن يكون سالباً")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "حد استهلاك الذكاء الاصطناعي مطلوب")]
    [Range(0, int.MaxValue, ErrorMessage = "حد استهلاك الذكاء الاصطناعي لا يمكن أن يكون سالباً")]
    public int AiLimit { get; set; }

    public bool IsCrmEnabled { get; set; } = true;
    public bool IsInvoicesEnabled { get; set; } = true;
    public bool IsTasksEnabled { get; set; } = true;
    public bool IsMeetingsEnabled { get; set; } = true;
    public bool IsAiEnabled { get; set; } = true;
}
