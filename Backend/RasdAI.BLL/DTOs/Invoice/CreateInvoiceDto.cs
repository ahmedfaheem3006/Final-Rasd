using System;
using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Invoice;

public class CreateInvoiceDto
{
    public int? DealId { get; set; }

    public int? ContractId { get; set; }

    [Required(ErrorMessage = "العميل مطلوب")]
    public int ClientId { get; set; }

    [Required(ErrorMessage = "المبلغ الإجمالي مطلوب")]
    [Range(0.01, double.MaxValue, ErrorMessage = "المبلغ يجب أن يكون أكبر من صفر")]
    public decimal TotalAmount { get; set; }

    [Required(ErrorMessage = "تاريخ الاستحقاق مطلوب")]
    public DateTime DueDate { get; set; }

    [Required(ErrorMessage = "حالة الفاتورة مطلوبة")]
    [StringLength(50, ErrorMessage = "الحالة طويلة جداً")]
    public string Status { get; set; } = "Unpaid"; // e.g. "Unpaid", "Paid", "Overdue"
}
