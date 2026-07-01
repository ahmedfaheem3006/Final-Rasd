import { Component, signal, inject, ViewChild, ElementRef, AfterViewChecked, computed, effect, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../services/ai.service';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../../../services/toast.service';
import { marked } from 'marked';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  safeText?: SafeHtml;
  time?: string;
  isSummary?: boolean;
  isClauses?: boolean;
}

interface ContractData {
  summary: string;
  parties: string[];
  expiryDate: string;
  value: string;
  risks: { severity: string; description: string }[];
}

@Component({
  selector: 'app-sm-analyze-contract',
  imports: [CommonModule, FormsModule],
  templateUrl: './analyze-contract.html',
  styleUrl: './analyze-contract.css'
})
export class SmAnalyzeContract implements OnInit, AfterViewChecked {
  private aiService = inject(AiService);
  public i18n = inject(I18nService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  private toastService = inject(ToastService);

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  currentUser = this.authService.currentUser;
  uploadedFileName = signal<string | null>(null);
  uploadedFile = signal<File | null>(null);

  contractData = signal<ContractData | null>(null);
  messages = signal<ChatMessage[]>([]);

  contractHistory = signal<any[]>([]);
  activeContractId = signal<number | null>(null);

  private welcomeAr = 'مرحباً! قم بتحميل أي عقد (PDF) وسأحلله من منظور **مدير المبيعات** — الالتزامات المالية، شروط التسليم، العقوبات التجارية، تأثيره على فريقك وعملائك، وأي بنود تخص إدارة المبيعات.';
  private welcomeEn = 'Hello! Upload any contract (PDF) and I will analyze it from a **Sales Manager perspective** — financial commitments, delivery terms, commercial penalties, impact on your team and clients, and any clause relevant to sales management.';

  private salesContractContext = `You are a Sales Contract Analyzer for a Sales Manager. Analyze contracts from a sales management perspective, covering:
- Revenue impact: contract value, payment schedules, commission structures
- Deal risk: penalty clauses, termination conditions, exclusivity restrictions
- Sales obligations: delivery timelines, SLAs that affect deal closure and team responsibilities
- Competitive constraints: non-compete, exclusivity, or territory clauses
- Renewal and upsell opportunities: auto-renewal terms, expansion clauses
- Customer relationship terms: dispute resolution, liability caps, and client trust factors
- Team implications: any obligations or rights that affect how the sales team manages this client

Frame findings in terms of how they affect sales performance, revenue, deal execution, and sales team management. You may also answer general managerial questions about the contract — just always tie the answer back to the sales management context.`;

  defaultAssistantMessage = computed(() => {
    return this.i18n.currentLang() === 'ar' ? this.welcomeAr : this.welcomeEn;
  });

  suggestions = computed(() => {
    return this.i18n.currentLang() === 'ar'
      ? [
          'ما هي قيمة العقد وجدول المدفوعات؟',
          'هل توجد غرامات تؤثر على إغلاق الصفقة؟',
          'ما هي شروط التجديد وفرص الارتقاء بالبيع؟',
          'هل هناك بنود حصرية أو قيود على المنافسة؟'
        ]
      : [
          'What is the contract value and payment schedule?',
          'Are there penalties that affect deal closure?',
          'What are the renewal terms and upsell opportunities?',
          'Are there exclusivity or non-compete clauses?'
        ];
  });

  inputText = '';
  isTyping = signal(false);
  isUploading = signal(false);
  showHistoryModal = signal(false);
  showLimitModal = signal(false);
  limitModalMessage = signal('');
  private shouldScroll = false;

  constructor() {
    effect(() => {
      const welcomeText = this.defaultAssistantMessage();

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
    this.loadContractHistory();
  }

  loadContractHistory() {
    this.aiService.getContractHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.contractHistory.set(res.data);
        }
      }
    });
  }

  loadContractDetails(id: number) {
    this.aiService.getContractHistoryDetails(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.activeContractId.set(id);
          this.uploadedFileName.set(res.data.fileName || 'Contract');
          const parsedData = {
            summary: res.data.summary || '',
            parties: res.data.parties || [],
            expiryDate: res.data.expiryDate || '',
            value: res.data.value || '',
            risks: res.data.risks || []
          };
          this.contractData.set(parsedData);

          const reports = this.generateSummaryAndClausesMessages(parsedData, res.data.fileName || 'Contract');
          let introReply = this.i18n.currentLang() === 'ar'
            ? `📑 **تم استدعاء تحليل العقد المخزن: ${res.data.fileName || 'العقد'}**`
            : `📑 **Loaded stored contract analysis: ${res.data.fileName || 'Contract'}**`;

          this.messages.set([
            {
              role: 'assistant',
              text: this.defaultAssistantMessage(),
              safeText: this.sanitizeMarkdown(this.defaultAssistantMessage()),
              time: this.getFormattedTime()
            },
            {
              role: 'assistant',
              text: introReply,
              safeText: this.sanitizeMarkdown(introReply),
              time: this.getFormattedTime()
            },
            reports[0],
            reports[1]
          ]);
          this.shouldScroll = true;
        }
      }
    });
  }

  deleteContractFromHistory(id: number, event: MouseEvent) {
    event.stopPropagation();
    const conf = this.i18n.currentLang() === 'ar'
      ? 'هل أنت متأكد من حذف تحليل هذا العقد؟'
      : 'Are you sure you want to delete this contract analysis?';
    if (confirm(conf)) {
      this.aiService.deleteContractHistory(id).subscribe({
        next: (res) => {
          this.loadContractHistory();
          if (this.activeContractId() === id) {
            this.resetAnalysis();
          }
        }
      });
    }
  }

  resetAnalysis() {
    this.activeContractId.set(null);
    this.uploadedFileName.set(null);
    this.uploadedFile.set(null);
    this.contractData.set(null);
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
    } catch (err) {}
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

  triggerFileInput() {
    document.getElementById('contractFileInput')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploadedFileName.set(file.name);
    this.uploadedFile.set(file);
    this.analyzeContractFile(file);
  }

  generateSummaryAndClausesMessages(data: ContractData, fileName: string): ChatMessage[] {
    const isAr = this.i18n.currentLang() === 'ar';
    const timeStr = this.getFormattedTime();

    let summaryText = isAr
      ? `### 📋 الملخص التنفيذي للعقد: **${fileName}**\n\n` +
        `**📝 الوصف العام:**\n${data.summary}\n\n` +
        `**👥 الأطراف المتعاقدة:**\n` +
        data.parties.map(p => `* ${p}`).join('\n') + `\n\n` +
        `**💰 قيمة العقد:** \`${data.value}\` \n\n` +
        `**📅 تاريخ الانتهاء:** \`${data.expiryDate}\``
      : `### 📋 Executive Summary: **${fileName}**\n\n` +
        `**📝 General Description:**\n${data.summary}\n\n` +
        `**👥 Contracting Parties:**\n` +
        data.parties.map(p => `* ${p}`).join('\n') + `\n\n` +
        `**💰 Contract Value:** \`${data.value}\` \n\n` +
        `**📅 Expiry Date:** \`${data.expiryDate}\``;

    let clausesText = isAr
      ? `### 🔍 البنود المكتشفة وتصنيف المخاطر\n\n` +
        `تم فحص بنود العقد وتصنيفها بناءً على مستوى الخطورة والأمان:\n\n`
      : `### 🔍 Discovered Clauses & Risk Analysis\n\n` +
        `Contract clauses scanned and classified by safety and legal risk level:\n\n`;

    if (data.risks && data.risks.length > 0) {
      data.risks.forEach(risk => {
        const severity = risk.severity.toLowerCase();
        const circle = severity === 'red' ? '🔴' : severity === 'orange' ? '🟠' : severity === 'blue' ? '🔵' : '🟢';
        clausesText += `* ${circle} ${risk.description}\n`;
      });
    } else {
      clausesText += isAr
        ? `🟢 لم يتم العثور على أي بنود خطيرة أو غرامات مالية غير اعتيادية.`
        : `🟢 No high-risk clauses or unusual financial penalties were detected.`;
    }

    return [
      { role: 'assistant', text: summaryText, safeText: this.sanitizeMarkdown(summaryText), time: timeStr, isSummary: true },
      { role: 'assistant', text: clausesText, safeText: this.sanitizeMarkdown(clausesText), time: timeStr, isClauses: true }
    ];
  }

  analyzeContractFile(file: File) {
    this.isUploading.set(true);
    this.isTyping.set(true);

    const timeStr = this.getFormattedTime();
    const isAr = this.i18n.currentLang() === 'ar';

    this.messages.update(prev => [
      ...prev,
      {
        role: 'user',
        text: isAr ? `[تحميل ملف العقد: ${file.name}]` : `[Uploaded contract file: ${file.name}]`,
        safeText: this.sanitizeMarkdown(isAr ? `[تحميل ملف العقد: ${file.name}]` : `[Uploaded contract file: ${file.name}]`),
        time: timeStr
      }
    ]);
    this.shouldScroll = true;

    this.aiService.analyzeContract(file).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.isTyping.set(false);

        const data = res.data;
        const parsedData = {
          summary: data.summary || '',
          parties: data.parties || [],
          expiryDate: data.expiryDate || '',
          value: data.value || '',
          risks: data.risks || []
        };
        this.contractData.set(parsedData);
        if (data.id) {
          this.activeContractId.set(data.id);
          this.loadContractHistory();
        }

        this.checkAndTriggerNotifications(parsedData.risks, file.name);

        let introReply = isAr
          ? `📑 **تم تحليل العقد بنجاح: ${file.name}**`
          : `📑 **Contract analyzed successfully: ${file.name}**`;

        const reports = this.generateSummaryAndClausesMessages(parsedData, file.name);

        this.messages.update(prev => [
          ...prev,
          { role: 'assistant', text: introReply, safeText: this.sanitizeMarkdown(introReply), time: timeStr },
          reports[0],
          reports[1]
        ]);
        this.shouldScroll = true;
      },
      error: (err) => {
        this.isUploading.set(false);
        this.isTyping.set(false);
        const serverMsg = err?.error?.message;
        if (serverMsg) {
          this.limitModalMessage.set(serverMsg);
          this.showLimitModal.set(true);
        } else {
          const errorReply = isAr
            ? `❌ **فشل الاتصال بالخادم لتحليل العقد.**\n\nيرجى التأكد من أن الخادم يعمل وأعد المحاولة.`
            : `❌ **Failed to connect to the server for contract analysis.**\n\nPlease make sure the API is running and try again.`;
          this.toastService.error(isAr ? 'فشل الاتصال بالخادم' : 'Server Connection Failed', isAr ? 'خطأ' : 'Error');
          this.messages.update(prev => [...prev, { role: 'assistant', text: errorReply, safeText: this.sanitizeMarkdown(errorReply), time: timeStr }]);
        }
        this.shouldScroll = true;
      }
    });
  }

  private checkAndTriggerNotifications(risks: { severity: string; description: string }[], fileName: string) {
    const criticalCount = risks.filter(r => r.severity === 'Red').length;
    if (criticalCount > 0) {
      this.notificationService.notifications.update(prev => [
        {
          id: 'contract-risk-' + Date.now(),
          titleAr: '⚠️ ثغرات خطيرة في العقد المرفوع',
          titleEn: '⚠️ Critical clauses in uploaded contract',
          descriptionAr: `تم اكتشاف عدد ${criticalCount} نقاط خطيرة جداً في عقد "${fileName}" تتطلب مراجعتك الفورية.`,
          descriptionEn: `Detected ${criticalCount} highly critical issues in contract "${fileName}" requiring immediate review.`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          isRead: false,
          type: 'danger'
        },
        ...prev
      ]);
    }
  }

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    const timeStr = this.getFormattedTime();

    this.messages.update(prev => [
      ...prev,
      { role: 'user', text: messageText, safeText: this.sanitizeMarkdown(messageText), time: timeStr }
    ]);
    if (!text) this.inputText = '';

    this.isTyping.set(true);
    this.shouldScroll = true;

    const contractData = this.contractData();
    const contractContext = [
      `[SALES CONTRACT ANALYZER — CONTEXT: ${this.salesContractContext}]`,
      contractData ? `CONTRACT DATA: ${JSON.stringify(contractData)}` : ''
    ].filter(Boolean).join('\n\n');

    const contextualMessage = `[SALES MANAGER CONTRACT QUERY]: ${messageText}`;

    this.aiService.chat(contextualMessage, undefined, contractContext).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const errorMsg = this.i18n.currentLang() === 'ar'
          ? 'عذراً، لم أستطع معالجة طلبك حالياً.'
          : 'Sorry, I could not process your request at the moment.';
        const reply = res.data?.response || res.response || errorMsg;
        this.messages.update(prev => [
          ...prev,
          { role: 'assistant', text: reply, safeText: this.sanitizeMarkdown(reply), time: timeStr }
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
          const reply = contractData
            ? this.getSpecializedContractChatResponse(messageText)
            : this.getSimulatedChatResponse(messageText);
          this.messages.update(prev => [...prev, { role: 'assistant', text: reply, safeText: this.sanitizeMarkdown(reply), time: timeStr }]);
        }
        this.shouldScroll = true;
      }
    });
  }

  closeLimitModal() { this.showLimitModal.set(false); }

  selectSuggestion(suggestion: string) {
    if (this.contractData()) {
      this.sendMessage(suggestion);
    }
  }

  clearChat() {
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

  private getSpecializedContractChatResponse(userText: string): string {
    const isAr = this.i18n.currentLang() === 'ar';
    const data = this.contractData();
    if (!data) return isAr ? 'يرجى تحميل عقد المبيعات أولاً.' : 'Please upload a sales contract first.';
    const t = userText.toLowerCase();
    if (isAr) {
      if (t.includes('قيمة') || t.includes('مدفوع') || t.includes('مالي')) {
        return `💰 **التحليل المالي للعقد (منظور المبيعات):**\n\n* **قيمة العقد:** ${data.value}\n* **تاريخ الانتهاء:** ${data.expiryDate}\n\n📈 **تأثير على المبيعات:** تأكد من توافق جدول الدفع مع دورة المبيعات لديك لضمان التدفق النقدي.`;
      } else if (t.includes('غرامة') || t.includes('عقوبة') || t.includes('خطر')) {
        const redRisks = data.risks.filter(r => r.severity === 'Red');
        return redRisks.length > 0
          ? `⚠️ **بنود تؤثر على إغلاق الصفقة:**\n\n${redRisks.map(r => `* 🔴 ${r.description}`).join('\n')}\n\n🎯 **توصية:** راجع هذه البنود مع فريقك القانوني قبل توقيع العقد.`
          : `✅ لم يتم اكتشاف غرامات تؤثر سلباً على صفقاتك في هذا العقد.`;
      } else if (t.includes('تجديد') || t.includes('ارتقاء') || t.includes('upsell')) {
        return `🔄 **فرص التجديد والارتقاء بالبيع:**\n\n* **تاريخ انتهاء العقد:** ${data.expiryDate}\n* **الأطراف:** ${data.parties.join('، ')}\n\n💡 ابدأ محادثة التجديد قبل 60 يوماً من الانتهاء لضمان الاحتفاظ بالعميل.`;
      } else {
        return `بناءً على تحليل العقد من منظور المبيعات:\n\n* **القيمة:** ${data.value}\n* **الانتهاء:** ${data.expiryDate}\n* **الأطراف:** ${data.parties.join('، ')}\n\nاسألني عن: الالتزامات المالية، الغرامات، فرص التجديد، أو البنود التنافسية.`;
      }
    } else {
      if (t.includes('value') || t.includes('payment') || t.includes('financial')) {
        return `💰 **Financial Analysis (Sales Perspective):**\n\n* **Contract Value:** ${data.value}\n* **Expiry Date:** ${data.expiryDate}\n\n📈 **Sales Impact:** Ensure payment schedule aligns with your sales cycle for healthy cash flow.`;
      } else if (t.includes('penalty') || t.includes('risk') || t.includes('clause')) {
        const redRisks = data.risks.filter(r => r.severity === 'Red');
        return redRisks.length > 0
          ? `⚠️ **Clauses Affecting Deal Closure:**\n\n${redRisks.map(r => `* 🔴 ${r.description}`).join('\n')}\n\n🎯 **Recommendation:** Review these with your legal team before signing.`
          : `✅ No penalty clauses found that would negatively impact your deals.`;
      } else if (t.includes('renewal') || t.includes('upsell') || t.includes('expand')) {
        return `🔄 **Renewal & Upsell Opportunities:**\n\n* **Contract Expiry:** ${data.expiryDate}\n* **Parties:** ${data.parties.join(', ')}\n\n💡 Start the renewal conversation 60 days before expiry to secure client retention.`;
      } else {
        return `Based on the contract analysis (sales perspective):\n\n* **Value:** ${data.value}\n* **Expiry:** ${data.expiryDate}\n* **Parties:** ${data.parties.join(', ')}\n\nAsk me about: financial obligations, penalties, renewal opportunities, or competitive clauses.`;
      }
    }
  }

  private getSimulatedChatResponse(userText: string): string {
    const isAr = this.i18n.currentLang() === 'ar';
    return isAr
      ? `يرجى تحميل عقد المبيعات أولاً لأتمكن من تحليله من منظور مدير المبيعات — الالتزامات المالية، الغرامات، وفرص الارتقاء بالبيع.`
      : `Please upload a sales contract first so I can analyze it from a Sales Manager perspective — financial obligations, penalties, and upsell opportunities.`;
  }
}
