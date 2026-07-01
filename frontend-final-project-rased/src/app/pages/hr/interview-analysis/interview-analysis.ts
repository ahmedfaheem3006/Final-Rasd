import { Component, signal, inject, ViewChild, ElementRef, AfterViewChecked, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../services/ai.service';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  safeHtml?: SafeHtml;
  time?: string;
}

interface InterviewResult {
  transcript: string;
  candidateName: string;
  jobRole: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Accept' | 'Consider' | 'Reject';
  recommendationExplanation: string;
  overallScore: number;
  isDemo: boolean;
}

@Component({
  selector: 'app-hr-interview-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview-analysis.html',
  styleUrl: './interview-analysis.css'
})
export class HRInterviewAnalysis implements AfterViewChecked {
  private aiService  = inject(AiService);
  public  i18n       = inject(I18nService);
  private auth       = inject(AuthService);
  private toast      = inject(ToastService);
  private sanitizer  = inject(DomSanitizer);

  @ViewChild('chatBottom') private chatBottom!: ElementRef;

  currentUser = this.auth.currentUser;

  // ── Upload form ──────────────────────────────────────────────
  candidateName = '';
  jobRole       = '';
  language      = computed(() => this.i18n.isRtl() ? 'ar' : 'en');
  uploadedFile  = signal<File | null>(null);
  fileName      = signal<string | null>(null);
  isDragging    = signal(false);

  // ── State ────────────────────────────────────────────────────
  phase = signal<'upload' | 'analyzing' | 'result'>('upload');
  analysisResult = signal<InterviewResult | null>(null);
  showFullTranscript = signal(false);
  showLimitModal     = signal(false);
  limitModalMessage  = signal('');

  // ── Chat ─────────────────────────────────────────────────────
  messages   = signal<ChatMessage[]>([]);
  chatInput  = '';
  isTyping   = signal(false);
  private shouldScroll = false;

  suggestions = computed(() => this.i18n.isRtl()
    ? ['ما هي أبرز نقاط القوة في هذا المرشح؟',
       'هل المرشح مناسب لهذه الوظيفة؟',
       'ما التوصية النهائية لهذا المرشح؟',
       'ما مستوى تواصل المرشح خلال المقابلة؟',
       'هل أظهر المرشح حماساً كافياً للوظيفة؟']
    : ['What are this candidate\'s top strengths?',
       'Is this candidate suitable for the role?',
       'What is the final recommendation for this candidate?',
       'How was the candidate\'s communication during the interview?',
       'Did the candidate show enough enthusiasm for the role?']
  );

  // ── File handling ─────────────────────────────────────────────
  triggerFileInput() {
    document.getElementById('interviewFileInput')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.setFile(input.files[0]);
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging.set(true); }
  onDragLeave()            { this.isDragging.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File) {
    this.uploadedFile.set(file);
    this.fileName.set(file.name);
  }

  // ── Analysis ──────────────────────────────────────────────────
  canAnalyze = computed(() =>
    this.uploadedFile() !== null &&
    this.candidateName.trim().length > 0 &&
    this.jobRole.trim().length > 0
  );

  startAnalysis() {
    const file = this.uploadedFile();
    if (!file || !this.candidateName.trim() || !this.jobRole.trim()) return;

    this.phase.set('analyzing');
    this.messages.set([]);

    this.aiService.analyzeInterview(
      file, this.candidateName.trim(), this.jobRole.trim(), this.language()
    ).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.analysisResult.set(res.data as InterviewResult);
          this.phase.set('result');
          this.pushWelcomeMessage();
          if (res.data.isDemo) {
            this.toast.warning(
              this.i18n.isRtl() ? 'يعمل النظام في وضع العرض' : 'Running in demo mode'
            );
          }
        }
      },
      error: (err) => {
        this.phase.set('upload');
        const msg = err?.error?.message;
        if (msg) { this.limitModalMessage.set(msg); this.showLimitModal.set(true); }
        else this.toast.error(
          this.i18n.isRtl() ? 'فشل تحليل المقابلة. تأكد من أن الخادم يعمل.' : 'Interview analysis failed. Check that the server is running.'
        );
      }
    });
  }

  resetAnalysis() {
    this.phase.set('upload');
    this.analysisResult.set(null);
    this.uploadedFile.set(null);
    this.fileName.set(null);
    this.messages.set([]);
    this.showFullTranscript.set(false);
  }

  // ── Chat ──────────────────────────────────────────────────────
  private pushWelcomeMessage() {
    const r = this.analysisResult();
    if (!r) return;
    const isAr = this.i18n.isRtl();
    const text = isAr
      ? `تم تحليل مقابلة **${r.candidateName}** لوظيفة **${r.jobRole}** بنجاح! 🎯\n\nالنتيجة الإجمالية: **${r.overallScore}/100** | التوصية: **${this.recommendationLabel(r.recommendation)}**\n\nيمكنك الآن سؤالي عن أي جانب من المقابلة أو المرشح.`
      : `Interview for **${r.candidateName}** applying as **${r.jobRole}** analyzed! 🎯\n\nOverall Score: **${r.overallScore}/100** | Recommendation: **${this.recommendationLabel(r.recommendation)}**\n\nYou can now ask me anything about the interview or the candidate.`;
    this.messages.set([{ role: 'assistant', text, safeHtml: this.md(text), time: this.now() }]);
    this.shouldScroll = true;
  }

  sendMessage(text?: string) {
    const q = text ?? this.chatInput.trim();
    if (!q) return;

    const r = this.analysisResult();
    if (!r) return;

    if (!text) this.chatInput = '';
    const timeStr = this.now();
    this.messages.update(m => [...m, { role: 'user', text: q, safeHtml: this.md(q), time: timeStr }]);
    this.isTyping.set(true);
    this.shouldScroll = true;

    this.aiService.chatAboutInterview(
      q, r.transcript, r.candidateName, r.jobRole, this.language()
    ).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const reply = res?.data?.response || res?.response
          || (this.i18n.isRtl() ? 'عذراً، لم أتمكن من معالجة طلبك.' : 'Sorry, could not process your request.');
        this.messages.update(m => [...m, { role: 'assistant', text: reply, safeHtml: this.md(reply), time: timeStr }]);
        this.shouldScroll = true;
      },
      error: (err) => {
        this.isTyping.set(false);
        const msg = err?.error?.message;
        if (msg) { this.limitModalMessage.set(msg); this.showLimitModal.set(true); }
        else {
          const reply = this.i18n.isRtl()
            ? 'تعذّر الاتصال بالخادم. يرجى التأكد من أن الخادم يعمل.'
            : 'Could not reach the server. Please make sure the API is running.';
          this.messages.update(m => [...m, { role: 'assistant', text: reply, safeHtml: this.md(reply), time: timeStr }]);
        }
        this.shouldScroll = true;
      }
    });
  }

  selectSuggestion(s: string) { this.sendMessage(s); }
  closeLimitModal()           { this.showLimitModal.set(false); }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      try { this.chatBottom.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
      this.shouldScroll = false;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  recommendationLabel(r: string): string {
    const isAr = this.i18n.isRtl();
    if (r === 'Accept')  return isAr ? 'قبول' : 'Accept';
    if (r === 'Reject')  return isAr ? 'رفض'  : 'Reject';
    return isAr ? 'إعادة النظر' : 'Consider';
  }

  scoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  scoreGradient(score: number): string {
    const c = this.scoreColor(score);
    return `conic-gradient(${c} 0% ${score}%, #374151 ${score}% 100%)`;
  }

  private md(text: string): SafeHtml {
    try { return this.sanitizer.bypassSecurityTrustHtml(marked.parse(text) as string); }
    catch {
      return this.sanitizer.bypassSecurityTrustHtml(
        text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      );
    }
  }

  private now(): string {
    return new Date().toLocaleTimeString(this.i18n.isRtl() ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
