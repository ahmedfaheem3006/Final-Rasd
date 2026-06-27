using System.Threading.Tasks;

namespace RasdAI.BLL.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}
