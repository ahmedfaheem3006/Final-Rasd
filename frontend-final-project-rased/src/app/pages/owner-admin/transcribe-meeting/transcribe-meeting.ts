import { Component, signal, inject, effect, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../services/ai.service';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';
import { TaskService } from '../../../services/task.service';
import { MeetingService } from '../../../services/meeting.service';
import { ToastService } from '../../../services/toast.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  safeText?: SafeHtml;
  time?: string;
}

interface MeetingTask {
  title: string;
  assignedUserId?: number;
  assignedUserName: string;
  dueDate: string;
  accepted?: boolean;
  rejected?: boolean;
}

interface FutureMeeting {
  title: string;
  date: string;
  time: string;
  duration: string;
  attendees: string;
  notes?: string;
  accepted?: boolean;
  rejected?: boolean;
}

interface TranscriptChunk {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

interface MeetingData {
  transcript: string;
  summary: string;
  transcriptChunks: TranscriptChunk[];
  proposedTasks: MeetingTask[];
  proposedMeetings: FutureMeeting[];
}

@Component({
  selector: 'app-transcribe-meeting',
  imports: [CommonModule, FormsModule],
  templateUrl: './transcribe-meeting.html',
  styleUrl: './transcribe-meeting.css'
})
export class TranscribeMeeting implements OnInit {
  private aiService = inject(AiService);
  public i18n = inject(I18nService);
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private meetingService = inject(MeetingService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  currentUser = this.authService.currentUser;
  uploadedFileName = signal<string | null>(null);
  uploadedFile = signal<File | null>(null);
  driveLinkInput = signal<string>('');
  
  // Loading progression
  isUploading = signal(false);
  isTyping = signal(false);
  showHistoryModal = signal(false);
  showLimitModal = signal(false);
  limitModalMessage = signal('');
  loadingStep = signal<number>(0); // 0 = Idle, 1 = Audio Extract, 2 = Chunking, 3 = Transcribing, 4 = Analyzing

  meetingData = signal<MeetingData | null>(null);
  
  messages = signal<ChatMessage[]>([]);

  // Meeting History state
  meetingHistory = signal<any[]>([]);
  activeMeetingId = signal<number | null>(null);
  private shouldScroll = false;

  constructor() {
    effect(() => {
      const lang = this.i18n.currentLang();
      untracked(() => {
        if (this.messages().length <= 1) {
          const isAr = lang === 'ar';
          const welcomeText = isAr
            ? 'مرحباً! يرجى تحميل تسجيل الاجتماع (صوت أو فيديو) أو إدخال رابط Google Drive وسأقوم بتفريغه نصياً بالكامل وتلخيصه واستخلاص المهام والقرارات المتفق عليها تلقائياً.'
            : 'Hello! Please upload a meeting recording (audio or video) or enter a Google Drive link. I will transcribe it, summarize it, and extract action items automatically.';
          const now = new Date();
          const timeStr = now.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
          this.messages.set([
            { 
              role: 'assistant', 
              text: welcomeText, 
              safeText: this.parseMarkdown(welcomeText), 
              time: timeStr 
            }
          ]);
        }
      });
    });
  }

  parseMarkdown(text: string): SafeHtml {
    if (!text) return '';
    try {
      // Configure marked option to break lines on single newlines
      const rawHtml = marked.parse(text, { breaks: true }) as string;
      return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
    } catch (e) {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }

  private getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleTimeString(this.i18n.currentLang() === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }

  translateRole(role: string): string {
    if (!role) return '';
    const key = 'dashboard.role.' + role.toLowerCase();
    const translated = this.i18n.t(key);
    if (translated === key) {
      return role || this.i18n.t('dashboard.role.default');
    }
    return translated;
  }

  suggestions = signal([
    'لخص الاجتماع بوضوح',
    'ما هي المهام والقرارات المستخرجة؟',
    'ما هي النقاط الرئيسية التي تمت مناقشتها؟'
  ]);

  inputText = '';
  usersList = signal<any[]>([]);

  ngOnInit() {
    this.loadUsers();
    this.loadMeetingHistory();
  }

  loadMeetingHistory() {
    this.aiService.getMeetingHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.meetingHistory.set(res.data);
        }
      }
    });
  }

  loadMeetingDetails(id: number) {
    this.aiService.getMeetingHistoryDetails(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.activeMeetingId.set(id);
          this.uploadedFileName.set(res.data.videoFilePath || 'Meeting');
          const data = res.data;
          this.meetingData.set({
            transcript: data.transcript || '',
            summary: data.summary || '',
            transcriptChunks: data.transcriptChunks || [],
            proposedTasks: (data.proposedTasks || []).map((t: any) => {
              const found = this.usersList().find(u => u.fullName?.toLowerCase().includes(t.assignedUserName?.toLowerCase()));
              const loggedIn = this.usersList().find(u => u.email === this.currentUser()?.email);
              return { 
                ...t, 
                assignedUserId: found ? found.id : (loggedIn ? loggedIn.id : (this.usersList().length > 0 ? this.usersList()[0].id : 1)),
                accepted: false, 
                rejected: false 
              };
            }),
            proposedMeetings: (data.proposedMeetings || []).map((m: any) => ({ ...m, accepted: false, rejected: false }))
          });

          const isEn = this.i18n.currentLang() === 'en';
          let reply = isEn 
            ? `🎤 **Meeting loaded from history: ${data.videoFilePath}**\n\n`
            : `🎤 **تم تحميل تفريغ الاجتماع المخزن: ${data.videoFilePath}**\n\n`;
          reply += isEn 
            ? `📝 **Meeting Summary:** ${data.summary}\n\n`
            : `📝 **ملخص الاجتماع:** ${data.summary}\n\n`;
          if (data.transcriptChunks && data.transcriptChunks.length > 0) {
            reply += isEn ? `📋 **Transcript Chunks:**\n` : `📋 **شرائح التفريغ النصي:**\n`;
            data.transcriptChunks.forEach((chunk: any) => {
              reply += `• **[${chunk.startTime} - ${chunk.endTime}]** ${chunk.text}\n`;
            });
            reply += `\n`;
          }
          
          this.messages.set([
            {
              role: 'assistant',
              text: isEn ? 'Hello! Welcome back.' : 'مرحباً بك!',
              safeText: isEn ? 'Hello! Welcome back.' : 'مرحباً بك!',
              time: this.getFormattedTime()
            },
            {
              role: 'assistant',
              text: reply,
              safeText: this.parseMarkdown(reply),
              time: this.getFormattedTime()
            }
          ]);
          this.shouldScroll = true;
        }
      }
    });
  }

  deleteMeetingFromHistory(id: number, event: MouseEvent) {
    event.stopPropagation();
    const conf = this.i18n.currentLang() === 'ar'
      ? 'هل أنت متأكد من حذف تفريغ هذا الاجتماع؟'
      : 'Are you sure you want to delete this meeting transcription?';
    if (confirm(conf)) {
      this.aiService.deleteMeetingHistory(id).subscribe({
        next: (res) => {
          this.loadMeetingHistory();
          if (this.activeMeetingId() === id) {
            this.resetMeetingState();
          }
        }
      });
    }
  }

  resetMeetingState() {
    this.activeMeetingId.set(null);
    this.uploadedFileName.set(null);
    this.uploadedFile.set(null);
    this.meetingData.set(null);
    const isAr = this.i18n.currentLang() === 'ar';
    const welcomeText = isAr
      ? 'مرحباً! يرجى تحميل تسجيل الاجتماع (صوت أو فيديو) أو إدخال رابط Google Drive وسأقوم بتفريغه نصياً بالكامل وتلخيصه واستخلاص المهام والقرارات المتفق عليها تلقائياً.'
      : 'Hello! Please upload a meeting recording (audio or video) or enter a Google Drive link. I will transcribe it, summarize it, and extract action items automatically.';
    this.messages.set([
      {
        role: 'assistant',
        text: welcomeText,
        safeText: this.parseMarkdown(welcomeText),
        time: this.getFormattedTime()
      }
    ]);
    this.shouldScroll = true;
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.usersList.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load users for assignment', err)
    });
  }

  triggerFileInput() {
    document.getElementById('meetingFileInput')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploadedFileName.set(file.name);
    this.uploadedFile.set(file);
    this.driveLinkInput.set('');
    this.transcribeMeetingFile(file, undefined);
  }

  onDriveSubmit() {
    const link = this.driveLinkInput().trim();
    if (!link) return;
    this.uploadedFileName.set('Google Drive Video');
    this.uploadedFile.set(null);
    this.transcribeMeetingFile(undefined, link);
  }

  private async transcribeMeetingFile(file?: File, driveLink?: string) {
    this.isUploading.set(true);
    this.isTyping.set(true);
    this.loadingStep.set(1); // Step 1: Extracting audio from video

    const now = new Date();
    const timeStr = now.toLocaleTimeString(this.i18n.currentLang() === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const displayName = file ? file.name : 'رابط Google Drive';

    this.messages.update(prev => [...prev, { 
      role: 'user', 
      text: this.i18n.currentLang() === 'en' 
        ? `[Uploading and transcribing meeting file: ${displayName}]`
        : `[تحميل وتفريغ ملف الاجتماع: ${displayName}]`, 
      safeText: this.parseMarkdown(this.i18n.currentLang() === 'en' 
        ? `[Uploading and transcribing meeting file: ${displayName}]`
        : `[تحميل وتفريغ ملف الاجتماع: ${displayName}]`),
      time: timeStr 
    }]);

    let uploadFile: File | undefined = file;

    // If it's a physical file, extract the audio track in the browser to reduce size
    if (file) {
      try {
        console.log(`Decoding and compressing audio track in browser: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);
        const wavBlob = await this.extractAudio(file);
        const compressedName = file.name.replace(/\.[^/.]+$/, "") + ".wav";
        uploadFile = new File([wavBlob], compressedName, { type: 'audio/wav' });
        console.log(`Audio compression completed: ${uploadFile.name} (${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)`);
      } catch (e) {
        console.warn('Browser audio extraction failed, uploading original file:', e);
      }
    }

    // Progress to Step 2
    this.loadingStep.set(2);

    let progress = 2;
    // Simulate step progression for smooth UX
    const intervalId = setInterval(() => {
      if (progress < 3) {
        progress++;
        this.loadingStep.set(progress);
      }
    }, 4000);

    const activeLang = this.i18n.currentLang();

    // Call service (cast to any first to satisfy compiler since TypeScript checks optional args strictly sometimes)
    this.aiService.transcribeMeeting(uploadFile as any, driveLink, activeLang).subscribe({
      next: (res) => {
        clearInterval(intervalId);
        this.loadingStep.set(4);

        setTimeout(() => {
          this.isUploading.set(false);
          this.isTyping.set(false);
          this.loadingStep.set(0);

          const data = res.data;
          this.meetingData.set({
            transcript: data.transcript || '',
            summary: data.summary || '',
            transcriptChunks: data.transcriptChunks || [],
            proposedTasks: (data.proposedTasks || []).map((t: any) => {
              const found = this.usersList().find(u => u.fullName?.toLowerCase().includes(t.assignedUserName?.toLowerCase()));
              const loggedIn = this.usersList().find(u => u.email === this.currentUser()?.email);
              return { 
                ...t, 
                assignedUserId: found ? found.id : (loggedIn ? loggedIn.id : (this.usersList().length > 0 ? this.usersList()[0].id : 1)),
                accepted: false, 
                rejected: false 
              };
            }),
            proposedMeetings: (data.proposedMeetings || []).map((m: any) => ({ ...m, accepted: false, rejected: false }))
          });

          if (data.id) {
            this.activeMeetingId.set(data.id);
            this.loadMeetingHistory();
          }

          // Print success header inside chat in active language
          const isEn = activeLang === 'en';
          let reply = isEn 
            ? `🎤 **Meeting transcribed successfully: ${displayName}**\n\n`
            : `🎤 **تم تفريغ الاجتماع بنجاح: ${displayName}**\n\n`;
            
          reply += isEn 
            ? `📝 **Meeting Summary:** ${data.summary}\n\n`
            : `📝 **ملخص الاجتماع:** ${data.summary}\n\n`;
          
          if (data.transcriptChunks && data.transcriptChunks.length > 0) {
            reply += isEn ? `📋 **Transcript Chunks:**\n` : `📋 **شرائح التفريغ النصي:**\n`;
            data.transcriptChunks.forEach((chunk: any) => {
              reply += `• **[${chunk.startTime} - ${chunk.endTime}]** ${chunk.text}\n`;
            });
            reply += `\n`;
          }

          reply += isEn
            ? `Full transcript has been extracted and tasks have been distributed. You can review them and ask me any questions about the discussion.`
            : `تم استخراج النص بالكامل وتوزيع المهام المطلوبة. يمكنك مراجعتها وطرح أي أسئلة عليّ حول النقاش.`;

          this.messages.update(prev => [...prev, { 
            role: 'assistant', 
            text: reply, 
            safeText: this.parseMarkdown(reply),
            time: timeStr 
          }]);
        }, 1500);
      },
      error: (err) => {
        clearInterval(intervalId);
        this.loadingStep.set(0);
        this.isUploading.set(false);
        this.isTyping.set(false);
        const serverMsg = err?.error?.message;
        if (serverMsg) {
          this.limitModalMessage.set(serverMsg);
          this.showLimitModal.set(true);
        } else {
          const isAr = this.i18n.currentLang() === 'ar';
          const reply = isAr
            ? 'تعذّر الاتصال بالخادم لتفريغ الاجتماع. تأكد من أن الخادم يعمل وأعد المحاولة.'
            : 'Could not reach the server for meeting transcription. Please make sure the API is running and try again.';
          this.messages.update(prev => [...prev, { role: 'assistant', text: reply, safeText: this.parseMarkdown(reply), time: timeStr }]);
        }
      }
    });
  }

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    const activeLang = this.i18n.currentLang();
    const isEn = activeLang === 'en';
    const now = new Date();
    const timeStr = now.toLocaleTimeString(isEn ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' });

    this.messages.update(prev => [...prev, { 
      role: 'user', 
      text: messageText, 
      safeText: this.parseMarkdown(messageText),
      time: timeStr 
    }]);
    if (!text) this.inputText = '';

    this.isTyping.set(true);

    const activeTranscript = this.meetingData()?.transcript || '';

    this.aiService.chatAboutMeeting(messageText, activeTranscript, activeLang).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const defaultErr = isEn ? 'Sorry, I could not process your request at this time.' : 'عذراً، لم أستطع معالجة طلبك حالياً.';
        const reply = res.data?.response || res.response || defaultErr;
        this.messages.update(prev => [...prev, { 
          role: 'assistant', 
          text: reply, 
          safeText: this.parseMarkdown(reply),
          time: timeStr 
        }]);
      },
      error: (err) => {
        this.isTyping.set(false);
        const serverMsg = err?.error?.message;
        if (serverMsg) {
          this.limitModalMessage.set(serverMsg);
          this.showLimitModal.set(true);
        } else {
          const reply = this.getSimulatedChatResponse(messageText);
          this.messages.update(prev => [...prev, { role: 'assistant', text: reply, safeText: this.parseMarkdown(reply), time: timeStr }]);
        }
      }
    });
  }

  closeLimitModal() { this.showLimitModal.set(false); }

  selectSuggestion(suggestion: string) {
    this.sendMessage(suggestion);
  }

  acceptTask(task: MeetingTask, index: number) {
    // Resolve assignee user ID
    let userId = task.assignedUserId;
    if (!userId) {
      const found = this.usersList().find(u => u.fullName.toLowerCase().includes(task.assignedUserName.toLowerCase()));
      const loggedIn = this.usersList().find(u => u.email === this.currentUser()?.email);
      userId = found ? found.id : (loggedIn ? loggedIn.id : 1);
    }

    const payload = {
      title: task.title,
      description: `تم توليدها تلقائياً من تفريغ الاجتماع. المسؤول المقترح: ${task.assignedUserName}`,
      assignedUserId: userId || 1,
      dueDate: task.dueDate || new Date().toISOString().split('T')[0]
    };

    this.taskService.createTask(payload).subscribe({
      next: (res) => {
        task.accepted = true;
        this.toastService.success(
          this.i18n.isRtl() ? 'تم قبول المهمة وإضافتها بنجاح!' : 'Task accepted and added successfully!',
          this.i18n.isRtl() ? 'إضافة مهمة' : 'Add Task'
        );
      },
      error: (err) => {
        console.error('Error saving task', err);
        this.toastService.error(
          this.i18n.isRtl() ? 'حدث خطأ أثناء حفظ المهمة' : 'An error occurred while saving the task',
          this.i18n.isRtl() ? 'خطأ' : 'Error'
        );
      }
    });
  }

  rejectTask(task: MeetingTask) {
    task.rejected = true;
    this.toastService.info(
      this.i18n.isRtl() ? 'تم رفض المهمة المقترحة.' : 'Proposed task rejected.',
      this.i18n.isRtl() ? 'رفض' : 'Rejected'
    );
  }

  acceptMeeting(meeting: FutureMeeting, index: number) {
    const payload = {
      title: meeting.title,
      meetingDate: meeting.date,
      meetingTime: meeting.time,
      duration: meeting.duration,
      meetingType: 'internal',
      location: 'Virtual Link',
      attendees: meeting.attendees,
      virtualLink: 'https://meet.jit.si/RasdAI-Meeting-' + Math.floor(100000 + Math.random() * 900000).toString()
    };

    this.meetingService.createMeeting(payload).subscribe({
      next: (res) => {
        meeting.accepted = true;
        this.toastService.success(
          this.i18n.isRtl() ? 'تم قبول وجدولة الاجتماع القادم بنجاح!' : 'Future meeting scheduled successfully!',
          this.i18n.isRtl() ? 'جدولة اجتماع' : 'Schedule Meeting'
        );
      },
      error: (err) => {
        console.error('Error scheduling meeting', err);
        this.toastService.error(
          this.i18n.isRtl() ? 'حدث خطأ أثناء جدولة الاجتماع' : 'An error occurred while scheduling meeting',
          this.i18n.isRtl() ? 'خطأ' : 'Error'
        );
      }
    });
  }

  rejectMeeting(meeting: FutureMeeting) {
    meeting.rejected = true;
    this.toastService.info(
      this.i18n.isRtl() ? 'تم رفض الاجتماع المقترح.' : 'Proposed meeting rejected.',
      this.i18n.isRtl() ? 'رفض' : 'Rejected'
    );
  }

  private getSimulatedChatResponse(userText: string): string {
    const text = userText.toLowerCase();
    const data = this.meetingData();
    const isEn = this.i18n.currentLang() === 'en';

    if (!data) {
      return isEn 
        ? 'Please upload a meeting file first to start the analysis and discussion.' 
        : 'يرجى رفع ملف اجتماع أولاً للبدء بالتحليل والمناقشة.';
    }

    if (text.includes('لخص') || text.includes('ملخص') || text.includes('summar')) {
      return isEn
        ? `Detailed meeting summary:\n\n${data.summary}`
        : `ملخص تفصيلي للاجتماع:\n\n${data.summary}`;
    }
    if (text.includes('مهام') || text.includes('قرار') || text.includes('لمن') || text.includes('task') || text.includes('assign')) {
      if (data.proposedTasks.length === 0) {
        return isEn 
          ? 'No action items or tasks were extracted from this meeting.' 
          : 'لا توجد مهام عمل محددة تم استخلاصها من هذا الاجتماع.';
      }
      let reply = isEn ? 'Extracted tasks and responsibilities:\n\n' : 'المهام والمسؤوليات المستخرجة من الحوار:\n\n';
      data.proposedTasks.forEach((t, i) => {
        reply += isEn
          ? `🎯 **Task ${i+1}:** ${t.title}\n👤 **Assignee:** ${t.assignedUserName}\n📅 **Due Date:** ${t.dueDate}\n\n`
          : `🎯 **المهمة ${i+1}:** ${t.title}\n👤 **المسؤول:** ${t.assignedUserName}\n📅 **تاريخ الاستحقاق:** ${t.dueDate}\n\n`;
      });
      return reply;
    }
    if (text.includes('نقاط') || text.includes('رئيسي') || text.includes('حوار') || text.includes('point') || text.includes('topic')) {
      return isEn
        ? `Key discussion points:\n\n1. Reviewing sales department performance and operations.\n2. Managing invoice dates, financial commitments, and dues.\n3. Emphasizing prompt follow-ups to enhance KPI scores.`
        : `أبرز النقاط والمحاور التي تم الحديث عنها:\n\n1. مراجعة شؤون المبيعات وسير العمليات.\n2. التوجيه بالالتزامات المالية والفواتير وضبط مواعيد الاستحقاق.\n3. التركيز على سرعة المتابعة لتحسين مؤشرات الأداء العام للشركة.`;
    }

    return isEn
      ? `Based on the uploaded meeting transcript:\n\nWe agreed on ${data.proposedTasks.length} key tasks. Would you like to know the tasks assigned to a specific person or have questions about other topics?`
      : `بناءً على تفريغ الاجتماع المرفوع:\n\nتم الاتفاق على ${data.proposedTasks.length} مهام رئيسية. هل تريد معرفة تفاصيل المهام المسندة لشخص معين أو استفسار عن مواضيع أخرى بالاجتماع؟`;
  }

  private getSimulatedMeetingTranscription(fileName: string) {
    const isSales = fileName.toLowerCase().includes('sales') || fileName.includes('مبيعات');
    const isHR = fileName.toLowerCase().includes('hr') || fileName.includes('وظف');
    const isEn = this.i18n.currentLang() === 'en';

    let transcript = '';
    let summary = '';
    let proposedTasks: MeetingTask[] = [];
    let proposedMeetings: FutureMeeting[] = [];

    if (isSales) {
      if (isEn) {
        transcript = 'Welcome everyone to the recurring sales meeting. We need the sales representative to follow up on the pending contract and details of the Al-Fatah deal to ensure signatures are finalized. Second, the accountant must prepare the PDF tax invoices for the Arab Contracting Company to ensure collection before the end of the month. Also review the dashboard interfaces next Thursday. We will also hold another meeting to review the dashboard next week.';
        summary = 'Meeting to follow up on sales performance, guide the accountant to issue tax invoices, and follow up on pending deal contracts.';
        proposedTasks = [
          { title: 'Follow up on pending contract and Al-Fatah deal', assignedUserName: 'Sales Rep', dueDate: '2026-06-21' },
          { title: 'Prepare invoice and export to Arab Contracting Company', assignedUserName: 'Financial Accountant', dueDate: '2026-06-20' },
          { title: 'Review smart dashboard interfaces with owner', assignedUserName: 'Company Owner', dueDate: '2026-06-23' }
        ];
        proposedMeetings = [
          { title: 'Weekly Dashboard Review Meeting', date: '2026-07-02', time: '11:00 AM', duration: '60 minutes', attendees: 'Sales Rep, Company Owner' }
        ];
      } else {
        transcript = 'أهلاً بالجميع في اجتماع المبيعات الدوري. نحتاج من مندوب المبيعات متابعة العقد المعلق وتفاصيل صفقة مجموعة الفتح للتأكد من إنهاء التوقيعات. ثانياً، يجب على المحاسب إعداد فواتير PDF الضريبية لشركة المقاولات العربية لضمان التحصيل قبل نهاية الشهر. ومراجعة واجهات لوحة التحكم يوم الخميس القادم. كما سنعقد اجتماعاً آخر لمراجعة لوحة التحكم في الأسبوع القادم.';
        summary = 'اجتماع لمتابعة أداء المبيعات، توجيه المحاسب لإصدار فواتير ضريبية، ومتابعة توقيع عقود الصفقات قيد الانتظار.';
        proposedTasks = [
          { title: 'متابعة العقد المعلق وصفقة مجموعة الفتح', assignedUserName: 'مندوب المبيعات', dueDate: '2026-06-21' },
          { title: 'إعداد الفاتورة وتصديرها لشركة المقاولات العربية', assignedUserName: 'المحاسب المالي', dueDate: '2026-06-20' },
          { title: 'مراجعة واجهات لوحة التحكم مع المالك والإدارة', assignedUserName: 'مالك الشركة', dueDate: '2026-06-23' }
        ];
        proposedMeetings = [
          { title: 'اجتماع مراجعة لوحة التحكم الأسبوعي', date: '2026-07-02', time: '11:00 AM', duration: '60 دقيقة', attendees: 'مندوب المبيعات، مالك الشركة' }
        ];
      }
    } else if (isHR) {
      if (isEn) {
        transcript = 'Hello, we will discuss the pending leave requests for employees. Sarah needs approval for her sick leave request and attendance report before Tuesday. Also, Omar must prepare a training plan for new employees by next week. We will meet later to review the training plan.';
        summary = 'HR and operations meeting to review pending leave requests and set training plans for new staff.';
        proposedTasks = [
          { title: 'Approve Sarah\'s sick leave and export attendance report', assignedUserName: 'Staff Manager', dueDate: '2026-06-24' },
          { title: 'Prepare onboarding and training plan for new employees', assignedUserName: 'Omar Farooq', dueDate: '2026-06-28' }
        ];
        proposedMeetings = [
          { title: 'Review New Onboarding Plan Meeting', date: '2026-07-05', time: '02:00 PM', duration: '30 minutes', attendees: 'Omar Farooq, Staff Manager' }
        ];
      } else {
        transcript = 'مرحباً، سنناقش طلبات الإجازات المعلقة للموظفين. سارة تحتاج لاعتماد طلب إجازتها المرضية وإصدار تقرير الحضور قبل يوم الثلاثاء. كما يجب على عمر إعداد خطة تدريب للموظفين الجدد بحلول الأسبوع المقبل. وسنجتمع لاحقاً لمراجعة خطة التدريب.';
        summary = 'اجتماع شؤون الموظفين لمراجعة طلبات الإجازات المعلقة وإعداد خطط التهيئة والتدريب للموظفين الجدد.';
        proposedTasks = [
          { title: 'اعتماد طلب إجازة سارة المرضية وإصدار تقرير الحضور', assignedUserName: 'مدير الموظفين', dueDate: '2026-06-24' },
          { title: 'إعداد خطة تدريب وتهيئة للموظفين الجدد', assignedUserName: 'عمر فاروق', dueDate: '2026-06-28' }
        ];
        proposedMeetings = [
          { title: 'اجتماع مراجعة خطة تدريب الجدد', date: '2026-07-05', time: '02:00 PM', duration: '30 دقيقة', attendees: 'عمر فاروق، مدير الموظفين' }
        ];
      }
    } else {
      if (isEn) {
        transcript = 'Peace be upon you. We need to speed up the submission of the technical and financial proposal and set up a meeting with the Saudi client for discussion, final requirements gathering, and documenting the next meeting.';
        summary = 'Quick discussion to prepare for the Saudi client interview and finalize technical and financial proposals.';
        proposedTasks = [
          { title: 'Prepare technical and financial proposal for Saudi client', assignedUserName: 'Sales Manager', dueDate: '2026-06-22' },
          { title: 'Schedule final meeting and confirm attendance', assignedUserName: 'Company Owner', dueDate: '2026-06-23' }
        ];
        proposedMeetings = [
          { title: 'Saudi Client Pitch Meeting', date: '2026-06-29', time: '01:00 PM', duration: '45 minutes', attendees: 'Sales Manager, Company Owner' }
        ];
      } else {
        transcript = 'السلام عليكم. نحتاج لتسريع تسليم العرض الفني والمالي وتحديد موعد مع العميل السعودي للمناقشة وتحديد المتمتطلبات النهائية وتوثيق الاجتماع القادم.';
        summary = 'مناقشة سريعة للتحضير لمقابلة العميل السعودي وتجهيز العروض المالية والفنية لعرضها.';
        proposedTasks = [
          { title: 'تجهيز العرض الفني والمالي النهائي للعميل السعودي', assignedUserName: 'مدير المبيعات', dueDate: '2026-06-22' },
          { title: 'تحديد موعد المقابلة النهائية وتأكيد الحضور', assignedUserName: 'مالك الشركة', dueDate: '2026-06-23' }
        ];
        proposedMeetings = [
          { title: 'اجتماع العرض التقديمي للعميل السعودي', date: '2026-06-29', time: '01:00 PM', duration: '45 دقيقة', attendees: 'مدير المبيعات، مالك الشركة' }
        ];
      }
    }

    const transcriptChunks: TranscriptChunk[] = [
      { index: 0, startTime: '00:00', endTime: '00:15', text: transcript.substring(0, transcript.length / 3) },
      { index: 1, startTime: '00:15', endTime: '00:35', text: transcript.substring(transcript.length / 3, (2 * transcript.length) / 3) },
      { index: 2, startTime: '00:35', endTime: '00:55', text: transcript.substring((2 * transcript.length) / 3) }
    ];

    let reply = `🎤 **تفريغ وتحليل الاجتماع (وضع المحاكاة): ${fileName}**\n\n`;
    reply += `📝 **ملخص الاجتماع:** ${summary}\n\n`;
    reply += `تم تفريغ التسجيل بالكامل واستخراج المهام المطلوبة. يمكنك مراجعتها وتفصيلها في اللوحة الجانبية.`;

    return {
      assistantReply: reply,
      data: { transcript, summary, transcriptChunks, proposedTasks, proposedMeetings }
    };
  }

  async extractAudio(file: File): Promise<Blob> {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode audio data from video/audio file
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    // Downsample to 16000 Hz mono to minimize the WAV file size for Whisper speech-to-text
    const targetSampleRate = 16000;
    const numberOfChannels = 1;
    
    const offlineCtx = new OfflineAudioContext(
      numberOfChannels,
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    );
    
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    
    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferLength = result.length * 2;
    const wavBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(wavBuffer);
    
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, bufferLength, true);
    
    this.floatTo16BitPCM(view, 44, result);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  }

  private floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  private writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}
