using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Invoice;

public class InvoiceItemDto
{
    [Required(ErrorMessage = "وصف العنصر مطلوب")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "الكمية يجب أن تكون 1 أو أكثر")]
    public int Quantity { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "سعر الوحدة يجب أن يكون أكبر من صفر")]
    public decimal UnitPrice { get; set; }

    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal Subtotal { get; set; }
}
