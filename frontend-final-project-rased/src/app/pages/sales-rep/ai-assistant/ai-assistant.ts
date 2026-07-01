import { Component, signal, inject, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../services/ai.service';
import { I18nService } from '../../../services/i18n.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  safeText?: SafeHtml;
  time?: string;
}

@Component({
  selector: 'app-sales-rep-ai-assistant',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class SalesRepAiAssistant implements OnInit, AfterViewChecked {
  private aiService = inject(AiService);
  public i18n = inject(I18nService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  private welcomeMsg = 'مرحباً! أنا مساعدك الذكي RASD AI. يمكنني مساعدتك في صياغة رسائل المتابعة، تحليل العقود، وإعداد عروض الأسعار. كيف يمكنني مساعدتك؟';

  messages = signal<ChatMessage[]>([
    { role: 'assistant', text: this.welcomeMsg, safeText: undefined, time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) }
  ]);

  suggestions = signal([
    'اكتب رسالة بريد إلكتروني لمتابعة عرض سعر مع العميل',
    'كيف أقنع عميل متردد في مرحلة التفاوض؟',
    'لخص حالة صفقاتي الحالية المفتوحة',
    'اكتب عرض ترحيبي لعميل محتمل جديد'
  ]);

  inputText = '';
  isTyping = signal(false);
  showLimitModal = signal(false);
  limitModalMessage = signal('');
  activeConversationId = signal<string | null>(null);
  private shouldScroll = false;

  ngOnInit() {
    const msgs = this.messages();
    if (msgs.length === 1 && !msgs[0].safeText) {
      this.messages.update(prev => prev.map(m => ({ ...m, safeText: this.sanitizeMarkdown(m.text) })));
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  private scrollToBottom() {
    try { this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight; } catch {}
  }

  private getTime() {
    return new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  }

  private sanitizeMarkdown(text: string): SafeHtml {
    try {
      return this.sanitizer.bypassSecurityTrustHtml(marked.parse(text) as string);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(
        text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      );
    }
  }

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    const timeStr = this.getTime();
    this.messages.update(prev => [...prev, { role: 'user', text: messageText, safeText: this.sanitizeMarkdown(messageText), time: timeStr }]);
    if (!text) this.inputText = '';
    this.isTyping.set(true);
    this.shouldScroll = true;

    this.aiService.chat(messageText, this.activeConversationId() || undefined).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const reply = res.data?.response || res.response || 'عذراً، لم أستطع معالجة طلبك.';
        if (res.data?.conversationId) this.activeConversationId.set(res.data.conversationId);
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
          const reply = 'تعذّر الاتصال بالخادم. تأكد من أن الخادم يعمل وأعد المحاولة.';
          this.messages.update(prev => [...prev, { role: 'assistant', text: reply, safeText: this.sanitizeMarkdown(reply), time: timeStr }]);
        }
        this.shouldScroll = true;
      }
    });
  }

  selectSuggestion(suggestion: string) { this.sendMessage(suggestion); }

  closeLimitModal() { this.showLimitModal.set(false); }
}
