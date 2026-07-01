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
  showLimitModal = signal(false);
  limitModalMessage = signal('');
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
        const serverMsg = err?.error?.message;
        if (serverMsg) {
          this.limitModalMessage.set(serverMsg);
          this.showLimitModal.set(true);
        } else {
          const reply = this.i18n.currentLang() === 'ar'
            ? 'تعذّر الاتصال بالخادم. تأكد من أن الخادم يعمل وأعد المحاولة.'
            : 'Could not reach the server. Please make sure the API is running and try again.';
          this.messages.update(prev => [...prev, { role: 'assistant', text: reply, safeText: this.sanitizeMarkdown(reply), time: timeStr }]);
        }
        this.shouldScroll = true;
      }
    });
  }

  selectSuggestion(suggestion: string) { this.sendMessage(suggestion); }

  closeLimitModal() { this.showLimitModal.set(false); }

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

}
