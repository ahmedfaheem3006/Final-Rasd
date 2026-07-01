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
  selector: 'app-sm-ai-assistant',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class SalesManagerAiAssistant implements OnInit, AfterViewChecked {
  private aiService = inject(AiService);
  public i18n = inject(I18nService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  currentUser = this.authService.currentUser;

  private welcomeAr = `مرحباً بك في مساعد إدارة المبيعات الذكي! 🎯\n\nأنا مساعدك المتخصص في **إدارة المبيعات** بجميع جوانبها:\n\n📊 **تحليل خط الأنابيب** — مراحل الصفقات واحتمالية الإغلاق\n🏆 **إدارة الفريق البيعي** — الأداء، التدريب، الجداول، والغياب\n💰 **توقعات الإيرادات** — التنبؤ بالمبيعات الشهرية والفصلية\n🔄 **معدلات التحويل** — تحليل كفاءة الدورة البيعية\n👥 **إدارة العملاء** — صحة العلاقات وفرص الارتقاء بالبيع\n📅 **اجتماعات وأنشطة البيع** — متابعة العملاء والفريق\n\nاسألني أي شيء يخص إدارة فريقك وصفقاتك!`;

  private welcomeEn = `Welcome to your Sales Management AI Assistant! 🎯\n\nI am your specialized assistant for all **Sales Management** aspects:\n\n📊 **Pipeline Analysis** — Deal stages and closing probability\n🏆 **Sales Team Management** — Performance, coaching, schedules, and leave\n💰 **Revenue Forecasting** — Monthly and quarterly sales predictions\n🔄 **Conversion Rates** — Sales cycle efficiency analysis\n👥 **Customer Management** — Relationship health and upsell opportunities\n📅 **Sales Meetings & Activities** — Client and team follow-ups\n\nAsk me anything about managing your team and deals!`;

  private salesContext = `You are a Sales Manager AI Assistant. You help with all aspects of SALES MANAGEMENT, including:
- Sales pipeline and deal management (stages, win probability, deal velocity)
- Sales team management (quota attainment, rep performance, coaching, team scheduling, attendance, leave requests for YOUR sales team)
- Revenue forecasting and sales targets (monthly/quarterly predictions)
- Conversion rates and sales cycle optimization
- Client and customer management (account health, churn risk, upsell/cross-sell)
- Sales strategy, deal prioritization, and competitive analysis
- Client meetings, follow-ups, and sales activity tracking
- Sales team HR aspects (managing your reps' schedules, leave, attendance — from a team management perspective)

Always frame answers from a Sales Manager's perspective. If a question is about employees or meetings, answer it in the context of MANAGING THE SALES TEAM and SALES ACTIVITIES, not general company administration.`;

  defaultAssistantMessage = computed(() =>
    this.i18n.currentLang() === 'ar' ? this.welcomeAr : this.welcomeEn
  );

  suggestions = computed(() =>
    this.i18n.currentLang() === 'ar'
      ? [
          'ما هي الصفقات الأقرب للإغلاق هذا الشهر؟',
          'أداء الفريق مقابل الحصص البيعية',
          'ما معدل التحويل من عميل محتمل إلى صفقة؟',
          'توقعات إيرادات الشهر القادم',
          'ما الصفقات المتوقفة منذ 30 يوماً أو أكثر؟',
          'من هو أفضل مندوب مبيعات في الفريق؟',
        ]
      : [
          'Which deals are closest to closing this month?',
          'Team performance vs sales quotas',
          'What is our lead-to-deal conversion rate?',
          'Forecast revenue for next month',
          'Which deals have been stalled 30+ days?',
          'Who is the top-performing sales rep?',
        ]
  );

  messages = signal<ChatMessage[]>([]);
  inputText = '';
  isTyping = signal(false);
  showHistoryModal = signal(false);
  showLimitModal = signal(false);
  limitModalMessage = signal('');
  private shouldScroll = false;

  chatHistory = signal<any[]>([]);
  activeConversationId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const welcomeText = this.defaultAssistantMessage();
      untracked(() => {
        const current = this.messages();
        if (current.length === 0) {
          this.messages.set([{ role: 'assistant', text: welcomeText, safeText: this.sanitizeMarkdown(welcomeText), time: this.getFormattedTime() }]);
          this.shouldScroll = true;
        } else if (current.length === 1 && (current[0].text === this.welcomeAr || current[0].text === this.welcomeEn)) {
          this.messages.set([{ role: 'assistant', text: welcomeText, safeText: this.sanitizeMarkdown(welcomeText), time: current[0].time }]);
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
        if (res.success && res.data) this.chatHistory.set(res.data);
      }
    });
  }

  loadConversation(id: number) {
    this.aiService.getChatHistoryDetails(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.activeConversationId.set(id.toString());
          this.messages.set((res.data.messages || []).map((m: any) => ({
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
    const conf = this.i18n.currentLang() === 'ar' ? 'هل أنت متأكد من حذف هذه المحادثة؟' : 'Delete this conversation?';
    if (confirm(conf)) {
      this.aiService.deleteChatHistory(id).subscribe({
        next: () => {
          this.loadChatHistory();
          if (this.activeConversationId() === id.toString()) this.clearChat();
        }
      });
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  private scrollToBottom() {
    try { this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight; } catch {}
  }

  private getFormattedTime() {
    return new Date().toLocaleTimeString(this.i18n.currentLang() === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private sanitizeMarkdown(text: string): SafeHtml {
    try {
      return this.sanitizer.bypassSecurityTrustHtml(marked.parse(text) as string);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(
        text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
      );
    }
  }

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    const timeStr = this.getFormattedTime();
    this.messages.update(prev => [...prev, { role: 'user', text: messageText, safeText: this.sanitizeMarkdown(messageText), time: timeStr }]);
    if (!text) this.inputText = '';
    this.isTyping.set(true);
    this.shouldScroll = true;

    const contextualMessage = `[SALES MANAGER ASSISTANT — CONTEXT: ${this.salesContext}]\n\nUSER QUERY: ${messageText}`;

    this.aiService.chat(contextualMessage, this.activeConversationId() || undefined).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const errorMsg = this.i18n.currentLang() === 'ar' ? 'عذراً، لم أستطع معالجة طلبك حالياً.' : 'Sorry, could not process your request.';
        const reply = res.data?.response || res.response || errorMsg;
        if (res.data?.conversationId) { this.activeConversationId.set(res.data.conversationId); this.loadChatHistory(); }
        this.messages.update(prev => [...prev, { role: 'assistant', text: reply, safeText: this.sanitizeMarkdown(reply), time: timeStr }]);
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
    this.messages.set([{ role: 'assistant', text: this.defaultAssistantMessage(), safeText: this.sanitizeMarkdown(this.defaultAssistantMessage()), time: this.getFormattedTime() }]);
    this.shouldScroll = true;
  }

}
