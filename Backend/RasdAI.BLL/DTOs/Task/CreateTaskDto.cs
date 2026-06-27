using System;
using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Task;

public class CreateTaskDto
{
    [Required(ErrorMessage = "عنوان المهمة مطلوب")]
    [StringLength(300, ErrorMessage = "عنوان المهمة طويل جداً")]
    public string Title { get; set; } = string.Empty;

    public int? AssignedUserId { get; set; }

    public int? MeetingId { get; set; }

    [Required(ErrorMessage = "حالة المهمة مطلوبة")]
    [StringLength(50, ErrorMessage = "حالة المهمة طويلة جداً")]
    public string Status { get; set; } = "Todo"; // e.g. "Todo", "InProgress", "Done"

    [Required(ErrorMessage = "تاريخ الاستحقاق مطلوب")]
    public DateTime DueDate { get; set; }
}
