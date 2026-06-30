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

  stages = [
    { key: 'applied', nameAr: 'المتقدمون', nameEn: 'Applied', color: '#8b5cf6' },
    { key: 'interview', nameAr: 'المقابلة', nameEn: 'Interviewing', color: '#3b82f6' },
    { key: 'test', nameAr: 'التقييم الفني', nameEn: 'Tech Test', color: '#f59e0b' },
    { key: 'offer', nameAr: 'عرض عمل', nameEn: 'Offer', color: '#eab308' },
    { key: 'hired', nameAr: 'تم التعيين', nameEn: 'Hired', color: '#10b981' }
  ];

  candidates = signal<Candidate[]>([]);
  vacancies = signal<JobVacancy[]>([]);

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

  hasOpenVacancies = computed(() => {
    return this.vacancies().some(v => v.status === 'Open');
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    console.log('loadData called');
    // Load job vacancies
    this.recruitmentService.getVacancies().subscribe({
      next: (res) => {
        console.log('getVacancies response:', res);
        if (res && res.success && res.data) {
          const mapped = res.data.map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department,
            applicantsCount: j.applicantsCount,
            status: j.status
          }));
          console.log('Mapped vacancies:', mapped);
          this.vacancies.set(mapped);
        }
      },
      error: (err) => console.error('Failed to load vacancies', err)
    });

    // Load candidates
    this.recruitmentService.getCandidates().subscribe({
      next: (res) => {
        console.log('getCandidates response:', res);
        if (res && res.success && res.data) {
          const mapped = res.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            appliedRole: c.appliedRole,
            rating: c.rating,
            stage: c.stage.toLowerCase(),
            jobVacancyId: c.jobVacancyId,
            createdAt: c.createdAt
          }));
          console.log('Mapped candidates:', mapped);
          this.candidates.set(mapped);
        }
      },
      error: (err) => console.error('Failed to load candidates', err)
    });
  }

  getCandidatesByStage(stageKey: string) {
    return this.filteredCandidates().filter(c => c.stage === stageKey);
  }

  moveCandidate(candidateId: number, direction: 'forward' | 'backward') {
    const stageOrder: ('applied' | 'interview' | 'test' | 'offer' | 'hired')[] = ['applied', 'interview', 'test', 'offer', 'hired'];
    const candidateObj = this.candidates().find(c => c.id === candidateId);
    if (!candidateObj) return;

    const currentIndex = stageOrder.indexOf(candidateObj.stage as any);
    let newIndex = currentIndex;
    if (direction === 'forward' && currentIndex < stageOrder.length - 1) {
      newIndex++;
    } else if (direction === 'backward' && currentIndex > 0) {
      newIndex--;
    }

    const nextStage = stageOrder[newIndex];

    this.recruitmentService.moveCandidate(candidateId, nextStage).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.loadData();
          const matchedStage = this.stages.find(s => s.key === nextStage);
          const targetStageName = this.i18n.isRtl() ? matchedStage?.nameAr || '' : matchedStage?.nameEn || '';
          const msg = this.i18n.isRtl()
            ? `تم نقل المرشح "${candidateObj.name}" بنجاح إلى مرحلة [${targetStageName}]`
            : `Candidate "${candidateObj.name}" moved to [${targetStageName}]`;
          this.toastService.info(msg, this.i18n.isRtl() ? 'بوابة التوظيف' : 'Recruitment Portal');
        }
      }
    });
  }

  // Add Job Vacancy
  openJobModal() {
    this.newJobTitle = '';
    this.newJobDept = this.departments()[0] || 'القسم التقني';
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

    const dto = {
      title: this.newJobTitle,
      department: this.newJobDept
    };

    this.recruitmentService.createVacancy(dto).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(
            this.i18n.isRtl() ? `تم إضافة الوظيفة "${this.newJobTitle}" بنجاح` : `Job "${this.newJobTitle}" added successfully`,
            this.i18n.isRtl() ? 'الوظائف' : 'Vacancies'
          );
          this.loadData();
          this.closeJobModal();
        }
      }
    });
  }

  toggleJobStatus(jobId: number) {
    this.recruitmentService.toggleVacancyStatus(jobId).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(
            this.i18n.isRtl() ? 'تم تحديث حالة الوظيفة بنجاح' : 'Job status updated successfully',
            this.i18n.isRtl() ? 'حالة الوظيفة' : 'Job Status'
          );
          this.loadData();
        }
      }
    });
  }

  deleteJob(jobId: number, event: Event) {
    event.stopPropagation();
    const confirmMsg = this.i18n.isRtl() ? 'هل أنت متأكد من حذف هذه الوظيفة؟' : 'Are you sure you want to delete this job vacancy?';
    if (confirm(confirmMsg)) {
      this.recruitmentService.deleteVacancy(jobId).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.toastService.success(
              this.i18n.isRtl() ? 'تم حذف الوظيفة بنجاح' : 'Job vacancy deleted successfully',
              this.i18n.isRtl() ? 'حذف وظيفة' : 'Delete Job'
            );
            this.loadData();
          }
        }
      });
    }
  }

  // Add Candidate
  openCandidateModal() {
    console.log('openCandidateModal called! vacancies:', this.vacancies());
    this.newCandidateName = '';
    const openJobs = this.vacancies().filter(v => v.status === 'Open');
    console.log('openCandidateModal - openJobs found:', openJobs);
    this.newCandidateRole = openJobs[0]?.title || '';
    this.newCandidateStage = 'applied';
    this.newCandidateRating = 5;
    this.showCandidateModal.set(true);
    console.log('openCandidateModal - showCandidateModal set to true:', this.showCandidateModal());
  }

  closeCandidateModal() {
    console.log('closeCandidateModal called');
    this.showCandidateModal.set(false);
  }

  saveCandidate() {
    console.log('saveCandidate called! Name:', this.newCandidateName, 'Role:', this.newCandidateRole, 'Rating:', this.newCandidateRating, 'Stage:', this.newCandidateStage);
    if (!this.newCandidateName || !this.newCandidateRole) {
      this.toastService.warning(
        this.i18n.isRtl() ? 'الرجاء إدخال اسم المتقدم والوظيفة' : 'Please enter Candidate Name and Role'
      );
      return;
    }

    const matchedVacancy = this.vacancies().find(v => v.title === this.newCandidateRole);

    const dto = {
      name: this.newCandidateName,
      appliedRole: this.newCandidateRole,
      rating: Number(this.newCandidateRating),
      stage: this.newCandidateStage,
      jobVacancyId: matchedVacancy?.id
    };

    this.recruitmentService.createCandidate(dto).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success(
            this.i18n.isRtl() ? `تم إضافة المتقدم "${this.newCandidateName}" بنجاح` : `Candidate "${this.newCandidateName}" added successfully`,
            this.i18n.isRtl() ? 'المتقدمون' : 'Candidates'
          );
          this.loadData();
          this.closeCandidateModal();
        }
      },
      error: (err) => {
        this.toastService.error(
          this.i18n.isRtl() ? 'حدث خطأ أثناء إضافة المتقدم' : 'Failed to add candidate'
        );
      }
    });
  }

  deleteCandidate(candidateId: number, event: Event) {
    event.stopPropagation();
    const confirmMsg = this.i18n.isRtl() ? 'هل أنت متأكد من استبعاد هذا المرشح؟' : 'Are you sure you want to reject this candidate?';
    if (confirm(confirmMsg)) {
      const candidateObj = this.candidates().find(c => c.id === candidateId);
      const name = candidateObj?.name || '';
      
      this.recruitmentService.deleteCandidate(candidateId).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.toastService.success(
              this.i18n.isRtl() ? `تم استبعاد المرشح "${name}"` : `Candidate "${name}" has been rejected`,
              this.i18n.isRtl() ? 'استبعاد مرشح' : 'Reject Candidate'
            );
            this.loadData();
          }
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'ر';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
