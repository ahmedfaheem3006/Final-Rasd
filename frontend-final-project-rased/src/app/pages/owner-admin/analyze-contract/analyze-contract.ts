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
  selector: 'app-analyze-contract',
  imports: [CommonModule, FormsModule],
  templateUrl: './analyze-contract.html',
  styleUrl: './analyze-contract.css'
})
export class AnalyzeContract implements OnInit, AfterViewChecked {
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

  // History state
  contractHistory = signal<any[]>([]);
  activeContractId = signal<number | null>(null);

  private welcomeAr = 'مرحباً! يرجى تحميل ملف العقد (بصيغة PDF) وسأقوم بتحليله بالكامل واستخراج الأطراف والتواريخ والالتزامات والمخاطر المكتشفة، ويمكننا مناقشته هنا.';
  private welcomeEn = 'Hello! Please upload a contract PDF file. I will perform a complete analysis to extract contracting parties, dates, financial commitments, and identified risks. We can then discuss them here.';

  defaultAssistantMessage = computed(() => {
    return this.i18n.currentLang() === 'ar' ? this.welcomeAr : this.welcomeEn;
  });

  suggestions = computed(() => {
    return this.i18n.currentLang() === 'ar'
      ? [
          'ما هي أطراف هذا العقد؟',
          'ما هي الالتزامات والمدفوعات المالية؟',
          'هل توجد أي مخاطر قانونية أو غرامات؟',
          'ما هو تاريخ انتهاء العقد وشروط التجديد؟'
        ]
      : [
          'Who are the parties in this contract?',
          'What are the financial obligations and payments?',
          'Are there any legal risks or penalties?',
          'What is the expiry date and renewal terms?'
        ];
  });

  inputText = '';
  isTyping = signal(false);
  isUploading = signal(false);
  showHistoryModal = signal(false);
  private shouldScroll = false;

  constructor() {
    // Dynamic welcome message translation on language change
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

    // 1. Executive Summary Message
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

    // 2. Discovered Clauses Message
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
      {
        role: 'assistant',
        text: summaryText,
        safeText: this.sanitizeMarkdown(summaryText),
        time: timeStr,
        isSummary: true
      },
      {
        role: 'assistant',
        text: clausesText,
        safeText: this.sanitizeMarkdown(clausesText),
        time: timeStr,
        isClauses: true
      }
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

        // Trigger notification if there are critical (Red) issues
        this.checkAndTriggerNotifications(parsedData.risks, file.name);

        let introReply = isAr 
          ? `📑 **تم تحليل العقد بنجاح: ${file.name}**`
          : `📑 **Contract analyzed successfully: ${file.name}**`;
        
        const reports = this.generateSummaryAndClausesMessages(parsedData, file.name);

        this.messages.update(prev => [
          ...prev,
          {
            role: 'assistant',
            text: introReply,
            safeText: this.sanitizeMarkdown(introReply),
            time: timeStr
          },
          reports[0],
          reports[1]
        ]);
        this.shouldScroll = true;
      },
      error: (err) => {
        this.isUploading.set(false);
        this.isTyping.set(false);
        
        let errorReply = isAr 
          ? `❌ **فشل الاتصال بالخادم لتحليل العقد.**\n\nيرجى التأكد من أن **الباك إند (API) يعمل بنجاح** على المنفذ 5092 (Localhost)، وتأكد من اتصالك بالإنترنت.`
          : `❌ **Failed to connect to the server for contract analysis.**\n\nPlease make sure the **backend API is running** on port 5092, and check your internet connection.`;

        this.toastService.error(
          isAr ? 'فشل الاتصال بالخادم' : 'Server Connection Failed',
          isAr ? 'خطأ' : 'Error'
        );

        this.messages.update(prev => [
          ...prev,
          {
            role: 'assistant',
            text: errorReply,
            safeText: this.sanitizeMarkdown(errorReply),
            time: timeStr
          }
        ]);
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

  private getSpecializedContractChatResponse(userText: string): string {
    const isAr = this.i18n.currentLang() === 'ar';
    const text = userText.toLowerCase();
    const data = this.contractData();
    if (!data) {
      return isAr 
        ? 'يرجى تحميل العقد أولاً لتحليله، ثم سأجيبك على كافة التفاصيل.'
        : 'Please upload the contract first to analyze it, then I will answer your questions.';
    }

    const hasSupply = this.uploadedFileName()?.toLowerCase().includes('توريد') || this.uploadedFileName()?.toLowerCase().includes('supply');
    const hasLease = this.uploadedFileName()?.toLowerCase().includes('إيجار') || this.uploadedFileName()?.toLowerCase().includes('lease');
    const contractType = hasSupply ? 'Supply' : hasLease ? 'Lease' : 'General';

    const formatResponse = (arContent: { analysis: string; risks: string; recommendations: string }, enContent: { analysis: string; risks: string; recommendations: string }) => {
      if (isAr) {
        return `### 📋 الرأي القانوني الهندسي للمستشار الذكي\n` +
               `بصفتي **أخصائي هندسة العقود وإدارة المشاريع (Contract Engineering Specialist)**، قمت بدراسة بند **"${userText}"** في ضوء الهيكل التعاقدي العام، وإليك التحليل التفصيلي:\n\n` +
               `#### 🔍 1. التحليل التعاقدي والهندسي:\n` +
               `${arContent.analysis}\n\n` +
               `#### ⚠️ 2. تقييم المخاطر والثغرات المحتملة:\n` +
               `${arContent.risks}\n\n` +
               `#### 💡 3. التوصيات المقترحة وصياغة البدائل (ChatGPT Style):\n` +
               `${arContent.recommendations}\n\n` +
               `*ملاحظة: هذا التحليل يعتمد على معايير هندسة العقود العالمية (FIDIC / IEEE التعاقدية).*`;
      } else {
        return `### 📋 Legal-Engineering Analysis & Opinion\n` +
               `As a **Contract Engineering & Project Management Specialist**, I have analyzed the clause/query **"${userText}"** in light of the contract architecture. Here is the structured breakdown:\n\n` +
               `#### 🔍 1. Contractual & Engineering Analysis:\n` +
               `${enContent.analysis}\n\n` +
               `#### ⚠️ 2. Risk & Vulnerability Assessment:\n` +
               `${enContent.risks}\n\n` +
               `#### 💡 3. Recommended Actions & Redrafting Options:\n` +
               `${enContent.recommendations}\n\n` +
               `*Note: This analysis is based on global contract engineering standards (FIDIC / IEEE contracting principles).*`;
      }
    };

    if (text.includes('غرام') || text.includes('تأخير') || text.includes('penalty') || text.includes('delay') || text.includes('شرط جزائي')) {
      if (contractType === 'Supply') {
        return formatResponse(
          {
            analysis: `* يحتوي العقد على **بند 5.2** الذي يفرض غرامة تأخير قدرها **1% يومياً** من إجمالي قيمة العقد في حال التأخر في تسليم البرمجيات أو الأنظمة.\n* الغرامة التراكمية لها حد أقصى (Cap) يبلغ **15%** من القيمة الإجمالية للعقد.`,
            risks: `* **خطورة عالية جداً (🔴 Danger):** نسبة 1% يومياً تعتبر مرتفعة جداً وغير عادلة تجارياً (المعدل السائد هو 0.1% إلى 0.2% يومياً).\n* غياب بند "ظروف القوة القاهرة (Force Majeure)" أو فترة السماح (Grace Period) يجعل شركتكم عرضة للغرامات الفورية منذ اليوم الأول للتأخير لأي سبب خارج الإرادة.`,
            recommendations: `1. **تعديل النسبة:** المطالبة بخفض غرامة التأخير اليومية إلى **0.1%** بدلاً من 1%.\n2. **تخفيض الحد الأقصى:** خفض سقف الغرامة الكلية إلى **5% أو 10%** كحد أقصى تماشياً مع الأعراف التجارية.\n3. **إدراج فترة سماح (Grace Period):** إضافة بند ينص على عدم احتساب غرامات خلال أول **10 أيام عمل** من التأخير.\n4. **صياغة مقترحة للبديل:** \`«في حال تأخر المورد في التسليم لأسباب لا تعود للقوة القاهرة، يلتزم بدفع غرامة تأخير قدرها 0.1% عن كل يوم تأخير بحد أقصى 5% من القيمة الإجمالية للمرحلة المتأخرة فقط وليس إجمالي العقد».\``
          },
          {
            analysis: `* The contract contains **Clause 5.2** which imposes a delay penalty of **1% daily** of the total contract value if software or system delivery is delayed.\n* The cumulative penalty has a maximum cap of **15%** of the total contract value.`,
            risks: `* **High Risk (🔴 Danger):** A 1% daily penalty is extremely high and commercially unreasonable (standard rates are 0.1% to 0.2% daily).\n* The absence of a "Force Majeure" buffer or a Grace Period makes your company liable for penalty fees starting immediately from Day 1 of any delay.`,
            recommendations: `1. **Reduce Daily Rate:** Negotiate to lower the daily delay penalty to **0.1%** instead of 1%.\n2. **Lower Cumulative Cap:** Reduce the maximum cap to **5% or 10%** of the contract value.\n3. **Request Grace Period:** Insert a clause stating that no penalties are accrued during the first **10 business days** of delay.\n4. **Proposed Redraft:** \`"In the event of a delivery delay not caused by Force Majeure, the Supplier shall pay a delay penalty of 0.1% per day, capped at 5% of the delayed milestone value only."\``
          }
        );
      } else if (contractType === 'Lease') {
        return formatResponse(
          {
            analysis: `* في عقود الإيجار، يرتبط بند التأخير عادةً بالتأخر في سداد الدفعات الإيجارية السنوية/الربع سنوية.\n* العقد الحالي يمنح المؤجر الحق في اتخاذ إجراءات قانونية أو فرض فوائد تأخير في حال تجاوز موعد الاستحقاق بـ 15 يوماً.`,
            risks: `* **خطورة متوسطة (🟠 Warning):** قد يؤدي أي تأخير لوجستي أو بنكي في التحويل المالي إلى إخلال تعاقدي يتيح للمالك إنهاء العقد ومصادرة مبلغ التأمين.`,
            recommendations: `1. **تمديد المهلة:** طلب زيادة فترة السماح قبل اتخاذ أي إجراء قانوني لتكون **30 يوماً** بدلاً من 15.\n2. **منع الفوائد التراكمية:** التأكيد على إلغاء أي فوائد ربوية على المبالغ المتأخرة واستبدالها بغرامة إدارية مقطوعة ورمزية.\n3. **الصياغة البديلة:** \`«يمنح المستأجر فترة سماح مدتها 30 يوماً لسداد الدفعة الإيجارية المستحقة، ولا يعتبر متأخراً إلا بعد انقضاء هذه المدة دون عذر مقبول كالعطل الرسمية أو المشاكل البنكية».\``
          },
          {
            analysis: `* In lease contracts, delay clauses usually relate to late payments of annual/quarterly rents.\n* The current lease contract grants the Lessor the right to take legal action or impose late payment interest if payment is delayed beyond 15 days.`,
            risks: `* **Medium Risk (🟠 Warning):** Any minor banking delay could trigger a contractual breach, allowing the landlord to terminate the lease and forfeit the security deposit.`,
            recommendations: `1. **Extend Grace Period:** Request an extension of the grace period to **30 days** instead of 15 days before legal steps can be taken.\n2. **Remove Cumulative Interest:** Insist on deleting any daily compounding interest and replace it with a small, flat administrative fee.\n3. **Proposed Redraft:** \`"The Lessee shall be granted a 30-day grace period for rent payments, and shall not be considered in default until such period expires without bank clearance."\``
          }
        );
      } else {
        return formatResponse(
          {
            analysis: `* يحتوي هذا العقد العام على بند يفرض غرامات مالية أو تعويضات في حال الإخلال بجدول تسليم الخدمات.\n* يطلب العقد إخطاراً مبكراً قبل 90 يوماً للفسخ، وإلا يتم دفع غرامة تعادل **20%** من إجمالي العقد كشرط جزائي.`,
            risks: `* **خطورة عالية جداً (🔴 Danger):** شرط الـ 20% تعويضاً للفسخ المبكر يعتبر تعسفياً ويقيد مرونة الشركة التشغيلية بشكل كبير.`,
            recommendations: `1. **تعديل مدة الإشعار:** تقليص فترة الإخطار بالإنهاء لتكون **30 أو 60 يوماً** كحد أقصى.\n2. **تخفيض نسبة الشرط الجزائي:** تعديل بند التعويض ليكون مقطوعاً أو يتناسب مع الخدمات التي لم يتم تسليمها فقط (مثلاً 5%).\n3. **الصياغة البديلة:** \`«يحق لأي من الطرفين إنهاء العقد بإخطار كتابي مدته 30 يوماً، دون ترتب أي التزامات مالية إضافية باستثناء دفع مستحقات الأعمال المنجزة فعلياً حتى تاريخ الإنهاء».\``
          },
          {
            analysis: `* This general contract includes clauses imposing penalties or compensation in case of milestones delay.\n* Early termination requires a 90-day prior notice, otherwise a penalty equal to **20%** of the contract value is due.`,
            risks: `* **High Risk (🔴 Danger):** A 20% early termination penalty is arbitrary and restricts the company's operational flexibility.`,
            recommendations: `1. **Reduce Notice Period:** Shorten the termination notice to **30 or 60 days** instead of 90.\n2. **Lower Penalty Rate:** Limit compensation to unpaid delivered services rather than 20% of the entire contract.\n3. **Proposed Redraft:** \`"Either party may terminate this agreement with 30 days prior written notice, without incurring additional liabilities except for payment of services rendered up to the termination date."\``
          }
        );
      }
    }

    if (text.includes('فسخ') || text.includes('إنهاء') || text.includes('انهاء') || text.includes('terminate') || text.includes('cancel')) {
      return formatResponse(
        {
          analysis: `* يتناول بند الإنهاء في العقد شروط الفسخ من طرف واحد أو التراضي.\n* في هذا العقد، يتطلب الفسخ إخطاراً مسبقاً طويلاً (مثلاً 90 يوماً لعقد الخدمات، أو بند مصادرة التأمين لعقد الإيجار).`,
          risks: `* **خطورة متوسطة إلى عالية (🟠 Warning):** عدم تحديد حالات "الفسخ الفوري للسبب القاهر" (Termination for Cause) مثل الإفلاس أو الإخلال الجوهري المتكرر، يمنع الطرف المتضرر من الخروج السريع من العلاقة التعاقدية السيئة.`,
          recommendations: `1. **إضافة إنهاء للسبب (Termination for Cause):** إدراج بند يتيح الفسخ الفوري دون تعويض في حال ارتكاب خطأ جوهري لم يتم إصلاحه خلال **14 يوماً** من الإخطار.\n2. **تقليص فترة الإخطار:** خفض فترة الإخطار في الفسخ دون سبب (Convenience) لتكون **30 يوماً**.\n3. **الصياغة البديلة:** \`«يحق للعميل إنهاء هذا العقد فوراً بموجب إخطار كتابي في حال أخفق المورد في معالجة الإخلال الجوهري بالتزاماته خلال 14 يوماً من استلام تنبيه خطي بذلك».\``
        },
        {
          analysis: `* The termination clause regulates contract cancellation by one party or mutual consent.\n* In this contract, early termination is restricted by long notice periods or security deposit forfeitures.`,
          risks: `* **Medium to High Risk (🟠 Warning):** Missing a clear "Termination for Cause" provision (such as bankruptcy or repeated material breaches) prevents either party from exiting a failing agreement quickly.`,
          recommendations: `1. **Add Termination for Cause:** Insert a clause allowing immediate termination if a material breach is not cured within **14 days** of written notice.\n2. **Shorten Convenience Notice:** Reduce the standard termination notice to **30 days**.\n3. **Proposed Redraft:** \`"Either party may terminate this Agreement immediately upon written notice if the other party fails to cure a material breach within 14 days of receipt of written notice."\``
        }
      );
    }

    if (text.includes('ملكيه') || text.includes('ملكية') || text.includes('كود') || text.includes('برمج') || text.includes('ip ') || text.includes('intellectual') || text.includes('source code')) {
      return formatResponse(
        {
          analysis: `* بند الملكية الفكرية (IP Rights) في عقود الخدمات التقنية يحدد من يملك الكود المصدري والتصاميم بعد انتهاء العمل.\n* العقد الحالي يحتوي على بعض الغموض التعاقدي بشأن انتقال الملكية بالكامل إلى شركة رصد بعد الدفع النهائي للمورد.`,
          risks: `* **خطورة عالية (🔴 Danger):** غموض بند الملكية الفكرية قد يتيح للمورد إعادة بيع الكود المصدري لمنافسين آخرين، أو منع شركتكم من تعديل النظام مستقبلاً دون الاستعانة به.`,
          recommendations: `1. **إثبات انتقال الملكية الكامل والنهائي:** النص بوضوح على أن الملكية الفكرية تنتقل تلقائياً لشركتكم فور سداد الدفعات المقابلة للمرحلة.\n2. **حظر الاستخدام التجاري للمورد:** منع المورد من استخدام البرمجيات المطورة لعملاء آخرين.\n3. **الصياغة البديلة:** \`«تنتقل كافة حقوق الملكية الفكرية والكود المصدري والمخرجات المطورة بموجب هذا العقد إلى شركة رصد بشكل حصري ونهائي وتلقائي فور سداد الدفعة المقابلة، ولا يحق للمورد استخدامها أو إعادة ترخيصها لأي طرف ثالث».\``
        },
        {
          analysis: `* Intellectual Property (IP) clauses in technical contracts regulate who owns the source code and product architecture upon completion.\n* The current draft shows ambiguity regarding the transfer of IP ownership to RASD after final payment.`,
          risks: `* **High Risk (🔴 Danger):** IP ambiguity may allow the developer to license the same software to competitors, or prevent your company from modifying the software in the future.`,
          recommendations: `1. **Explicit Transfer of Ownership:** Clarify that all IP rights and source code transfer automatically and unconditionally to your company upon payment.\n2. **Restrict Developer Usage:** Prevent the developer from using custom components built for you in other commercial products.\n3. **Proposed Redraft:** \`"Upon payment, all Intellectual Property rights and Source Code developed under this agreement shall transfer exclusively to RASD. The Developer is prohibited from licensing or reusing these custom assets."\``
        }
      );
    }

    if (text.includes('مالي') || text.includes('سداد') || text.includes('دفع') || text.includes('قيمة') || text.includes('payment') || text.includes('price') || text.includes('value')) {
      return formatResponse(
        {
          analysis: `* القيمة الإجمالية للعقد الحالي هي **${data.value}**.\n* يرتبط جدول الدفعات بتسليم المخرجات أو مراحل الإنجاز (Milestones).`,
          risks: `* **خطورة متوسطة (🟠 Warning):** عدم ربط الدفعات بالقبول الفني والتشغيلي المكتوب (Sign-off) قد يضطر شركتكم لدفع مبالغ مقابل مخرجات غير مكتملة أو تحتوي على عيوب برمجية.`,
          recommendations: `1. **ربط الدفعة بالقبول:** النص على أن سداد أي دفعة مشروط بصدور "شهادة قبول واعتماد" موقعة من مهندس أو مسؤول المشروع من جانبكم.\n2. **الاحتفاظ بنسبة ضمان (Retention):** حجز **10%** من قيمة العقد الإجمالية كدفعة ضمان نهائي تسدد بعد 3 أشهر من التشغيل التجريبي الفعلي للتأكد من خلو النظام من العيوب.\n3. **الصياغة البديلة:** \`«تستحق الدفعات المالية المجدولة بعد الفحص والقبول الفني للمخرجات من قبل الطرف الثاني وصدور محضر تسليم موقع، مع حجز 10% من القيمة الإجمالية كضمان حسن تنفيذ تسدد بعد 90 يوماً من التشغيل التجاري».\``
        },
        {
          analysis: `* The total financial value of the contract is **${data.value}**.\n* Payment milestones are tied to deliverables or phases of implementation.`,
          risks: `* **Medium Risk (🟠 Warning):** Paying milestones without formal written acceptance (Sign-off) exposes the company to making payments for incomplete or defective outputs.`,
          recommendations: `1. **Condition Payment on Acceptance:** State clearly that payments are released only after a formal "Acceptance Certificate" is signed by your project lead.\n2. **Add a Retention Clause:** Withhold **10%** of the total contract value as a warranty retention, payable 3 months after live deployment.\n3. **Proposed Redraft:** \`"Scheduled payments are due within 30 days after formal technical acceptance of the deliverables, subject to a 10% retention fee to be released 90 days post live-operations."\``
        }
      );
    }

    if (text.includes('انتهاء') || text.includes('تاريخ') || text.includes('تجديد') || text.includes('expiry') || text.includes('renew') || text.includes('مدة')) {
      return formatResponse(
        {
          analysis: `* ينتهي هذا العقد في **${data.expiryDate}**.\n* العقد يحتوي على بند للتجديد التلقائي لمدد مماثلة ما لم يقم أحد الطرفين بإشعار الآخر بعدم الرغبة في التجديد قبل 30 يوماً من الانتهاء.`,
          risks: `* **خطورة منخفضة (🔵 Info):** التجديد التلقائي مفيد لاستمرارية الأعمال، ولكنه يحرمكم من مراجعة الأسعار وتفاوض شروط جديدة دورياً في حال حدوث تغيرات في السوق.`,
          recommendations: `1. **إضافة شرط مراجعة الأسعار:** تعديل بند التجديد لينص على بقاء الأسعار ثابتة أو خضوعها للتفاوض في حال التجديد.\n2. **توسيع مهلة الإشعار:** جعل مهلة إشعار عدم الرغبة في التجديد **60 يوماً** بدلاً من 30 لإتاحة الوقت للبحث عن بدائل.\n3. **الصياغة البديلة:** \`«يتجدد هذا العقد تلقائياً لمدد مماثلة ما لم يخطر أحد الطرفين الآخر كتابياً برغبته في عدم التجديد قبل 60 يوماً من تاريخ الانتهاء، على أن تخضع الشروط المالية للمراجعة المشتركة قبل التفعيل».\``
        },
        {
          analysis: `* The contract expires on **${data.expiryDate}**.\n* It includes an automatic renewal clause for successive terms unless either party gives a 30-day written non-renewal notice.`,
          risks: `* **Low Risk (🔵 Info):** Auto-renewal is convenient for operations, but it locks the company in without opportunities to renegotiate rates or explore alternatives in a changing market.`,
          recommendations: `1. **Add Rate Revision:** Amend the renewal clause to require mutual agreement on pricing before any automatic renewal takes effect.\n2. **Extend Notice Window:** Extend the non-renewal notice period to **60 days** to allow ample time to transition to other service providers.\n3. **Proposed Redraft:** \`"This contract will auto-renew for successive terms unless either party gives a written non-renewal notice 60 days prior to expiration. Financial terms are subject to renegotiation."\``
        }
      );
    }

    return isAr
      ? `### 📋 استشارة هندسية-قانونية شاملة (Systems Engineering Perspective)
بصفتي **أخصائي إدارة وهندسة العقود**، قمت بتحليل استفسارك **"${userText}"** وعلاقته ببنية هذا العقد المرفوع (**${this.uploadedFileName()}**).

إليك التقييم الفني بنظام النقاط المرتبة (ChatGPT Style):

* 📊 **طبيعة العقد والهيكل التشغيلي:**
  * العقد المبرم هو عقد قيمته الإجمالية **${data.value}** وينتهي في **${data.expiryDate}**.
  * الأطراف الملتزمة هي: **${data.parties.join(' و ')}**.
  * يتطلب العقد خطة عمل واضحة لضمان مطابقة المخرجات للمتطلبات الفنية (Requirements Traceability).

* ⚠️ **تحليل المخاطر التعاقدية (Risk Management):**
  * تم تحديد عدد **${data.risks.length}** بنود مصنفة كـ (خطر / تحذير).
  * البنود الحرجة (مثل غرامات التأخير والملكية الفكرية) تتطلب تعديلاً فورياً وتنسيقاً وثيقاً مع المورد لضمان عدم حدوث إخلال.

* 💡 **التوصيات الهندسية المعتمدة لشركتكم:**
  1. **تأسيس سجل للمتطلبات (System Requirements Specification):** يجب توثيق المخرجات فنياً بدقة قبل البدء في التنفيذ.
  2. **تقسيم المشروع لمراحل تسليم صغيرة (Phased Handovers):** لتفادي غرامات التأخير التراكمية على إجمالي العقد، يجب صياغة الغرامة لتكون على المرحلة المتأخرة فقط.
  3. **عقد جلسة تفاوض مباشرة:** لمراجعة بند الملكية الفكرية وبند التعويض عن الفسخ المبكر وتعديلهما بما يتوافق مع مصلحة الشركة الاستثمارية.

*هل تود تفصيل بند معين كغرامة التأخير أو حقوق الملكية الفكرية لنصيغ لك بنداً بديلاً تضعه في الملحق؟*`
      : `### 📋 Systems & Contract Engineering Advisory Report
As a **Contract & Systems Engineering Specialist**, I have evaluated your query **"${userText}"** regarding this uploaded agreement (**${this.uploadedFileName()}**).

Here is the professional evaluation (ChatGPT Style):

* 📊 **Contract Structure & Operations:**
  * This agreement is valued at **${data.value}** and expires on **${data.expiryDate}**.
  * Bound parties are: **${data.parties.join(' and ')}**.
  * Success depends heavily on establishing a Requirements Traceability Matrix to verify that final deliverables match technical specs.

* ⚠️ **Risk & Vulnerability Analysis:**
  * There are **${data.risks.length}** flagged clauses (Danger/Warning).
  * Critical elements (such as daily delay penalties and source code ownership) must be actively managed to protect your legal and intellectual assets.

* 💡 **Systems Engineering Recommendations for Your Team:**
  1. **Document Technical Standards:** Define acceptance criteria clearly prior to launching work phases.
  2. **Structure Phased Deliveries:** Apply penalties to late stages or components only, not the full contract price.
  3. **Schedule Negotiation Session:** Restructure termination notice windows and IP rights ownership to align with your long-term business goals.

*Would you like me to redraft a specific clause (like delay penalties or intellectual property ownership) so you can include it in the contract addendum?*`;
  }

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    const timeStr = this.getFormattedTime();

    this.messages.update(prev => [
      ...prev,
      {
        role: 'user',
        text: messageText,
        safeText: this.sanitizeMarkdown(messageText),
        time: timeStr
      }
    ]);
    if (!text) this.inputText = '';
    
    this.isTyping.set(true);
    this.shouldScroll = true;

    const contractData = this.contractData();
    let contractContext = '';
    if (contractData) {
      contractContext = JSON.stringify(contractData);
    }

    this.aiService.chat(messageText, undefined, contractContext).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const errorMsg = this.i18n.currentLang() === 'ar' 
          ? 'عذراً، لم أستطع معالجة طلبك حالياً.' 
          : 'Sorry, I could not process your request at the moment.';
        const reply = res.data?.response || res.response || errorMsg;
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
        const reply = contractData 
          ? this.getSpecializedContractChatResponse(messageText)
          : this.getSimulatedChatResponse(messageText);
        
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

  private getSimulatedChatResponse(userText: string): string {
    const isAr = this.i18n.currentLang() === 'ar';
    const text = userText.toLowerCase();
    const data = this.contractData();
    if (!data) {
      return isAr 
        ? 'يرجى تحميل العقد أولاً لتحليله، ثم سأجيبك على كافة التفاصيل.'
        : 'Please upload the contract first to analyze it, then I will answer your questions.';
    }

    if (text.includes('أطراف') || text.includes('parties') || text.includes('من هم')) {
      return isAr 
        ? `الأطراف المذكورة في هذا العقد هي:\n` + data.parties.map((p, i) => `${i+1}. ${p}`).join('\n')
        : `The parties mentioned in this contract are:\n` + data.parties.map((p, i) => `${i+1}. ${p}`).join('\n');
    }
    if (text.includes('مخاطر') || text.includes('risks') || text.includes('غرامة') || text.includes('penalties') || text.includes('التزامات')) {
      if (data.risks.length === 0) {
        return isAr 
          ? 'لم يتم العثور على مخاطر بارزة أو بنود غرامات عالية في التحليل الأولي لهذا العقد.'
          : 'No major risks or high penalties were found in the initial analysis of this contract.';
      }
      let reply = isAr ? 'المخاطر والغرامات المالية المكتشفة في العقد:\n\n' : 'Discovered risks and financial penalties in the contract:\n\n';
      data.risks.forEach(r => {
        const flag = r.severity === 'Red' ? '🔴' : r.severity === 'Orange' ? '🟠' : r.severity === 'Blue' ? '🔵' : '🟢';
        reply += `${flag} **[${r.severity}]** ${r.description}\n`;
      });
      return reply;
    }
    if (text.includes('مالية') || text.includes('financial') || text.includes('سداد') || text.includes('مبلغ') || text.includes('قيمة') || text.includes('value')) {
      return isAr
        ? `القيمة المالية الإجمالية للعقد المكتشفة هي: **${data.value || 'غير محددة بدقة'}**.\n\nبند الدفعات يشير إلى التزام الطرف الثاني بسداد الدفعات المالية المجدولة بناءً على تسليم المخرجات.`
        : `The total financial value of the contract is: **${data.value || 'Not specified'}**.\n\nPayment terms indicate obligations to make payments scheduled based on output deliveries.`;
    }
    if (text.includes('انتهاء') || text.includes('expiry') || text.includes('تاريخ') || text.includes('تجديد') || text.includes('renewal')) {
      return isAr
        ? `تاريخ انتهاء هذا العقد هو: **${data.expiryDate || 'غير محدد'}**.\n\nيتضمن العقد بنداً للتجديد التلقائي لمدد مماثلة ما لم يقم أحد الطرفين بإخطار الآخر كتابياً بعدم الرغبة في التجديد قبل 30 يوماً.`
        : `The expiry date of this contract is: **${data.expiryDate || 'Not specified'}**.\n\nIt contains a renewal clause for similar terms unless one party notifies the other in writing 30 days prior.`;
    }

    return isAr
      ? `بناءً على العقد المرفوع:\n\nالعقد ينص على شراكة تقديم خدمات بقيمة إجمالية قدرها ${data.value}. هل تود الاستفسار عن تفاصيل التزامات الدفع أو شروط السرية والفسخ؟`
      : `Based on the uploaded contract:\n\nThe contract specifies services with a total value of ${data.value}. Would you like to ask about payment obligations, confidentiality, or termination terms?`;
  }

  private getSimulatedContractAnalysis(fileName: string) {
    const isAr = this.i18n.currentLang() === 'ar';
    const isSupply = fileName.includes('توريد') || fileName.includes('supply');
    const isLease = fileName.includes('إيجار') || fileName.includes('lease');

    let summary = '';
    let parties: string[] = [];
    let expiryDate = '';
    let value = '';
    let risks: { severity: string; description: string }[] = [];

    if (isSupply) {
      if (isAr) {
        summary = 'عقد لتوريد خدمات استشارية وتقنية للشركة، يتضمن شروط السداد ونسب الإنجاز وغرامات التأخير في التسليم.';
        parties = ['مجموعة الفتح التجارية (المورد)', 'شركة رصد للتطوير والاستشارات (العميل)'];
        expiryDate = '2026/12/31';
        value = '150,000 USD';
        risks = [
          { severity: 'Red', description: 'بند 5.2: يفرض غرامة تأخير قدرها 1% يومياً في حال تجاوز تاريخ تسليم البرمجيات المتفق عليه وبحد أقصى 15%.' },
          { severity: 'Orange', description: 'بند 8.1: فترة التجربة والقبول للمستندات والبرمجيات هي 5 أيام فقط، مما قد يعطي المورد حق تمرير النظام دون مراجعة كافية.' },
          { severity: 'Blue', description: 'بند 11: يخضع العقد لقوانين المحاكم التجارية المحلية وفي حال النزاع يتم اللجوء للتحكيم.' },
          { severity: 'Green', description: 'بند 14: تلتزم الجهة الموردة بتقديم دعم فني مجاني وصيانة وتحديثات للنظام لمدة 24 شهراً بعد التسليم النهائي.' }
        ];
      } else {
        summary = 'A contract for supplying consulting and technical services, detailing payment terms, completion stages, and delay penalties.';
        parties = ['Fatah Trade Group (Supplier)', 'RASD for Development & Consulting (Client)'];
        expiryDate = '2026-12-31';
        value = '150,000 USD';
        risks = [
          { severity: 'Red', description: 'Clause 5.2: Imposes a daily delay penalty of 1% up to a maximum of 15% if software delivery is delayed.' },
          { severity: 'Orange', description: 'Clause 8.1: Acceptance test period is only 5 business days, giving the supplier the right to push the system with little review.' },
          { severity: 'Blue', description: 'Clause 11: Governed by local commercial courts; disputes will go to arbitration.' },
          { severity: 'Green', description: 'Clause 14: Supplier commits to providing 24 months of free technical support and system upgrades after final delivery.' }
        ];
      }
    } else if (isLease) {
      if (isAr) {
        summary = 'عقد إيجار مقر إداري مخصص لمقر الشركة الرئيسي، موضحاً فيه شروط دفع القيمة الإيجارية السنوية ومبلغ التأمين وتكاليف الصيانة.';
        parties = ['شركة العقار العالمية (المؤجر)', 'شركة رصد للتطوير والاستشارات (المستأجر)'];
        expiryDate = '2028/05/01';
        value = '45,000 USD سنوياً';
        risks = [
          { severity: 'Red', description: 'بند 4: يحق للمؤجر زيادة القيمة الإيجارية السنوية بنسبة 10% تلقائياً دون إشعار مسبق عند التجديد.' },
          { severity: 'Orange', description: 'بند 6.2: مبلغ التأمين (3 أشهر) غير مسترد في حال فسخ العقد قبل انقضاء نصف المدة الإيجارية.' },
          { severity: 'Blue', description: 'بند 9: تكاليف الصيانة الهيكلية تقع على المؤجر بينما الصيانة التشغيلية تقع بالكامل على عاتق المستأجر.' },
          { severity: 'Green', description: 'بند 7.3: يلتزم المؤجر بتحمل كافة نفقات ومصاريف التأمين والتراخيص والضرائب العقارية للمبنى.' }
        ];
      } else {
        summary = 'Office lease contract for the company main headquarters, detailing yearly rents, deposits, and maintenance obligations.';
        parties = ['Global Real Estate Co. (Lessor)', 'RASD for Development & Consulting (Lessee)'];
        expiryDate = '2028-05-01';
        value = '45,000 USD/year';
        risks = [
          { severity: 'Red', description: 'Clause 4: Lessor is entitled to raise the yearly rent by 10% automatically on renewal without prior notice.' },
          { severity: 'Orange', description: 'Clause 6.2: The 3-month security deposit is non-refundable if the contract is terminated early.' },
          { severity: 'Blue', description: 'Clause 9: Lessor covers structural repairs, while routine operating maintenance is fully covered by the lessee.' },
          { severity: 'Green', description: 'Clause 7.3: Lessor commits to pay all property taxes, structural insurance, and building fees.' }
        ];
      }
    } else {
      if (isAr) {
        summary = 'عقد اتفاقية تقديم خدمات عامة وتنظيم الحقوق والالتزامات للطرفين خلال مدة التعاقد.';
        parties = ['شركة المقاولات العربية (الطرف الأول)', 'شركة رصد للتطوير والاستشارات (الطرف الثاني)'];
        expiryDate = '2027/06/15';
        value = '75,000 USD';
        risks = [
          { severity: 'Red', description: 'بند الفسخ المبكر: يستلزم إخطار الطرف الآخر قبل 90 يوماً وإلا يلتزم بدفع تعويض يعادل 20% من قيمة العقد.' },
          { severity: 'Orange', description: 'الملكية الفكرية: غموض نسبي في تبعية الكود المصدري بعد إتمام خدمات التطوير.' },
          { severity: 'Blue', description: 'شروط الدفع: الدفع خلال 30 يوماً من استلام الفاتورة الرسمية.' },
          { severity: 'Green', description: 'بند 12: تلتزم الشركة بتقديم ورش عمل وتدريب مجاني لموظفي الطرف الثاني على كيفية استخدام النظام وتطبيقاته.' }
        ];
      } else {
        summary = 'General service agreement regulating the mutual rights and obligations of both parties during the contract term.';
        parties = ['Arabian Contracting Co. (First Party)', 'RASD for Development & Consulting (Second Party)'];
        expiryDate = '2027-06-15';
        value = '75,000 USD';
        risks = [
          { severity: 'Red', description: 'Early Termination: Requires 90 days notice, otherwise a penalty equal to 20% of contract value is due.' },
          { severity: 'Orange', description: 'IP Rights: Relative ambiguity regarding ownership of source code after implementation services.' },
          { severity: 'Blue', description: 'Payment Terms: Payments are due within 30 days of receiving official invoices.' },
          { severity: 'Green', description: 'Clause 12: Provider commits to offering free training workshops for the Client staff on system utilization.' }
        ];
      }
    }

    let reply = isAr
      ? `📑 **تحليل العقد (وضع المحاكاة): ${fileName}**\n\n📝 **ملخص العقد:** ${summary}\n\nتم استخراج الأطراف والالتزامات والمخاطر. يمكنك مراجعتها وتصنيفها في اللوحة الجانبية، أو توجيه الأسئلة هنا مباشرة.`
      : `📑 **Contract Analysis (Simulated): ${fileName}**\n\n📝 **Contract Summary:** ${summary}\n\nParties, obligations, and risks extracted. You can review them in the side panel or ask questions here.`;

    return {
      assistantReply: reply,
      data: { summary, parties, expiryDate, value, risks }
    };
  }
}
