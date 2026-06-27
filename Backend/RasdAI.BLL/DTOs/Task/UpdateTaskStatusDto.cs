using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Task;

public class UpdateTaskStatusDto
{
    [Required(ErrorMessage = "الحالة الجديدة مطلوبة")]
    [StringLength(50, ErrorMessage = "الحالة طويلة جداً")]
    public string Status { get; set; } = string.Empty;
}
