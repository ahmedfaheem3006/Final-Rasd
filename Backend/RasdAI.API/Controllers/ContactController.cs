using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly AppDbContext _context;

    public ContactController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages()
    {
        try
        {
            var messages = await _context.ContactMessages
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
            return Ok(messages);
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = "حدث خطأ أثناء جلب الرسائل: " + ex.Message });
        }
    }

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitContact([FromBody] ContactSubmissionDto dto)
    {
        try
        {
            var contactMessage = new ContactMessage
            {
                Id = Guid.NewGuid(),
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow
            };

            _context.ContactMessages.Add(contactMessage);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = "حدث خطأ أثناء إرسال الرسالة: " + ex.Message });
        }
    }
}

public class ContactSubmissionDto
{
    [Required(ErrorMessage = "الاسم الأول مطلوب")]
    [MaxLength(100, ErrorMessage = "الاسم الأول يجب ألا يتجاوز 100 حرف")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "الاسم الأخير مطلوب")]
    [MaxLength(100, ErrorMessage = "الاسم الأخير يجب ألا يتجاوز 100 حرف")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
    [MaxLength(255, ErrorMessage = "البريد الإلكتروني يجب ألا يتجاوز 255 حرف")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "نص الرسالة مطلوب")]
    [MaxLength(2000, ErrorMessage = "نص الرسالة يجب ألا يتجاوز 2000 حرف")]
    public string Message { get; set; } = string.Empty;
}
