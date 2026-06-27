using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using RasdAI.BLL.Interfaces;

namespace RasdAI.BLL.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var host = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
        var port = int.Parse(emailSettings["SmtpPort"] ?? "587");
        var fromEmail = emailSettings["SenderEmail"];
        var password = emailSettings["SenderPassword"];

        if (string.IsNullOrEmpty(fromEmail) || string.IsNullOrEmpty(password) || fromEmail == "YOUR_GMAIL@gmail.com")
        {
            Console.WriteLine("====================================================================");
            Console.WriteLine("[EmailService] Mock Email Sent (Actual credentials not configured)");
            Console.WriteLine($"To: {toEmail}");
            Console.WriteLine($"Subject: {subject}");
            Console.WriteLine($"Body: \n{body}");
            Console.WriteLine("====================================================================");
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, "Rasd AI System"),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        message.To.Add(new MailAddress(toEmail));

        using var client = new SmtpClient(host, port)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(fromEmail, password),
            EnableSsl = true
        };

        try
        {
            await client.SendMailAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] Failed to send email to {toEmail}. Error: {ex.Message}");
            throw new Exception("حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى التأكد من الإعدادات.");
        }
    }
}
