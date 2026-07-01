import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { RecruitmentService } from '../../../services/recruitment.service';

export interface Candidate {
  id: number;
  name: string;
  appliedRole: string;
  rating: number;
  stage: 'applied' | 'interview' | 'test' | 'offer' | 'hired';
  jobVacancyId?: number;
  createdAt?: string;
}

export interface JobVacancy {
  id: number;
  title: string;
  department: string;
  applicantsCount: number;
  status: 'Open' | 'Closed';
}

@Component({
  selector: 'app-hr-recruitment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruitment.html',
  styleUrls: ['./recruitment.css']
})
export class HRRecruitment implements OnInit {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);
  private recruitmentService = inject(RecruitmentService);

  readonly stages = [
    { key: 'applied',   nameAr: 'المتقدمون',      nameEn: 'Applied',      color: '#8b5cf6' },
    { key: 'interview', nameAr: 'المقابلة',        nameEn: 'Interviewing', color: '#3b82f6' },
    { key: 'test',      nameAr: 'التقييم الفني',   nameEn: 'Tech Test',    color: '#f59e0b' },
    { key: 'offer',     nameAr: 'عرض عمل',         nameEn: 'Offer',        color: '#eab308' },
    { key: 'hired',     nameAr: 'تم التعيين',      nameEn: 'Hired',        color: '#10b981' }
  ];

  candidates   = signal<Candidate[]>([]);
  vacancies    = signal<JobVacancy[]>([]);
  isLoading    = signal(true);

  // Filters
  searchQuery        = signal('');
  selectedDepartment = signal('all');

  // Star rating hover: { candidateId, hoveredStar }
  ratingHover = signal<{ id: number; star: number } | null>(null);

  // Modals
  showJobModal       = signal(false);
  showCandidateModal = signal(false);
  isSubmitting       = signal(false);

  // Add-job form
  newJobTitle = '';
  newJobDept  = '';

  // Add-candidate form
  newCandidateName  = '';
  newCandidateRole  = '';
  newCandidateStage: Candidate['stage'] = 'applied';
  newCandidateRating = 5;

  // ── Computed ──

  departments = computed(() => {
    const depts = new Set<string>();
    this.vacancies().forEach(j => depts.add(j.department));
    return Array.from(depts);
  });

  totalApplicants   = computed(() => this.candidates().length);
  openVacanciesCount = computed(() => this.vacancies().filter(v => v.status === 'Open').length);
  inInterviewCount  = computed(() => this.candidates().filter(c => c.stage === 'interview' || c.stage === 'test').length);
  hiredCount        = computed(() => this.candidates().filter(c => c.stage === 'hired').length);

  hasOpenVacancies = computed(() => this.vacancies().some(v => v.status === 'Open'));

  filteredVacancies = computed(() => {
    const dept = this.selectedDepartment();
    return this.vacancies().filter(v => dept === 'all' || v.department === dept);
  });

  filteredCandidates = computed(() => {
    const q    = this.searchQuery().trim().toLowerCase();
    const dept = this.selectedDepartment();

    // Roles that belong to the selected department (derived from vacancies)
    const deptRoles = dept === 'all'
      ? null
      : new Set(this.vacancies().filter(v => v.department === dept).map(v => v.title.toLowerCase()));

    return this.candidates().filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.appliedRole.toLowerCase().includes(q);
      const matchDept   = !deptRoles || deptRoles.has(c.appliedRole.toLowerCase());
      return matchSearch && matchDept;
    });
  });

  // ── Lifecycle ──

  ngOnInit() { this.loadData(); }

  loadData() {
    this.isLoading.set(true);
    let vacanciesDone = false, candidatesDone = false;
    const checkDone = () => { if (vacanciesDone && candidatesDone) this.isLoading.set(false); };

    this.recruitmentService.getVacancies().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.vacancies.set(res.data.map((j: any) => ({
            id: j.id, title: j.title, department: j.department,
            applicantsCount: j.applicantsCount, status: j.status
          })));
        }
        vacanciesDone = true; checkDone();
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل قائمة الوظائف' : 'Failed to load vacancies'
        );
        vacanciesDone = true; checkDone();
      }
    });

    this.recruitmentService.getCandidates().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.candidates.set(res.data.map((c: any) => ({
            id: c.id, name: c.name, appliedRole: c.appliedRole,
            rating: c.rating, stage: c.stage.toLowerCase() as Candidate['stage'],
            jobVacancyId: c.jobVacancyId, createdAt: c.createdAt
          })));
        }
        candidatesDone = true; checkDone();
      },
      error: () => {
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحميل قائمة المرشحين' : 'Failed to load candidates'
        );
        candidatesDone = true; checkDone();
      }
    });
  }

  getCandidatesByStage(stageKey: string): Candidate[] {
    return this.filteredCandidates().filter(c => c.stage === stageKey);
  }

  // ── Stage navigation ──

  moveCandidate(candidateId: number, direction: 'forward' | 'backward') {
    const stageOrder: Candidate['stage'][] = ['applied', 'interview', 'test', 'offer', 'hired'];
    const cand = this.candidates().find(c => c.id === candidateId);
    if (!cand) return;

    const idx = stageOrder.indexOf(cand.stage);
    const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= stageOrder.length) return;

    const nextStage = stageOrder[newIdx];
    this.recruitmentService.moveCandidate(candidateId, nextStage).subscribe({
      next: (res) => {
        if (res?.success) {
          this.candidates.update(list =>
            list.map(c => c.id === candidateId ? { ...c, stage: nextStage } : c)
          );
          const stageName = this.stages.find(s => s.key === nextStage);
          const label = this.i18n.isRtl() ? stageName?.nameAr : stageName?.nameEn;
          this.toastService.info(
            this.i18n.isRtl()
              ? `تم نقل "${cand.name}" إلى [${label}]`
              : `"${cand.name}" moved to [${label}]`,
            this.i18n.isRtl() ? 'بوابة التوظيف' : 'Recruitment'
          );
        }
      },
      error: () => this.toastService.error(
        this.i18n.isRtl() ? 'فشل نقل المرشح' : 'Failed to move candidate'
      )
    });
  }

  // ── Star rating ──

  setRating(candidateId: number, rating: number) {
    const cand = this.candidates().find(c => c.id === candidateId);
    if (!cand || cand.rating === rating) return;

    this.candidates.update(list =>
      list.map(c => c.id === candidateId ? { ...c, rating } : c)
    );

    this.recruitmentService.updateCandidate(candidateId, { rating }).subscribe({
      next: (res) => {
        if (!res?.success) {
          // revert optimistic update
          this.candidates.update(list =>
            list.map(c => c.id === candidateId ? { ...c, rating: cand.rating } : c)
          );
        }
      },
      error: () => {
        this.candidates.update(list =>
          list.map(c => c.id === candidateId ? { ...c, rating: cand.rating } : c)
        );
        this.toastService.error(
          this.i18n.isRtl() ? 'فشل تحديث التقييم' : 'Failed to update rating'
        );
      }
    });
  }

  getEffectiveStar(cand: Candidate, star: number): boolean {
    const hover = this.ratingHover();
    if (hover && hover.id === cand.id) return star <= hover.star;
    return star <= cand.rating;
  }

  // ── Add Vacancy ──

  openJobModal() {
    this.newJobTitle = '';
    this.newJobDept  = this.departments()[0] || 'القسم التقني';
    this.showJobModal.set(true);
  }

  closeJobModal() { this.showJobModal.set(false); }

  saveJob() {
    if (!this.newJobTitle.trim() || !this.newJobDept.trim()) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'الرجاء إدخال المسمى الوظيفي والقسم' : 'Please enter Job Title and Department'
      );
      return;
    }
    this.isSubmitting.set(true);
    this.recruitmentService.createVacancy({ title: this.newJobTitle, department: this.newJobDept }).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toastService.success(
            this.i18n.isRtl()
              ? `تم إضافة الوظيفة "${this.newJobTitle}" بنجاح`
              : `Job "${this.newJobTitle}" added`,
            this.i18n.isRtl() ? 'الوظائف' : 'Vacancies'
          );
          this.loadData();
          this.closeJobModal();
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || (this.i18n.isRtl() ? 'فشل إضافة الوظيفة' : 'Failed to add job'));
        this.isSubmitting.set(false);
      }
    });
  }

  toggleJobStatus(jobId: number) {
    this.recruitmentService.toggleVacancyStatus(jobId).subscribe({
      next: (res) => {
        if (res?.success) {
          this.vacancies.update(list =>
            list.map(v => v.id === jobId ? { ...v, status: v.status === 'Open' ? 'Closed' : 'Open' } as JobVacancy : v)
          );
          this.toastService.success(
            this.i18n.isRtl() ? 'تم تحديث حالة الوظيفة' : 'Job status updated'
          );
        }
      },
      error: () => this.toastService.error(this.i18n.isRtl() ? 'فشل تحديث الحالة' : 'Failed to update status')
    });
  }

  deleteJob(jobId: number, event: Event) {
    event.stopPropagation();
    const job = this.vacancies().find(v => v.id === jobId);
    const msg = this.i18n.isRtl()
      ? `هل أنت متأكد من حذف وظيفة "${job?.title}"؟`
      : `Delete vacancy "${job?.title}"?`;
    if (!confirm(msg)) return;

    this.recruitmentService.deleteVacancy(jobId).subscribe({
      next: (res) => {
        if (res?.success) {
          this.vacancies.update(list => list.filter(v => v.id !== jobId));
          this.toastService.success(
            this.i18n.isRtl() ? 'تم حذف الوظيفة بنجاح' : 'Vacancy deleted'
          );
        }
      },
      error: () => this.toastService.error(this.i18n.isRtl() ? 'فشل حذف الوظيفة' : 'Failed to delete')
    });
  }

  // ── Add Candidate ──

  openCandidateModal() {
    this.newCandidateName   = '';
    this.newCandidateRole   = this.vacancies().find(v => v.status === 'Open')?.title || '';
    this.newCandidateStage  = 'applied';
    this.newCandidateRating = 5;
    this.showCandidateModal.set(true);
  }

  closeCandidateModal() { this.showCandidateModal.set(false); }

  saveCandidate() {
    if (!this.newCandidateName.trim() || !this.newCandidateRole.trim()) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'الرجاء إدخال اسم المتقدم والوظيفة' : 'Please enter Candidate Name and Role'
      );
      return;
    }
    const matchedVacancy = this.vacancies().find(v => v.title === this.newCandidateRole);
    this.isSubmitting.set(true);
    this.recruitmentService.createCandidate({
      name: this.newCandidateName,
      appliedRole: this.newCandidateRole,
      rating: Number(this.newCandidateRating),
      stage: this.newCandidateStage,
      jobVacancyId: matchedVacancy?.id
    }).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toastService.success(
            this.i18n.isRtl()
              ? `تم إضافة المرشح "${this.newCandidateName}" بنجاح`
              : `Candidate "${this.newCandidateName}" added`,
            this.i18n.isRtl() ? 'المتقدمون' : 'Candidates'
          );
          this.loadData();
          this.closeCandidateModal();
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || (this.i18n.isRtl() ? 'فشل إضافة المرشح' : 'Failed to add candidate'));
        this.isSubmitting.set(false);
      }
    });
  }

  deleteCandidate(candidateId: number, event: Event) {
    event.stopPropagation();
    const cand = this.candidates().find(c => c.id === candidateId);
    const msg = this.i18n.isRtl()
      ? `هل أنت متأكد من استبعاد "${cand?.name}"؟`
      : `Reject candidate "${cand?.name}"?`;
    if (!confirm(msg)) return;

    this.recruitmentService.deleteCandidate(candidateId).subscribe({
      next: (res) => {
        if (res?.success) {
          this.candidates.update(list => list.filter(c => c.id !== candidateId));
          this.toastService.success(
            this.i18n.isRtl() ? `تم استبعاد "${cand?.name}"` : `"${cand?.name}" rejected`,
            this.i18n.isRtl() ? 'استبعاد' : 'Rejected'
          );
        }
      },
      error: () => this.toastService.error(this.i18n.isRtl() ? 'فشل حذف المرشح' : 'Failed to delete')
    });
  }

  getInitials(name: string): string {
    if (!name) return 'ر';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
}
