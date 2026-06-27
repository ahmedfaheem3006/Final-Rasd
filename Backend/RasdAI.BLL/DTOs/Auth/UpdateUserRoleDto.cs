using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Auth;

public class UpdateUserRoleDto
{
    [Required(ErrorMessage = "الدور الجديد مطلوب")]
    public int RoleId { get; set; }
}
