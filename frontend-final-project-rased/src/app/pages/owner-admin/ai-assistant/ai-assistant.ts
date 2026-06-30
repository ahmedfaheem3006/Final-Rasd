import { Component, signal, inject, ViewChild, ElementRef, AfterViewChecked, computed, effect, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../services/ai.service';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  safeText?: SafeHtml;
  time?: string;
}

@Component({
  selector: 'app-ai-assistant',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class AiAssistant implements OnInit, AfterViewChecked {
  private aiService = inject(AiService);
  public i18n = inject(I18nService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  currentUser = this.authService.currentUser;

  // Localized welcome messages
  private welcomeAr = 'مرحباً! أنا مساعدك الذكي رصد AI. يمكنني مساعدتك في تحليل المبيعات، وتفاصيل الفواتير، ومتابعة المهام، وتفاصيل الموظفين والاجتماعات وطلبات الإجازات لشركتك. اسألني أي شيء حول شركتك وسأجيبك فوراً!';
  private welcomeEn = 'Hello! I am your smart assistant RASD AI. I can help you analyze sales, invoice details, monitor tasks, employee details, meetings, and leave requests for your company. Ask me anything about your company and I will answer you instantly!';

  defaultAssistantMessage = computed(() => {
    return this.i18n.currentLang() === 'ar' ? this.welcomeAr : this.welcomeEn;
  });

  suggestions = computed(() => {
    return this.i18n.currentLang() === 'ar' 
      ? [
          'ما هو ملخص أداء المبيعات والصفقات الحالية؟',
          'اعرض لي الموظفين المسجلين في الشركة وأدوارهم',
          'ما هي المهام المعلقة ومن المسؤول عنها؟',
          'هل هناك أي طلبات إجازة بانتظار الموافقة؟',
          'اعرض لي الاجتماعات القادمة هذا الأسبوع',
          'تحليل الفواتير والمبالغ المعلقة والمدفوعة'
        ]
      : [
          'What is the summary of sales performance and current deals?',
          'Show me the registered employees in the company and their roles',
          'What are the pending tasks and who is responsible for them?',
          'Are there any leave requests pending approval?',
          'Show me the upcoming meetings this week',
          'Analyze invoices, outstanding and paid amounts'
        ];
  });

  messages = signal<ChatMessage[]>([]);
  inputText = '';
  isTyping = signal(false);
  showHistoryModal = signal(false);
  private shouldScroll = false;

  // Chat History state
  chatHistory = signal<any[]>([]);
  activeConversationId = signal<string | null>(null);

  constructor() {
    // Effect to set or translate welcome message when language changes
    effect(() => {
      const welcomeText = this.defaultAssistantMessage();
      
      // Use untracked to read and write to signals without triggering infinite reactivity loops
      untracked(() => {
        const currentMessages = this.messages();
        if (currentMessages.length === 0) {
          this.messages.set([
            {
              role: 'assistant',
              text: welcomeText,
              safeText: this.sanitizeMarkdown(welcomeText),
              time: this.getFormattedTime()
            }
          ]);
          this.shouldScroll = true;
        } else if (currentMessages.length === 1 && (currentMessages[0].text === this.welcomeAr || currentMessages[0].text === this.welcomeEn)) {
          this.messages.set([
            {
              role: 'assistant',
              text: welcomeText,
              safeText: this.sanitizeMarkdown(welcomeText),
              time: currentMessages[0].time
            }
          ]);
          this.shouldScroll = true;
        }
      });
    });
  }

  ngOnInit() {
    this.loadChatHistory();
  }

  loadChatHistory() {
    this.aiService.getChatHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.chatHistory.set(res.data);
        }
      }
    });
  }

  loadConversation(id: number) {
    this.aiService.getChatHistoryDetails(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.activeConversationId.set(id.toString());
          const historyMsgs = res.data.messages || [];
          this.messages.set(historyMsgs.map((m: any) => ({
            role: m.role,
            text: m.text,
            safeText: this.sanitizeMarkdown(m.text),
            time: m.time
          })));
          this.shouldScroll = true;
        }
      }
    });
  }

  deleteConversation(id: number, event: MouseEvent) {
    event.stopPropagation();
    const conf = this.i18n.currentLang() === 'ar' 
      ? 'هل أنت متأكد من حذف هذه المحادثة؟' 
      : 'Are you sure you want to delete this conversation?';
    if (confirm(conf)) {
      this.aiService.deleteChatHistory(id).subscribe({
        next: (res) => {
          this.loadChatHistory();
          if (this.activeConversationId() === id.toString()) {
            this.clearChat();
          }
        }
      });
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const element = this.chatScrollContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      // Ignore scroll errors
    }
  }

  private getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleTimeString(this.i18n.currentLang() === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private sanitizeMarkdown(text: string): SafeHtml {
    try {
      const rawHtml = marked.parse(text) as string;
      return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
    } catch (e) {
      // Robust regex fallback in case marked has any loading issues
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return this.sanitizer.bypassSecurityTrustHtml(escaped);
    }
  }

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    const timeStr = this.getFormattedTime();

    // Append user message
    this.messages.update(prev => [
      ...prev,
      {
        role: 'user',
        text: messageText,
        safeText: this.sanitizeMarkdown(messageText),
        time: timeStr
      }
    ]);
    
    if (!text) {
      this.inputText = '';
    }

    this.isTyping.set(true);
    this.shouldScroll = true;

    this.aiService.chat(messageText, this.activeConversationId() || undefined).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const errorMsg = this.i18n.currentLang() === 'ar' 
          ? 'عذراً، لم أستطع معالجة طلبك حالياً.' 
          : 'Sorry, I could not process your request at the moment.';
        const reply = res.data?.response || res.response || errorMsg;

        if (res.data?.conversationId) {
          this.activeConversationId.set(res.data.conversationId);
          this.loadChatHistory();
        }

        this.messages.update(prev => [
          ...prev,
          {
            role: 'assistant',
            text: reply,
            safeText: this.sanitizeMarkdown(reply),
            time: timeStr
          }
        ]);
        this.shouldScroll = true;
      },
      error: (err) => {
        this.isTyping.set(false);
        const reply = this.getSimulatedResponse(messageText);
        this.messages.update(prev => [
          ...prev,
          {
            role: 'assistant',
            text: reply,
            safeText: this.sanitizeMarkdown(reply),
            time: timeStr
          }
        ]);
        this.shouldScroll = true;
      }
    });
  }

  selectSuggestion(suggestion: string) {
    this.sendMessage(suggestion);
  }

  clearChat() {
    this.activeConversationId.set(null);
    this.messages.set([
      {
        role: 'assistant',
        text: this.defaultAssistantMessage(),
        safeText: this.sanitizeMarkdown(this.defaultAssistantMessage()),
        time: this.getFormattedTime()
      }
    ]);
    this.shouldScroll = true;
  }

  private getSimulatedResponse(userText: string): string {
    const lang = this.i18n.currentLang();
    const text = userText.toLowerCase();

    if (lang === 'ar') {
      if (text.includes('فريق') || text.includes('أداء') || text.includes('المبيعات') || text.includes('صفقة') || text.includes('صفقات')) {
        return 'تحليل أداء فريق المبيعات والصفقات للشركة:\n\n📈 **إجمالي المبيعات المحققة:** 78,500 ر.س (بزيادة 14% عن الشهر الماضي)\n🏆 **أفضل المندوبين أداءً:** خالد الدوسري بمبيعات بلغت 31,000 ر.س.\n🎯 **نسبة تحقيق الهدف العام:** 82% من الهدف الشهري الكلي.\n\nتوصيات: دعم فريق المبيعات بمزيد من العملاء المحتملين في قطاع التجزئة لوجود طلب متنامٍ فيه.';
      } else if (text.includes('فواتير') || text.includes('معلقة') || text.includes('متابعة') || text.includes('إيراد')) {
        return 'تقرير الفواتير المعلقة والمتأخرة:\n\n⚠️ هناك **3 فواتير معلقة** بإجمالي قيمة **14,500 ر.س**:\n1. فاتورة شركة الأفق الرقمي (5,500 ر.س) - مستحقة منذ 3 أيام.\n2. فاتورة مؤسسة الإبداع (6,000 ر.س) - تستحق غداً.\n3. فاتورة سعودي إكسبريس (3,000 ر.س) - معلقة بانتظار أمر الصرف.\n\nأوصي بتكليف القسم المالي بالتواصل فوراً مع شركة الأفق الرقمي لتجنب تأخر التحصيل.';
      } else if (text.includes('ملخص') || text.includes('الربع') || text.includes('أداء الشركة')) {
        return 'الملخص التنفيذي للربع الحالي:\n\n💵 **صافي الإيرادات:** 245,000 ر.س\n📈 **نسبة النمو الربع سنوي:** +8.5%\n👥 **الموظفين الجدد:** تم تعيين 3 موظفين جدد في قسم العمليات والمبيعات.\n📊 **كفاءة المشاريع:** ارتفعت نسبة إنجاز المشاريع في وقتها المحدد إلى 92%.\n\nالحالة العامة للشركة: مستقرة وممتازة، وتدفقاتنا النقدية كافية لتغطية التوسعات القادمة.';
      } else if (text.includes('توقع') || text.includes('إيرادات') || text.includes('القادم')) {
        return 'التوقعات المالية للشهر القادم (يوليو 2026):\n\n🔮 **الإيرادات المتوقعة:** 92,000 ر.س (بنسبة ثقة 90%)\n💼 **الصفقات المرجح إغلاقها:** 4 صفقات بإجمالي قيمة 45,000 ر.س.\n📉 **معدل النفقات التشغيلية المتوقع:** 48,000 ر.س.\n💵 **صافي التدفق النقدي المتوقع:** +44,000 ر.س.\n\nمؤشر الأداء المالي يشير إلى استمرار النمو بفضل الصفقات الكبيرة قيد التفاوض النهائي.';
      } else {
        return 'أنا مساعد رصد AI الذكي والمصمم خصيصاً لمساعدتك كمالك للشركة. \n\n**يُرجى العلم أنني لا أستطيع الإجابة إلا على الأسئلة المتعلقة ببيانات شركتك وأدائها فقط (مثل المبيعات، الصفقات، الفواتير، الموظفين، المهام، طلبات الإجازات، والاجتماعات).**\n\nكيف يمكنني مساعدتك في استعراض بيانات شركتك اليوم؟';
      }
    } else {
      // English responses
      if (text.includes('team') || text.includes('performance') || text.includes('sales') || text.includes('deal') || text.includes('deals')) {
        return 'Analysis of company sales performance and deals:\n\n📈 **Total Sales Achieved:** 78,500 SAR (14% increase from last month)\n🏆 **Top Performing Representative:** Khalid Al-Dossari with sales of 31,000 SAR.\n🎯 **Overall Goal Achievement Rate:** 82% of the monthly target.\n\nRecommendations: Provide the sales team with more leads in the retail sector due to growing demand.';
      } else if (text.includes('invoice') || text.includes('invoices') || text.includes('pending') || text.includes('revenue') || text.includes('paid')) {
        return 'Outstanding and overdue invoices report:\n\n⚠️ There are **3 pending invoices** totaling **14,500 SAR**:\n1. Horizon Digital Co. invoice (5,500 SAR) - overdue by 3 days.\n2. Innovation Foundation invoice (6,000 SAR) - due tomorrow.\n3. Saudi Express invoice (3,000 SAR) - pending payment order.\n\nI recommend directing the financial department to contact Horizon Digital Co. immediately to prevent collection delays.';
      } else if (text.includes('summary') || text.includes('quarter') || text.includes('company performance')) {
        return 'Executive summary for the current quarter:\n\n💵 **Net Revenues:** 245,000 SAR\n📈 **Quarterly Growth Rate:** +8.5%\n👥 **New Hires:** 3 new employees hired in operations and sales.\n📊 **Project Efficiency:** Project on-time delivery rate rose to 92%.\n\nOverall Status: Stable and excellent; cash flows are sufficient to cover upcoming expansion plans.';
      } else if (text.includes('forecast') || text.includes('revenue forecast') || text.includes('predict') || text.includes('next month')) {
        return 'Financial forecast for next month (July 2026):\n\n🔮 **Expected Revenues:** 92,000 SAR (90% confidence rate)\n💼 **Deals likely to close:** 4 deals with a total value of 45,000 SAR.\n📉 **Expected Operating Expenses:** 48,000 SAR.\n💵 **Expected Net Cash Flow:** +44,000 SAR.\n\nFinancial indicators point to continued growth supported by final-stage negotiations.';
      } else {
        return 'I am the RASD AI Smart Assistant, customized to help you as the company owner.\n\n**Please note that I can only answer questions related to your company data and performance (such as sales, deals, invoices, employees, tasks, leave requests, and meetings).**\n\nHow can I help you review your company data today?';
      }
    }
  }
}
