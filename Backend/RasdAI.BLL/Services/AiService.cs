using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RasdAI.BLL.DTOs.Ai;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;
using UglyToad.PdfPig;

namespace RasdAI.BLL.Services;

public class AiService : IAiService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly string _apiKey1;
    private readonly string _apiKey2;
    private readonly string _grokApiKey;
    private readonly string _grokModel;
    private readonly bool _useDemoFallback;

    public AiService(AppDbContext context, IConfiguration config, HttpClient httpClient)
    {
        _context = context;
        _httpClient = httpClient;
        
        var aiSettings = config.GetSection("AiSettings");
        _apiKey1 = aiSettings["OpenAiApiKey1"] ?? string.Empty;
        _apiKey2 = aiSettings["OpenAiApiKey2"] ?? string.Empty;
        _grokApiKey = aiSettings["GrokApiKey"] ?? string.Empty;
        _grokModel = aiSettings["GrokModel"] ?? "grok-2-1212";
        _useDemoFallback = bool.Parse(aiSettings["UseDemoFallback"] ?? "true");
    }

    public async Task<ContractAnalysisResultDto> AnalyzeContractAsync(string fileName, byte[] fileBytes, Guid tenantId)
    {
        // 1. Extract text from PDF using PdfPig
        string contractText = string.Empty;
        try
        {
            var textBuilder = new StringBuilder();
            using (var pdf = PdfDocument.Open(fileBytes))
            {
                foreach (var page in pdf.GetPages())
                {
                    textBuilder.AppendLine(page.Text);
                }
            }
            contractText = textBuilder.ToString();
        }
        catch (Exception ex)
        {
            contractText = $"[خطأ في قراءة ملف PDF: {ex.Message}]";
        }

        if (string.IsNullOrWhiteSpace(contractText))
        {
            contractText = $"[اسم الملف: {fileName} - العقد لا يحتوي على نصوص قابلة للاستخراج]";
        }

        // 2. Query LLM if API keys are available and Demo mode is not strictly forced
        if (!_useDemoFallback)
        {
            if (!string.IsNullOrEmpty(_grokApiKey))
            {
                try
                {
                    return await CallGrokForContractAnalysisAsync(contractText, _grokApiKey, _grokModel);
                }
                catch (Exception)
                {
                    // Fall through to OpenAI or Demo
                }
            }

            if (!string.IsNullOrEmpty(_apiKey1) || !string.IsNullOrEmpty(_apiKey2))
            {
                var key = !string.IsNullOrEmpty(_apiKey1) ? _apiKey1 : _apiKey2;
                try
                {
                    return await CallOpenAiForContractAnalysisAsync(contractText, key);
                }
                catch (Exception)
                {
                    // Fall through to demo fallback
                }
            }
        }

        // 3. Demo Fallback Mode
        return GenerateDemoContractAnalysis(fileName, contractText);
    }

    public async Task<MeetingTranscriptionResultDto> TranscribeMeetingAsync(string fileName, byte[] fileBytes, Guid tenantId)
    {
        // Query LLM / Whisper if API keys are available and Demo mode is not forced
        if (!_useDemoFallback)
        {
            try
            {
                string? transcript = null;
                var openAiKey = !string.IsNullOrEmpty(_apiKey1) ? _apiKey1 : _apiKey2;
                if (!string.IsNullOrEmpty(openAiKey))
                {
                    // Whisper API call (OpenAI is required for transcription since x.ai has no audio API yet)
                    transcript = await CallWhisperApiAsync(fileBytes, fileName, openAiKey);
                }

                if (!string.IsNullOrEmpty(transcript))
                {
                    if (!string.IsNullOrEmpty(_grokApiKey))
                    {
                        try
                        {
                            return await CallGrokForMeetingTasksAsync(transcript, tenantId, _grokApiKey, _grokModel);
                        }
                        catch (Exception)
                        {
                            // Fall through
                        }
                    }

                    if (!string.IsNullOrEmpty(openAiKey))
                    {
                        try
                        {
                            return await CallOpenAiForMeetingTasksAsync(transcript, tenantId, openAiKey);
                        }
                        catch (Exception)
                        {
                            // Fall through
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Fall through to demo fallback
            }
        }

        // Demo Fallback Mode
        return await GenerateDemoMeetingTranscriptionAsync(fileName, tenantId);
    }

    public async Task<AiAssistantResponseDto> ChatWithAssistantAsync(AiAssistantRequestDto requestDto, Guid tenantId, int userId)
    {
        // ══════════════════════════════════════════════════════════════
        // 1. FETCH COMPREHENSIVE COMPANY DATA (Tenant-Scoped)
        // ══════════════════════════════════════════════════════════════

        var company = await _context.Tenants.FindAsync(tenantId);
        var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);

        // -- Users & Team --
        var users = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.TenantId == tenantId)
            .ToListAsync();
        var usersText = string.Join("\n", users.Select(u =>
            $"  • {u.FullName} — الدور: {u.Role?.Name ?? "غير محدد"} — البريد: {u.Email} — الحالة: {u.Status}"));

        // -- Clients --
        var clients = await _context.Clients
            .Where(c => c.TenantId == tenantId)
            .ToListAsync();
        var clientsText = clients.Count > 0
            ? string.Join("\n", clients.Select(c =>
                $"  • {c.Name} — البريد: {c.Email} — الهاتف: {c.Phone}"))
            : "  لا يوجد عملاء مسجلين حالياً";

        // -- Deals --
        var deals = await _context.Deals
            .Include(d => d.Client)
            .Include(d => d.AssignedUser)
            .Where(d => d.TenantId == tenantId)
            .ToListAsync();
        var wonDealsValue = deals.Where(d => d.Status == "Won").Sum(d => d.Amount);
        var pendingDealsValue = deals.Where(d => d.Status != "Lost" && d.Status != "Won").Sum(d => d.Amount);
        var dealsText = deals.Count > 0
            ? string.Join("\n", deals.Select(d =>
                $"  • صفقة مع \"{d.Client?.Name ?? "غير محدد"}\" — المبلغ: {d.Amount:N2} ر.س — الحالة: {d.Status} — المسؤول: {d.AssignedUser?.FullName ?? "غير مُسند"}"))
            : "  لا توجد صفقات حالياً";

        // -- Invoices --
        var invoices = await _context.Invoices
            .Include(i => i.Deal).ThenInclude(d => d.Client)
            .Where(i => i.TenantId == tenantId)
            .ToListAsync();
        var paidRevenue = invoices.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount);
        var unpaidRevenue = invoices.Where(i => i.Status == "Unpaid").Sum(i => i.TotalAmount);
        var overdueRevenue = invoices.Where(i => i.Status == "Overdue").Sum(i => i.TotalAmount);
        var invoicesText = invoices.Count > 0
            ? string.Join("\n", invoices.Select(i =>
                $"  • فاتورة #{i.Id} — العميل: \"{i.Deal?.Client?.Name ?? "غير محدد"}\" — المبلغ: {i.TotalAmount:N2} ر.س — الحالة: {i.Status} — تاريخ الاستحقاق: {i.DueDate:yyyy-MM-dd}"))
            : "  لا توجد فواتير حالياً";

        // -- Tasks --
        var tasks = await _context.Tasks
            .Include(t => t.AssignedUser)
            .Where(t => t.TenantId == tenantId)
            .ToListAsync();
        var pendingTasksCount = tasks.Count(t => t.Status != "Done");
        var tasksText = tasks.Count > 0
            ? string.Join("\n", tasks.Select(t =>
                $"  • \"{t.Title}\" — الحالة: {t.Status} — مُسند إلى: {t.AssignedUser?.FullName ?? "غير مُسند"} — الموعد النهائي: {t.DueDate:yyyy-MM-dd}"))
            : "  لا توجد مهام حالياً";

        // -- Leave Requests --
        var leaves = await _context.LeaveRequests
            .Include(l => l.Employee)
            .Where(l => l.TenantId == tenantId && !l.IsDeleted)
            .ToListAsync();
        var pendingLeaves = leaves.Where(l => l.Status == "Pending").ToList();
        var leavesText = leaves.Count > 0
            ? string.Join("\n", leaves.Select(l =>
                $"  • {l.Employee?.FullName ?? "غير محدد"} — النوع: {l.LeaveType} — من {l.StartDate:yyyy-MM-dd} إلى {l.EndDate:yyyy-MM-dd} ({l.TotalDays} يوم) — الحالة: {l.Status}"))
            : "  لا توجد طلبات إجازة";

        // -- Meetings --
        var meetings = await _context.MeetingSchedules
            .Where(m => m.TenantId == tenantId)
            .OrderBy(m => m.MeetingDate)
            .ToListAsync();
        var upcomingMeetings = meetings.Where(m => m.MeetingDate >= DateTime.UtcNow.Date).ToList();
        var meetingsText = meetings.Count > 0
            ? string.Join("\n", meetings.Select(m =>
                $"  • \"{m.Title}\" — التاريخ: {m.MeetingDate:yyyy-MM-dd} الساعة {m.MeetingTime} — المدة: {m.Duration} — النوع: {m.MeetingType} — المكان: {m.Location}"))
            : "  لا توجد اجتماعات مجدولة";

        // ══════════════════════════════════════════════════════════════
        // 2. BUILD PROFESSIONAL SYSTEM PROMPT WITH GUARDRAILS
        // ══════════════════════════════════════════════════════════════

        var systemContext = $@"
# هويتك
أنت **رصد AI** — المساعد الذكي الخاص بشركة ""{company?.Name ?? "الشركة"}"". أنت مساعد أعمال متخصص تعمل حصرياً مع بيانات هذه الشركة.

# قواعد صارمة يجب اتباعها دائماً:

## 1. نطاق العمل الحصري
- أنت تجيب **فقط** على الأسئلة المتعلقة ببيانات الشركة: العملاء، الصفقات، الفواتير، المهام، الإجازات، الاجتماعات، الموظفين، الإيرادات، والأداء.
- إذا سألك المستخدم سؤالاً **خارج نطاق الشركة** (مثل: الطقس، الرياضة، الطبخ، البرمجة العامة، الأخبار، أي شيء شخصي أو عام):
  → **ارفض الإجابة بلطف واحترافية** وقل له أن تخصصك هو بيانات الشركة فقط، واقترح عليه أسئلة يمكنه طرحها.

## 2. تنسيق الإجابة (مهم جداً)
- استخدم **Markdown** في كل إجاباتك.
- استخدم العناوين (## و ###) لتنظيم الأقسام.
- استخدم **النقاط** (- أو •) لعرض القوائم.
- استخدم **الخط العريض** (**نص**) للأرقام والقيم المهمة.
- استخدم الإيموجي المناسب (📊 💰 👥 📋 ✅ ⚠️ 📅 🎯) لتمييز الأقسام.
- اجعل الرد منظماً ومرتباً وسهل القراءة كأنك تقدم تقريراً إدارياً احترافياً.
- لا تستخدم جداول Markdown إلا إذا كانت البيانات تستدعي ذلك فعلاً.

## 3. الدقة والأمانة
- استخدم **الأرقام الحقيقية** الموجودة في البيانات أدناه فقط. لا تختلق أي أرقام أو أسماء.
- إذا لم تجد بيانات كافية للإجابة، أخبر المستخدم بذلك بوضوح.

## 4. اللغة (Language Support)
- أجب بنفس اللغة التي كتب بها المستخدم سؤاله (العربية أو الإنجليزية).
- إذا كانت رسالة المستخدم باللغة العربية، أجب باللغة العربية الفصحى وبشكل منسق واحترافي.
- If the user writes in English, you MUST respond in English. You must translate any Arabic statistics or details from the context data below (such as names, statuses, or titles) into fluent English in your response. Keep a professional corporate tone.

# المستخدم الحالي
- الاسم: {user?.FullName ?? "غير محدد"}
- الدور: {user?.Role?.Name ?? "غير محدد"}
- البريد: {user?.Email ?? "غير محدد"}

# ═══════════════════════════════════════
# بيانات الشركة الحقيقية والمحدثة
# ═══════════════════════════════════════

## 👥 الموظفون ({users.Count} موظف):
{usersText}

## 🤝 العملاء ({clients.Count} عميل):
{clientsText}

## 💼 الصفقات ({deals.Count} صفقة):
{dealsText}
📈 ملخص الصفقات:
  - صفقات رابحة: {wonDealsValue:N2} ر.س
  - صفقات قيد التفاوض: {pendingDealsValue:N2} ر.س
  - صفقات خاسرة: {deals.Count(d => d.Status == "Lost")} صفقة

## 🧾 الفواتير ({invoices.Count} فاتورة):
{invoicesText}
💰 ملخص مالي:
  - إيرادات محصلة (مدفوعة): {paidRevenue:N2} ر.س
  - مبالغ معلقة (غير مدفوعة): {unpaidRevenue:N2} ر.س
  - مبالغ متأخرة (Overdue): {overdueRevenue:N2} ر.س

## 📋 المهام ({tasks.Count} مهمة — {pendingTasksCount} معلقة):
{tasksText}

## 📅 طلبات الإجازات ({leaves.Count} طلب — {pendingLeaves.Count} بانتظار الموافقة):
{leavesText}

## 🗓️ الاجتماعات ({meetings.Count} اجتماع — {upcomingMeetings.Count} قادم):
{meetingsText}
";

        // ══════════════════════════════════════════════════════════════
        // 3. CALL LLM API
        // ══════════════════════════════════════════════════════════════

        if (!_useDemoFallback)
        {
            if (!string.IsNullOrEmpty(_grokApiKey))
            {
                try
                {
                    var responseText = await CallGrokForChatAsync(requestDto.Message, systemContext, _grokApiKey, _grokModel);
                    return new AiAssistantResponseDto
                    {
                        Response = responseText,
                        ConversationId = requestDto.ConversationId ?? Guid.NewGuid().ToString(),
                        IsDemo = false
                    };
                }
                catch (Exception)
                {
                    // Fall through
                }
            }

            if (!string.IsNullOrEmpty(_apiKey1) || !string.IsNullOrEmpty(_apiKey2))
            {
                var key = !string.IsNullOrEmpty(_apiKey1) ? _apiKey1 : _apiKey2;
                try
                {
                    var responseText = await CallOpenAiForChatAsync(requestDto.Message, systemContext, key);
                    return new AiAssistantResponseDto
                    {
                        Response = responseText,
                        ConversationId = requestDto.ConversationId ?? Guid.NewGuid().ToString(),
                        IsDemo = false
                    };
                }
                catch (Exception)
                {
                    // Fall through to demo fallback
                }
            }
        }

        // Demo/Offline Fallback
        var demoResponse = GenerateDemoChatResponse(requestDto.Message, clients.Count, deals.Count, pendingDealsValue, wonDealsValue, paidRevenue, pendingTasksCount);

        return new AiAssistantResponseDto
        {
            Response = demoResponse,
            ConversationId = requestDto.ConversationId ?? Guid.NewGuid().ToString(),
            IsDemo = true
        };
    }

    #region OpenAI Direct API Calls

    private async Task<ContractAnalysisResultDto> CallOpenAiForContractAnalysisAsync(string contractText, string apiKey)
    {
        var truncatedText = contractText.Length > 6000 ? contractText.Substring(0, 6000) : contractText;
        
        var requestBody = new
        {
            model = "gpt-4o-mini",
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = "Analyze the contract text. Provide a summary, list of parties, expiry date, contract value, and clauses categorized by severity (Red/Orange/Blue/Green). Severity levels: Red (Highly critical/dangerous clauses that the owner must pay close attention to), Orange (Warning points/penalties/liabilities), Blue (Medium/informational clauses), Green (Safe, secure, or beneficial clauses for the company). You must respond strictly in JSON format matching this schema: { \"summary\": \"...\", \"parties\": [\"...\"], \"expiryDate\": \"...\", \"value\": \"...\", \"risks\": [ { \"description\": \"...\", \"severity\": \"Red/Orange/Blue/Green\" } ] }. Write the summary and descriptions in the same language as the contract (or Arabic by default)." },
                new { role = "user", content = truncatedText }
            },
            temperature = 0.2
        };

        var response = await SendOpenAiRequestAsync("https://api.openai.com/v1/chat/completions", requestBody, apiKey);
        using var doc = JsonDocument.Parse(response);
        var jsonContent = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        
        var result = JsonSerializer.Deserialize<ContractAnalysisResultDto>(jsonContent ?? "{}", new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? new ContractAnalysisResultDto { Summary = "فشل تحليل العقد" };
    }

    private async Task<string> CallWhisperApiAsync(byte[] fileBytes, string fileName, string apiKey)
    {
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
        content.Add(fileContent, "file", fileName);
        content.Add(new StringContent("whisper-1"), "model");
        content.Add(new StringContent("ar"), "language"); // Force Arabic

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/audio/transcriptions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = content;

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseString = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseString);
        return doc.RootElement.GetProperty("text").GetString() ?? string.Empty;
    }

    private async Task<MeetingTranscriptionResultDto> CallOpenAiForMeetingTasksAsync(string transcript, Guid tenantId, string apiKey)
    {
        var users = await _context.Users.Where(u => u.TenantId == tenantId).ToListAsync();
        var usersListText = string.Join(", ", users.Select(u => $"ID: {u.Id} Name: {u.FullName}"));

        var requestBody = new
        {
            model = "gpt-4o-mini",
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = $"Analyze this meeting transcript in Arabic. Extract a summary and suggest actionable tasks. You must assign each task to a specific user from the list. Available Users: [{usersListText}]. Respond in JSON matching: {{ \"summary\": \"...\", \"proposedTasks\": [ {{ \"title\": \"...\", \"assignedUserId\": 123, \"assignedUserName\": \"...\", \"dueDate\": \"2026-06-20\" }} ] }}. Write in Arabic." },
                new { role = "user", content = transcript }
            },
            temperature = 0.2
        };

        var response = await SendOpenAiRequestAsync("https://api.openai.com/v1/chat/completions", requestBody, apiKey);
        using var doc = JsonDocument.Parse(response);
        var jsonContent = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

        var result = JsonSerializer.Deserialize<MeetingTranscriptionResultDto>(jsonContent ?? "{}", new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (result != null)
        {
            result.Transcript = transcript;
            return result;
        }

        return new MeetingTranscriptionResultDto { Transcript = transcript, Summary = "فشل تحليل مهام الاجتماع" };
    }

    private async Task<string> CallOpenAiForChatAsync(string userMessage, string systemContext, string apiKey)
    {
        var requestBody = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = systemContext },
                new { role = "user", content = userMessage }
            },
            temperature = 0.7
        };

        var response = await SendOpenAiRequestAsync("https://api.openai.com/v1/chat/completions", requestBody, apiKey);
        using var doc = JsonDocument.Parse(response);
        return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
    }

    private async Task<string> SendOpenAiRequestAsync(string url, object body, string apiKey)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        
        var json = JsonSerializer.Serialize(body);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();
    }

    #endregion

    #region Grok Direct API Calls

    private async Task<ContractAnalysisResultDto> CallGrokForContractAnalysisAsync(string contractText, string apiKey, string model)
    {
        var truncatedText = contractText.Length > 6000 ? contractText.Substring(0, 6000) : contractText;
        var targetModel = model;
        if (apiKey.StartsWith("gsk_"))
        {
            targetModel = "llama-3.3-70b-versatile";
        }
        
        var requestBody = new
        {
            model = targetModel,
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = "Analyze the contract text. Provide a summary, list of parties, expiry date, contract value, and clauses categorized by severity (Red/Orange/Blue/Green). Severity levels: Red (Highly critical/dangerous clauses that the owner must pay close attention to), Orange (Warning points/penalties/liabilities), Blue (Medium/informational clauses), Green (Safe, secure, or beneficial clauses for the company). You must respond strictly in JSON format matching this schema: { \"summary\": \"...\", \"parties\": [\"...\"], \"expiryDate\": \"...\", \"value\": \"...\", \"risks\": [ { \"description\": \"...\", \"severity\": \"Red/Orange/Blue/Green\" } ] }. Write the summary and descriptions in the same language as the contract (or Arabic by default)." },
                new { role = "user", content = truncatedText }
            },
            temperature = 0.2
        };

        var response = await SendGrokRequestAsync("https://api.x.ai/v1/chat/completions", requestBody, apiKey);
        using var doc = JsonDocument.Parse(response);
        var jsonContent = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        
        var result = JsonSerializer.Deserialize<ContractAnalysisResultDto>(jsonContent ?? "{}", new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? new ContractAnalysisResultDto { Summary = "فشل تحليل العقد" };
    }

    private async Task<MeetingTranscriptionResultDto> CallGrokForMeetingTasksAsync(string transcript, Guid tenantId, string apiKey, string model)
    {
        var users = await _context.Users.Where(u => u.TenantId == tenantId).ToListAsync();
        var usersListText = string.Join(", ", users.Select(u => $"ID: {u.Id} Name: {u.FullName}"));
        var targetModel = model;
        if (apiKey.StartsWith("gsk_"))
        {
            targetModel = "llama-3.3-70b-versatile";
        }

        var requestBody = new
        {
            model = targetModel,
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = $"Analyze this meeting transcript in Arabic. Extract a summary and suggest actionable tasks. You must assign each task to a specific user from the list. Available Users: [{usersListText}]. Respond in JSON matching: {{ \"summary\": \"...\", \"proposedTasks\": [ {{ \"title\": \"...\", \"assignedUserId\": 123, \"assignedUserName\": \"...\", \"dueDate\": \"2026-06-20\" }} ] }}. Write in Arabic." },
                new { role = "user", content = transcript }
            },
            temperature = 0.2
        };

        var response = await SendGrokRequestAsync("https://api.x.ai/v1/chat/completions", requestBody, apiKey);
        using var doc = JsonDocument.Parse(response);
        var jsonContent = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

        var result = JsonSerializer.Deserialize<MeetingTranscriptionResultDto>(jsonContent ?? "{}", new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (result != null)
        {
            result.Transcript = transcript;
            return result;
        }

        return new MeetingTranscriptionResultDto { Transcript = transcript, Summary = "فشل تحليل مهام الاجتماع" };
    }

    private async Task<string> CallGrokForChatAsync(string userMessage, string systemContext, string apiKey, string model)
    {
        var targetModel = model;
        if (apiKey.StartsWith("gsk_"))
        {
            targetModel = "llama-3.3-70b-versatile";
        }

        var requestBody = new
        {
            model = targetModel,
            messages = new[]
            {
                new { role = "system", content = systemContext },
                new { role = "user", content = userMessage }
            },
            temperature = 0.7
        };

        var response = await SendGrokRequestAsync("https://api.x.ai/v1/chat/completions", requestBody, apiKey);
        using var doc = JsonDocument.Parse(response);
        return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
    }

    private async Task<string> SendGrokRequestAsync(string url, object body, string apiKey)
    {
        var targetUrl = url;
        if (apiKey.StartsWith("gsk_"))
        {
            targetUrl = "https://api.groq.com/openai/v1/chat/completions";
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, targetUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        
        var json = JsonSerializer.Serialize(body);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();
    }

    #endregion

    #region Demo Response Generators

    private ContractAnalysisResultDto GenerateDemoContractAnalysis(string fileName, string extractedText)
    {
        bool isSupplyContract = fileName.Contains("توريد") || extractedText.Contains("توريد");
        bool isLeaseContract = fileName.Contains("إيجار") || extractedText.Contains("إيجار");

        if (isSupplyContract)
        {
            return new ContractAnalysisResultDto
            {
                Summary = "عقد لتوريد خدمات استشارية وتقنية للشركة، يتضمن شروط السداد ونسب الإنجاز وغرامات التأخير في التسليم.",
                Parties = new List<string> { "مجموعة الفتح التجارية (المورد)", "شركة رصد للتطوير والاستشارات (العميل)" },
                ExpiryDate = "2026/12/31",
                Value = "150,000 USD",
                Risks = new List<ContractRiskDto>
                {
                    new() { Description = "بند 5.2: يفرض غرامة تأخير قدرها 1% يومياً في حال تجاوز تاريخ تسليم البرمجيات المتفق عليه وبحد أقصى 15%.", Severity = "Red" },
                    new() { Description = "بند 8.1: فترة التجربة والقبول للمستندات والبرمجيات هي 5 أيام فقط، مما قد يعطي المورد حق تمرير النظام دون مراجعة كافية.", Severity = "Orange" },
                    new() { Description = "بند 11: يخضع العقد لقوانين المحاكم التجارية المحلية وفي حال النزاع يتم اللجوء للتحكيم.", Severity = "Blue" },
                    new() { Description = "بند 14: تلتزم الجهة الموردة بتقديم دعم فني مجاني وصيانة وتحديثات للنظام لمدة 24 شهراً بعد التسليم النهائي.", Severity = "Green" }
                },
                IsDemo = true
            };
        }
        else if (isLeaseContract)
        {
            return new ContractAnalysisResultDto
            {
                Summary = "عقد إيجار مقر إداري مخصص لمقر الشركة الرئيسي، موضحاً فيه شروط دفع القيمة الإيجارية السنوية ومبلغ التأمين وتكاليف الصيانة الدورية.",
                Parties = new List<string> { "شركة العقار العالمية (المؤجر)", "شركة رصد للتطوير والاستشارات (المستأجر)" },
                ExpiryDate = "2028/05/01",
                Value = "45,000 USD سنوياً",
                Risks = new List<ContractRiskDto>
                {
                    new() { Description = "بند 4: يحق للمؤجر زيادة القيمة الإيجارية السنوية بنسبة 10% تلقائياً دون إشعار مسبق عند التجديد.", Severity = "Red" },
                    new() { Description = "بند 6.2: مبلغ التأمين (3 أشهر) غير مسترد في حال فسخ العقد قبل انقضاء نصف المدة الإيجارية.", Severity = "Orange" },
                    new() { Description = "بند 9: تكاليف الصيانة الهيكلية تقع على المؤجر بينما الصيانة التشغيلية تقع بالكامل على عاتق المستأجر.", Severity = "Blue" },
                    new() { Description = "بند 7.3: يلتزم المؤجر بتحمل كافة نفقات ومصاريف التأمين والتراخيص والضرائب العقارية للمبنى.", Severity = "Green" }
                },
                IsDemo = true
            };
        }
        else
        {
            return new ContractAnalysisResultDto
            {
                Summary = "عقد اتفاقية تقديم خدمات عامة وتنظيم الحقوق والالتزامات للطرفين خلال مدة التعاقد.",
                Parties = new List<string> { "شركة المقاولات العربية (الطرف الأول)", "شركة رصد للتطوير والاستشارات (الطرف الثاني)" },
                ExpiryDate = "2027/06/15",
                Value = "75,000 USD",
                Risks = new List<ContractRiskDto>
                {
                    new() { Description = "بند الفسخ المبكر: يستلزم إخطار الطرف الآخر قبل 90 يوماً وإلا يلتزم بدفع تعويض يعادل 20% من قيمة العقد.", Severity = "Red" },
                    new() { Description = "الملكية الفكرية: غموض نسبي في تبعية الكود المصدري بعد إتمام خدمات التطوير.", Severity = "Orange" },
                    new() { Description = "شروط الدفع: الدفع خلال 30 يوماً من استلام الفاتورة الرسمية.", Severity = "Blue" },
                    new() { Description = "بند 12: تلتزم الشركة بتقديم ورش عمل وتدريب مجاني لموظفي الطرف الثاني على كيفية استخدام النظام وتطبيقاته.", Severity = "Green" }
                },
                IsDemo = true
            };
        }
    }

    private async Task<MeetingTranscriptionResultDto> GenerateDemoMeetingTranscriptionAsync(string fileName, Guid tenantId)
    {
        var users = await _context.Users.Where(u => u.TenantId == tenantId).ToListAsync();
        var owner = users.FirstOrDefault(u => u.RoleId == 2) ?? users.FirstOrDefault();
        var sales = users.FirstOrDefault(u => u.RoleId == 5 || u.RoleId == 4) ?? users.FirstOrDefault();
        var accountant = users.FirstOrDefault(u => u.RoleId == 3) ?? users.FirstOrDefault();

        return new MeetingTranscriptionResultDto
        {
            Transcript = "أهلاً بالجميع في اجتماع المبيعات والتخطيط الدوري لشركة رصد. أولاً، نحتاج من مندوب المبيعات متابعة العقد المعلق وتفاصيل الصفقة الخاصة بمجموعة الفتح للتأكد من إنهاء التوقيعات. ثانياً، يجب على المحاسب إعداد الفواتير الضريبية وتوليد الفاتورة الخاصة بشركة المقاولات العربية لضمان تحصيل المبالغ قبل نهاية الشهر. وأخيراً، نطلب من فريق المطورين تجهيز واجهات لوحة التحكم لمراجعتها مع المالك يوم الخميس القادم. شكراً لكم ولنبدأ العمل.",
            Summary = "اجتماع الشركة الأسبوعي لمتابعة حالة المبيعات، الفواتير المستحقة للعملاء، والتجهيز لمراجعة لوحة تحكم الإدارة.",
            ProposedTasks = new List<ProposedTaskDto>
            {
                new()
                {
                    Title = "متابعة العقد المعلق وإنهاء توقيعات صفقة مجموعة الفتح",
                    AssignedUserId = sales?.Id ?? 3,
                    AssignedUserName = sales?.FullName ?? "عمر البائع",
                    DueDate = DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-dd")
                },
                new()
                {
                    Title = "إعداد الفاتورة وتصديرها كـ PDF لشركة المقاولات العربية",
                    AssignedUserId = accountant?.Id ?? 4,
                    AssignedUserName = accountant?.FullName ?? "منى الحسابات",
                    DueDate = DateTime.UtcNow.AddDays(2).ToString("yyyy-MM-dd")
                },
                new()
                {
                    Title = "مراجعة واجهات لوحة التحكم الذكية مع الإدارة والمالك",
                    AssignedUserId = owner?.Id ?? 1,
                    AssignedUserName = owner?.FullName ?? "أحمد فهيم",
                    DueDate = DateTime.UtcNow.AddDays(5).ToString("yyyy-MM-dd")
                }
            },
            IsDemo = true
        };
    }

    private string GenerateDemoChatResponse(string message, int clients, int deals, decimal pendingValue, decimal wonValue, decimal paidRevenue, int pendingTasks)
    {
        message = message.ToLower();
        if (message.Contains("عميل") || message.Contains("العملاء"))
        {
            return $"مسجل لدينا حالياً في نظام شركتك عدد **{clients}** عميل. يمكنك إضافة عملاء جدد عبر شاشة العملاء ومتابعة ملاحظاتهم.";
        }
        if (message.Contains("صفقة") || message.Contains("المبيعات") || message.Contains("صفقات"))
        {
            return $"إحصائيات الصفقات لشركتك:\n- إجمالي الصفقات: **{deals}**\n- قيمة الصفقات الرابحة: **{wonValue:N2} USD**\n- قيمة الصفقات قيد التفاوض والمعلقة: **{pendingValue:N2} USD**\n\nيمكنك تحريك الصفقات وسحبها وإفلاتها عبر لوحة Kanban الصفقات التفاعلية.";
        }
        if (message.Contains("فاتورة") || message.Contains("فواتير") || message.Contains("مالية") || message.Contains("فلوس") || message.Contains("إيراد"))
        {
            return $"التقرير المالي السريع لشركتك:\n- إجمالي الإيرادات المحصلة: **{paidRevenue:N2} USD**\n\nيُرجى توجيه المحاسب لمراجعة الفواتير غير المدفوعة أو المتأخرة وتصدير فواتير PDF جديدة لإرسالها للعملاء.";
        }
        if (message.Contains("مهمة") || message.Contains("مهام") || message.Contains("تاسك"))
        {
            return $"يوجد حالياً **{pendingTasks}** مهمة معلقة لم تنتهِ بعد في شركتك. يمكنك إسناد مهام جديدة لأعضاء الفريق من خلال موديول المهام ومتابعة حالة تنفيذها بشكل لحظي.";
        }

        return $"مرحباً بك! أنا مساعد رصد AI الذكي. \n\nبناءً على بيانات شركتك الحالية:\n- العملاء: **{clients}**\n- الصفقات الرابحة: **{wonValue:N2} USD**\n- الصفقات الجارية: **{pendingValue:N2} USD**\n- المهام المعلقة: **{pendingTasks}**\n\nأنا جاهز لمساعدتك في أي سؤال حول المبيعات والمهام وتلخيص الاجتماعات وتحليل عقود العمل.";
    }

    #endregion
}
