import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';

export interface Candidate {
  id: number;
  name: string;
  appliedRole: string;
  rating: number;
  stage: 'applied' | 'interview' | 'test' | 'offer' | 'hired';
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
export class HRRecruitment {
  public i18n = inject(I18nService);
  private toastService = inject(ToastService);

  stages = [
    { key: 'applied', nameAr: 'المتقدمون', nameEn: 'Applied', color: '#8b5cf6' },
    { key: 'interview', nameAr: 'المقابلة', nameEn: 'Interviewing', color: '#3b82f6' },
    { key: 'test', nameAr: 'التقييم الفني', nameEn: 'Tech Test', color: '#f59e0b' },
    { key: 'offer', nameAr: 'عرض عمل', nameEn: 'Offer', color: '#eab308' },
    { key: 'hired', nameAr: 'تم التعيين', nameEn: 'Hired', color: '#10b981' }
  ];

  candidates = signal<Candidate[]>([
    { id: 1, name: 'أحمد الدوسري', appliedRole: 'Senior .NET Developer', rating: 4, stage: 'applied' },
    { id: 2, name: 'سارة خالد', appliedRole: 'UI/UX Designer', rating: 5, stage: 'interview' },
    { id: 3, name: 'سلطان العتيبي', appliedRole: 'Frontend Dev (Angular)', rating: 3, stage: 'test' },
    { id: 4, name: 'مريم علي', appliedRole: 'HR Generalist', rating: 4, stage: 'offer' },
    { id: 5, name: 'عبدالله السعدون', appliedRole: 'DevOps Engineer', rating: 5, stage: 'hired' },
    { id: 6, name: 'خالد الفهد', appliedRole: 'Senior .NET Developer', rating: 5, stage: 'interview' },
    { id: 7, name: 'منى العبدالله', appliedRole: 'UI/UX Designer', rating: 4, stage: 'applied' },
    { id: 8, name: 'فيصل النعيم', appliedRole: 'Frontend Dev (Angular)', rating: 4, stage: 'offer' }
  ]);

  vacancies = signal<JobVacancy[]>([
    { id: 1, title: 'Senior Angular Developer', department: 'القسم التقني', applicantsCount: 14, status: 'Open' },
    { id: 2, title: 'UI/UX Designer', department: 'التصميم والهوية', applicantsCount: 8, status: 'Open' },
    { id: 3, title: 'Sales Executive', department: 'إدارة المبيعات', applicantsCount: 22, status: 'Closed' },
    { id: 4, title: 'Senior .NET Developer', department: 'القسم التقني', applicantsCount: 19, status: 'Open' },
    { id: 5, title: 'HR Generalist', department: 'الموارد البشرية', applicantsCount: 5, status: 'Open' }
  ]);

  // Filters & Search
  searchQuery = signal('');
  selectedDepartment = signal('all');

  // Modals state
  showJobModal = signal(false);
  showCandidateModal = signal(false);

  // Form Fields
  newJobTitle = '';
  newJobDept = '';
  
  newCandidateName = '';
  newCandidateRole = '';
  newCandidateStage: 'applied' | 'interview' | 'test' | 'offer' | 'hired' = 'applied';
  newCandidateRating = 5;

  // Departments List
  departments = computed(() => {
    const depts = new Set<string>();
    this.vacancies().forEach(j => depts.add(j.department));
    return Array.from(depts);
  });

  // Top Metrics
  totalApplicants = computed(() => this.candidates().length);
  openVacanciesCount = computed(() => this.vacancies().filter(v => v.status === 'Open').length);
  inInterviewCount = computed(() => this.candidates().filter(c => c.stage === 'interview' || c.stage === 'test').length);
  hiredCount = computed(() => this.candidates().filter(c => c.stage === 'hired').length);

  // Filters
  filteredCandidates = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.candidates().filter(c => {
      const matchQuery = !q || c.name.toLowerCase().includes(q) || c.appliedRole.toLowerCase().includes(q);
      return matchQuery;
    });
  });

  filteredVacancies = computed(() => {
    const dept = this.selectedDepartment();
    return this.vacancies().filter(v => dept === 'all' || v.department === dept);
  });

  getCandidatesByStage(stageKey: string) {
    return this.filteredCandidates().filter(c => c.stage === stageKey);
  }

  moveCandidate(candidateId: number, direction: 'forward' | 'backward') {
    const stageOrder: ('applied' | 'interview' | 'test' | 'offer' | 'hired')[] = ['applied', 'interview', 'test', 'offer', 'hired'];
    let candidateName = '';
    let targetStageName = '';

    this.candidates.update(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const currentIndex = stageOrder.indexOf(c.stage);
          let newIndex = currentIndex;
          if (direction === 'forward' && currentIndex < stageOrder.length - 1) {
            newIndex++;
          } else if (direction === 'backward' && currentIndex > 0) {
            newIndex--;
          }
          candidateName = c.name;
          const nextStage = stageOrder[newIndex];
          const matchedStage = this.stages.find(s => s.key === nextStage);
          targetStageName = this.i18n.isRtl() ? matchedStage?.nameAr || '' : matchedStage?.nameEn || '';
          return { ...c, stage: nextStage };
        }
        return c;
      })
    );

    if (candidateName) {
      const msg = this.i18n.isRtl()
        ? `تم نقل المرشح "${candidateName}" بنجاح إلى مرحلة [${targetStageName}]`
        : `Candidate "${candidateName}" moved to [${targetStageName}]`;
      this.toastService.info(msg, this.i18n.isRtl() ? 'بوابة التوظيف' : 'Recruitment Portal');
    }
  }

  // Add Job Vacancy
  openJobModal() {
    this.newJobTitle = '';
    this.newJobDept = this.departments()[0] || '';
    this.showJobModal.set(true);
  }

  closeJobModal() {
    this.showJobModal.set(false);
  }

  saveJob() {
    if (!this.newJobTitle || !this.newJobDept) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'الرجاء إدخال المسمى الوظيفي والقسم' : 'Please enter Job Title and Department'
      );
      return;
    }

    const newJob: JobVacancy = {
      id: Date.now(),
      title: this.newJobTitle,
      department: this.newJobDept,
      applicantsCount: 0,
      status: 'Open'
    };

    this.vacancies.update(prev => [...prev, newJob]);
    this.toastService.success(
      this.i18n.isRtl() ? `تم إضافة الوظيفة "${this.newJobTitle}" بنجاح` : `Job "${this.newJobTitle}" added successfully`,
      this.i18n.isRtl() ? 'الوظائف' : 'Vacancies'
    );
    this.closeJobModal();
  }

  toggleJobStatus(jobId: number) {
    this.vacancies.update(prev =>
      prev.map(j => (j.id === jobId ? { ...j, status: j.status === 'Open' ? 'Closed' : 'Open' } : j))
    );
    this.toastService.success(
      this.i18n.isRtl() ? 'تم تحديث حالة الوظيفة بنجاح' : 'Job status updated successfully',
      this.i18n.isRtl() ? 'حالة الوظيفة' : 'Job Status'
    );
  }

  deleteJob(jobId: number, event: Event) {
    event.stopPropagation();
    const confirmMsg = this.i18n.isRtl() ? 'هل أنت متأكد من حذف هذه الوظيفة؟' : 'Are you sure you want to delete this job vacancy?';
    if (confirm(confirmMsg)) {
      this.vacancies.update(prev => prev.filter(j => j.id !== jobId));
      this.toastService.success(
        this.i18n.isRtl() ? 'تم حذف الوظيفة بنجاح' : 'Job vacancy deleted successfully',
        this.i18n.isRtl() ? 'حذف وظيفة' : 'Delete Job'
      );
    }
  }

  // Add Candidate
  openCandidateModal() {
    this.newCandidateName = '';
    this.newCandidateRole = this.vacancies().filter(v => v.status === 'Open')[0]?.title || '';
    this.newCandidateStage = 'applied';
    this.newCandidateRating = 5;
    this.showCandidateModal.set(true);
  }

  closeCandidateModal() {
    this.showCandidateModal.set(false);
  }

  saveCandidate() {
    if (!this.newCandidateName || !this.newCandidateRole) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'الرجاء إدخال اسم المتقدم والوظيفة' : 'Please enter Candidate Name and Role'
      );
      return;
    }

    const newCand: Candidate = {
      id: Date.now(),
      name: this.newCandidateName,
      appliedRole: this.newCandidateRole,
      rating: this.newCandidateRating,
      stage: this.newCandidateStage
    };

    this.candidates.update(prev => [newCand, ...prev]);

    // Increment applicants count for matching job
    this.vacancies.update(prev =>
      prev.map(j => (j.title.toLowerCase() === this.newCandidateRole.toLowerCase() ? { ...j, applicantsCount: j.applicantsCount + 1 } : j))
    );

    this.toastService.success(
      this.i18n.isRtl() ? `تم إضافة المتقدم "${this.newCandidateName}" بنجاح` : `Candidate "${this.newCandidateName}" added successfully`,
      this.i18n.isRtl() ? 'المتقدمون' : 'Candidates'
    );
    this.closeCandidateModal();
  }

  deleteCandidate(candidateId: number, event: Event) {
    event.stopPropagation();
    const confirmMsg = this.i18n.isRtl() ? 'هل أنت متأكد من استبعاد هذا المرشح؟' : 'Are you sure you want to reject this candidate?';
    if (confirm(confirmMsg)) {
      let candidateName = '';
      const candidateObj = this.candidates().find(c => c.id === candidateId);
      if (candidateObj) candidateName = candidateObj.name;

      this.candidates.update(prev => prev.filter(c => c.id !== candidateId));
      this.toastService.success(
        this.i18n.isRtl() ? `تم استبعاد المرشح "${candidateName}"` : `Candidate "${candidateName}" has been rejected`,
        this.i18n.isRtl() ? 'استبعاد مرشح' : 'Reject Candidate'
      );
    }
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
