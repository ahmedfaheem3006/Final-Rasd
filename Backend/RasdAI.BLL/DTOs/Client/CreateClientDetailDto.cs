using System.ComponentModel.DataAnnotations;

namespace RasdAI.BLL.DTOs.Client;

public class CreateClientDetailDto
{
    [Required(ErrorMessage = "اسم الشركة مطلوب")]
    [StringLength(200, ErrorMessage = "اسم الشركة طويل جداً")]
    public string CompanyName { get; set; } = string.Empty;

    public string? CommercialRegistration { get; set; }
    public string? TaxNumber { get; set; }
    public string? Industry { get; set; }
    public string? Website { get; set; }
    public string? CompanySize { get; set; }
    public string? Description { get; set; }
    public string? Logo { get; set; }

    [Required(ErrorMessage = "اسم المالك مطلوب")]
    [StringLength(200, ErrorMessage = "اسم المالك طويل جداً")]
    public string OwnerName { get; set; } = string.Empty;

    [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "رقم الهاتف مطلوب")]
    [Phone(ErrorMessage = "رقم الهاتف غير صحيح")]
    public string Phone { get; set; } = string.Empty;

    public string? JobTitle { get; set; }
    public string? Country { get; set; }
    public string? Governorate { get; set; }
    public string? City { get; set; }
    public string? Street { get; set; }
    public string? PostalCode { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Currency { get; set; }
    public decimal? OpeningBalance { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string Status { get; set; } = "Active";
}
