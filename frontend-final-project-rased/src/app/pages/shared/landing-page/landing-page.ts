import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../../../services/i18n.service';
import { ThemeService } from '../../../services/theme.service';

import { TypewriterDirective } from './directives/typewriter.directive';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, TypewriterDirective],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  encapsulation: ViewEncapsulation.None
})
export class LandingPage implements OnInit, OnDestroy, AfterViewInit {
  i18n = inject(I18nService);
  themeService = inject(ThemeService);
  http = inject(HttpClient);

  isHeaderScrolled = signal(false);
  activeFaqIndex = signal<number | null>(null);
  // Show back‑to‑top button after scrolling down
  showBackToTop = signal<boolean>(false);

  // FAQ data – 12 enterprise‑grade items
  faqs = [
    {
      icon: 'fa-solid fa-question-circle',
      qAr: 'ما هو Rasd؟',
      qEn: 'What is Rasd?',
      aAr: 'Rasd هو نظام تشغيل أعمال مدعوم بالذكاء الاصطناعي يدمج CRM، HR، المالية، إدارة المشاريع، التحليلات، والمزيد في لوحة تحكم موحدة، ما يتيح للشركات توحيد عملياتها وزيادة الكفاءة.',
      aEn: 'Rasd is an AI‑powered business operating system that unifies CRM, HR, Finance, Project Management, Analytics, and more into a single dashboard, enabling companies to streamline operations and boost efficiency.'
    },
    {
      icon: 'fa-solid fa-users',
      qAr: 'من هو المستهدف من Rasd؟',
      qEn: 'Who is Rasd for?',
      aAr: 'Rasd موجه إلى الشركات المتوسطة والكبيرة التي تحتاج إلى منصة مركزية لإدارة فرق المبيعات، الموارد البشرية، المالية، والبيانات التحليلية، بالإضافة إلى الشركات الناشئة التي تتطلع إلى بنية تحتية قابلة للتوسع.',
      aEn: 'Rasd is built for midsize to enterprise‑level organizations that need a central platform to manage sales teams, HR, finance, and analytics, as well as fast‑growing startups seeking scalable infrastructure.'
    },
    {
      icon: 'fa-solid fa-building',
      qAr: 'هل يمكنني إدارة عدة شركات من حساب واحد؟',
      qEn: 'Can I manage multiple companies?',
      aAr: 'نعم، يدعم Rasd تعدد الشركات (Multi‑Tenant) داخل نفس حساب المستخدم مع عزل البيانات وإعدادات كل شركة على حدة.',
      aEn: 'Yes. Rasd supports multi‑tenant management, allowing a single user account to oversee multiple companies with isolated data and configurations for each.'
    },
    {
      icon: 'fa-solid fa-robot',
      qAr: 'هل تدعم Rasd أتمتة الذكاء الاصطناعي؟',
      qEn: 'Does Rasd support AI automation?',
      aAr: 'تقدم Rasd أتمتة مدعومة بالذكاء الاصطناعي لإنشاء تقارير ذكية، توقعات المبيعات، وإجراءات سير العمل التلقائية التي تقلل من الأعمال اليدوية.',
      aEn: 'Rasd provides AI‑driven automation to generate smart reports, sales forecasts, and trigger workflow actions automatically, reducing manual effort.'
    },
    {
      icon: 'fa-solid fa-user-tie',
      qAr: 'هل يمكنني إدارة الموظفين والموارد البشرية؟',
      qEn: 'Can I manage employees and HR?',
      aAr: 'نعم، يوفر Rasd وحدة HR شاملة لإدارة سجلات الموظفين، الإجازات، الرواتب، وتقييم الأداء، مع تدفقات موافقة مخصصة.',
      aEn: 'Yes. Rasd includes a full‑featured HR module for employee records, leave management, payroll, and performance reviews, complete with customizable approval flows.'
    },
    {
      icon: 'fa-solid fa-address-book',
      qAr: 'هل يتضمن Rasd نظام CRM؟',
      qEn: 'Does Rasd include CRM?',
      aAr: 'يشتمل Rasd على نظام CRM متكامل لتتبع العملاء، فرص المبيعات، وإدارة العلاقات مع العملاء عبر لوحة واحدة.',
      aEn: 'Rasd includes an integrated CRM to track leads, opportunities, and manage customer relationships from a single interface.'
    },
    {
      icon: 'fa-solid fa-file-invoice-dollar',
      qAr: 'هل يمكنني إنشاء فواتير وتقارير مالية؟',
      qEn: 'Can I create invoices and financial reports?',
      aAr: 'نعم، يتيح Rasd إنشاء فواتير احترافية، تقارير مالية مخصصة، وتتبع التدفقات النقدية، مع إمكانيات تصدير إلى PDF و Excel.',
      aEn: 'Yes. Rasd enables creation of professional invoices, custom financial reports, cash‑flow tracking, and export to PDF or Excel.'
    },
    {
      icon: 'fa-solid fa-chart-line',
      qAr: 'هل تدعم Rasd لوحات تحليلات متقدمة؟',
      qEn: 'Does Rasd support analytics dashboards?',
      aAr: 'توفر Rasd لوحات تحليلات مرئية مع مقاييس مخصصة، تقارير AI‑driven، ومؤشرات KPI تفاعلية تدعم اتخاذ القرار.',
      aEn: 'Rasd provides visual analytics dashboards with custom metrics, AI‑driven insights, and interactive KPI widgets to aid decision‑making.'
    },
    {
      icon: 'fa-solid fa-shield-alt',
      qAr: 'هل بياناتي آمنة؟',
      qEn: 'Is my data secure?',
      aAr: 'نُطبق تشفير AES‑256 في جميع مراحل النقل والتخزين، مع امتثال لمعايير SOC 2 و GDPR لضمان أعلى مستويات الأمان والسرية.',
      aEn: 'We employ AES‑256 encryption at rest and in transit, fully compliant with SOC 2 and GDPR standards to guarantee top‑level security and confidentiality.'
    },
    {
      icon: 'fa-solid fa-user-shield',
      qAr: 'هل تدعم Rasd صلاحيات مبنية على الأدوار (RBAC)؟',
      qEn: 'Does Rasd support role‑based permissions (RBAC)?',
      aAr: 'نعم، يدعم Rasd نظام RBAC يتيح تعيين أدوار تفصيلية (مشرف، مالك، محاسب، مدير مبيعات، إلخ) مع تحكم دقيق في الوصول إلى الوحدات والبيانات.',
      aEn: 'Yes. Rasd features a robust RBAC system allowing granular role definitions (Admin, Owner, Accountant, Sales Manager, etc.) with precise access control over modules and data.'
    },
    {
      icon: 'fa-solid fa-plug',
      qAr: 'هل يمكن تكامل Rasd مع أنظمة خارجية؟',
      qEn: 'Can Rasd integrate with external systems?',
      aAr: 'تقدم Rasd واجهات RESTful APIs، ويب هوكس، وإضافات جاهزة لدمج مع ERP، أدوات التسويق، وأنظمة الدفع لتوسيع الوظائف بسهولة.',
      aEn: 'Rasd offers RESTful APIs, webhooks, and ready‑made connectors to integrate with ERP, marketing tools, and payment gateways, extending functionality effortlessly.'
    },
    {
      icon: 'fa-solid fa-headset',
      qAr: 'ما هي خيارات الدعم المتاحة للعملاء؟',
      qEn: 'What customer support options are available?',
      aAr: 'نوفر دعمًا عبر البريد الإلكتروني 24/7، قاعدة معرفة شاملة، جلسات تدريبية مخصصة، وخط دعم مباشر للمشتركين في الخطة الاحترافية.',
      aEn: 'We provide 24/7 email support, a comprehensive knowledge base, bespoke training sessions, and live chat for Professional‑plan subscribers.'
    }
  ];

  toggleFaq(idx: number) {
    const current = this.activeFaqIndex();
    this.activeFaqIndex.set(current === idx ? null : idx);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  // AI Simulator States
  isTyping = signal(false);
  selectedPromptIndex = signal<number | null>(null);
  aiInput = signal('');
  aiResponse = signal('');

  // Signals for stats animations
  uptimeStat = signal('0');
  operationsStat = signal('0');
  usersStat = signal('0');
  companiesStat = signal('0');
  statsVisible = signal(false);

  private observer: IntersectionObserver | null = null;
  // Separate observer for the problem-cards cascade animation
  private problemObserver: IntersectionObserver | null = null;
  // Separate observer for the features-cards cascade animation
  private featuresObserver: IntersectionObserver | null = null;
  // Separate observer for the workflow-cards slide-in animation
  private workflowObserver: IntersectionObserver | null = null;

  // --- Testimonials Carousel State ---
  testimonials = [
    {
      stars: '★★★★★',
      textAr: 'ساعدتنا منصة رصد في تنظيم صفقاتنا وتتبع مهام مندوبي المبيعات بشكل دقيق للغاية. أداة المساعد الذكي وفرت علينا ساعات من كتابة التقارير.',
      textEn: 'RasdAI helped us organize our deals pipeline and accurately track sales activities. The AI assistant saved us hours of compiling reports.',
      avatar: 'AM',
      nameAr: 'أحمد المنصوري',
      nameEn: 'Ahmed Al-Mansoori',
      titleAr: 'مالك ومؤسس، شركة المنصوري للتجارة',
      titleEn: 'Owner & Founder, Mansoori Trading'
    },
    {
      stars: '★★★★★',
      textAr: 'نظام المهام والموافقة المباشرة على الإجازات والتدقيق المالي التلقائي جعل إدارة شركتي أسهل بكثير. الموظفون ينجزون مهامهم الآن بشكل أسرع.',
      textEn: 'The automated task manager, leave approval sheets, and instant financial audits made company management so clean. Highly recommended.',
      avatar: 'SA',
      nameAr: 'سارة الفهد',
      nameEn: 'Sarah Al-Fahad',
      titleAr: 'الرئيس التنفيذي، الفهد للخدمات اللوجستية',
      titleEn: 'CEO, Fahad Logistics'
    },
    {
      stars: '★★★★★',
      textAr: 'كانت تجربة الربط مع أنظمتنا المحاسبية سلسة جداً. تمكنا من ربط رصد مع تخطيط موارد المؤسسة لدينا في غضون ساعات قليلة بدلاً من أسابيع.',
      textEn: 'The API integration was flawless. We connected our ERP to Rasd AI in hours, not weeks. Truly an enterprise-grade experience.',
      avatar: 'OS',
      nameAr: 'عمر السيد',
      nameEn: 'Omar Al-Sayed',
      titleAr: 'المدير التقني، تيك فيجن',
      titleEn: 'CTO, TechVision'
    },
    {
      stars: '★★★★★',
      textAr: 'دقة توقعات الذكاء الاصطناعي مذهلة حقاً. لقد غيرت تماماً كيفية تعاملنا مع المخزون وتحديد أهداف المبيعات الفصلية.',
      textEn: 'The AI forecasting accuracy is mind-blowing. It has completely changed how we handle our inventory and sales targets.',
      avatar: 'LH',
      nameAr: 'ليلى حسن',
      nameEn: 'Layla Hassan',
      titleAr: 'مديرة العمليات، أبيكس للتجزئة',
      titleEn: 'Head of Operations, Apex Retail'
    }
  ];
  
  currentTestimonialIndex = signal(0);
  private testimonialInterval: any;

  defaultPlans = [
    {
      id: "starter",
      nameAr: "المبتدئ",
      nameEn: "Starter",
      price: 49,
      periodAr: "شهر",
      periodEn: "mo",
      taglineAr: "مثالية للشركات الناشئة والمشروعات الصغيرة.",
      taglineEn: "Perfect for freelancers and small teams.",
      features: [
        { textAr: "3 مستخدمين", textEn: "3 Team Members", included: true },
        { textAr: "200 طلب ذكاء اصطناعي / شهر", textEn: "200 AI Queries / mo", included: true },
        { textAr: "إدارة الصفقات الأساسية", textEn: "Basic Deals Pipeline", included: true },
        { textAr: "تقارير شهرية", textEn: "Monthly Reports", included: true },
        { textAr: "مساعد ذكي متقدم", textEn: "Advanced AI CoPilot", included: false },
        { textAr: "دعم فني أولوي", textEn: "Priority Support", included: false }
      ]
    },
    {
      id: "professional",
      nameAr: "الاحترافية",
      nameEn: "Professional",
      price: 199,
      periodAr: "شهر",
      periodEn: "mo",
      taglineAr: "الباقة الأكثر طلباً للشركات المتوسطة والمتنامية.",
      taglineEn: "Ideal for growing companies scaling fast.",
      features: [
        { textAr: "15 مستخدماً", textEn: "15 Team Members", included: true },
        { textAr: "5,000 طلب ذكاء اصطناعي / شهر", textEn: "5,000 AI Queries / mo", included: true },
        { textAr: "إدارة صفقات ومهام متقدمة", textEn: "Advanced Pipeline & Tasks", included: true },
        { textAr: "مساعد ذكي CoPilot كامل", textEn: "Full AI CoPilot Access", included: true },
        { textAr: "تقارير تدقيق متقدمة", textEn: "Advanced Audit Reports", included: true },
        { textAr: "دعم فني أولوي 24/7", textEn: "Priority 24/7 Support", included: true }
      ]
    },
    {
      id: "enterprise",
      nameAr: "المؤسسات",
      nameEn: "Enterprise",
      price: 499,
      periodAr: "شهر",
      periodEn: "mo",
      taglineAr: "مخصصة للشركات الكبرى والمنشآت الضخمة.",
      taglineEn: "Built for large enterprises with custom needs.",
      features: [
        { textAr: "مستخدمون غير محدودون", textEn: "Unlimited Team Members", included: true },
        { textAr: "طلبات ذكاء اصطناعي غير محدودة", textEn: "Unlimited AI Queries", included: true },
        { textAr: "خوادم مخصصة (SLA 99.9%)", textEn: "Dedicated Servers (SLA 99.9%)", included: true },
        { textAr: "تدقيق مالي مخصص", textEn: "Custom Financial Audit", included: true },
        { textAr: "مدير حساب مخصص", textEn: "Dedicated Account Manager", included: true },
        { textAr: "تكامل API مخصص", textEn: "Custom API Integration", included: true }
      ]
    }
  ];

  pricingPlans = signal<any[]>(this.defaultPlans);

  // Prompts and responses for AI Simulation (Arabic)
  promptsAr = [
    'هل توجد أي مشاكل معلقة في الصفقات اليوم؟',
    'اعطني تقريراً سريعاً عن أداء فريق المبيعات.',
    'ما هو معدل إنجاز المهام هذا الأسبوع؟'
  ];
  responsesAr = [
    'جميع الصفقات تسير بشكل ممتاز. هناك صفقة واحدة نشطة بقيمة 50,000 ريال تحتاج إلى متابعة مع العميل اليوم.',
    'أداء ممتاز! حقق فريق المبيعات نمواً بنسبة 24% مقارنة بالأسبوع الماضي، مع إغلاق 12 صفقة جديدة بنجاح.',
    'نسبة إنجاز المهام بلغت 92%. تم إنجاز 45 مهمة بنجاح، ويوجد 4 مهام قيد التنفيذ حالياً.'
  ];

  // Prompts and responses for AI Simulation (English)
  promptsEn = [
    'Are there any pending issues with deals today?',
    'Give me a quick report on sales performance.',
    'What is the task completion rate this week?'
  ];
  responsesEn = [
    'All deals are running smoothly. There is only 1 active deal worth $50,000 that requires follow-up with the client today.',
    'Excellent performance! The sales team achieved a 24% growth compared to last week, successfully closing 12 new deals.',
    'The task completion rate is 92%. 45 tasks were completed successfully, with 4 tasks currently in progress.'
  ];

  private scrollHandler: (() => void) | null = null;

  ngOnInit() {
    // Header scroll check
      this.scrollHandler = () => {
        this.isHeaderScrolled.set(window.scrollY > 50);
        // Show/hide back‑to‑top button
        this.showBackToTop.set(window.scrollY > 300);
      };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // Load pricing plans from backend
    this.http.get<any>('http://localhost:5092/api/SystemAdmin/pricing-plans').subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.pricingPlans.set(res.data);
        }
      },
      error: (err) => {
        console.warn('Failed to load dynamic pricing plans, using fallbacks.', err);
      }
    });

    // Trigger first prompt by default on load
    setTimeout(() => {
      this.runAiSimulation(0);
    }, 1000);

    // Start auto-playing the testimonials carousel
    this.startTestimonialAutoPlay();
  }

  ngOnDestroy() {
    this.stopTestimonialAutoPlay();
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    // Clean up problem-grid observer to prevent memory leaks
    if (this.problemObserver) {
      this.problemObserver.disconnect();
    }
    // Clean up features-grid observer
    if (this.featuresObserver) {
      this.featuresObserver.disconnect();
    }
    // Clean up workflow-grid observer
    if (this.workflowObserver) {
      this.workflowObserver.disconnect();
    }
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    // Pro Tip: Use IntersectionObserver for animation trigger
    // Pro Tip: This is also debounced naturally by the observer compared to scroll events
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.statsVisible()) {
          this.statsVisible.set(true);
          this.animateStats();
        }
      });
    }, options);

    // Using querySelector since we don't have ViewChild on this generic element yet
    const statsSection = document.querySelector('.hero-stats-grid');
    if (statsSection) {
      this.observer.observe(statsSection);
    }

    // ── Problem-cards cascade observer ─────────────────────────────
    // Fires once when the grid enters the viewport (threshold 15%).
    // Adds .is-visible which triggers all .cascade-item CSS animations.
    // Once triggered the observer disconnects itself to stay lean.
    this.problemObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Add trigger class — CSS handles the rest via --cascade-delay
            entry.target.classList.add('is-visible');
            // Unobserve: animation should only fire once per page visit
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );

    const problemGrid = document.getElementById('problem-grid-anim');
    if (problemGrid) {
      this.problemObserver.observe(problemGrid);
    }

    // ── Features-cards cascade observer ────────────────────────────
    this.featuresObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );

    const featuresGrid = document.getElementById('features-grid-anim');
    if (featuresGrid) {
      this.featuresObserver.observe(featuresGrid);
    }

    // ── Workflow-cards slide-in observer ───────────────────────────
    this.workflowObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );

    const workflowGrid = document.getElementById('workflow-grid-anim');
    if (workflowGrid) {
      this.workflowObserver.observe(workflowGrid);
    }
  }

  animateStats() {
    // 200ms staggered start for each card to create sequence effect
    setTimeout(() => this.animateValue(this.uptimeStat, 99.99, 2800, 2), 0);
    setTimeout(() => this.animateValue(this.operationsStat, 2.5, 2800, 1), 200);
    setTimeout(() => this.animateValue(this.usersStat, 120, 2800, 0), 400);
    setTimeout(() => this.animateValue(this.companiesStat, 320, 2800, 0), 600);
  }

  animateValue(signalRef: any, end: number, duration: number, decimals: number) {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo for smooth deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = end * easeProgress;
      
      signalRef.set(decimals > 0 ? currentVal.toFixed(decimals) : Math.floor(currentVal).toString());
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        signalRef.set(decimals > 0 ? end.toFixed(decimals) : end.toString());
      }
    };
    window.requestAnimationFrame(step);
  }

  runAiSimulation(index: number) {
    if (this.isTyping()) return;
    this.selectedPromptIndex.set(index);
    this.isTyping.set(true);
    this.aiInput.set('');
    this.aiResponse.set('');

    const lang = this.i18n.currentLang();
    const prompt = lang === 'ar' ? this.promptsAr[index] : this.promptsEn[index];
    const response = lang === 'ar' ? this.responsesAr[index] : this.responsesEn[index];

    // Simulate typing the user query
    let inputCharIndex = 0;
    const inputInterval = setInterval(() => {
      if (inputCharIndex <= prompt.length) {
        this.aiInput.set(prompt.substring(0, inputCharIndex));
        inputCharIndex++;
      } else {
        clearInterval(inputInterval);

        // Wait brief delay then type the AI response
        setTimeout(() => {
          let respCharIndex = 0;
          const respInterval = setInterval(() => {
            if (respCharIndex <= response.length) {
              this.aiResponse.set(response.substring(0, respCharIndex));
              respCharIndex++;
            } else {
              clearInterval(respInterval);
              this.isTyping.set(false);
            }
          }, 15); // Fast typing speed
        }, 500);
      }
    }, 30);
  }



  toggleTheme() {
    console.log('toggleTheme called! Current theme before:', this.themeService.currentTheme());
    this.themeService.toggleTheme();
    console.log('Current theme after:', this.themeService.currentTheme());
  }

  toggleLang() {
    this.i18n.toggleLang();
    // Re-run the active prompt simulation in the new language
    const activeIndex = this.selectedPromptIndex() ?? 0;
    this.isTyping.set(false);
    setTimeout(() => this.runAiSimulation(activeIndex), 200);
  }

  openSupport() {
    // Simple support action – open mail client or support page
    window.open('mailto:support@rasd.com', '_blank');
  }

  contactData = { firstName: '', lastName: '', email: '', message: '' };
  isSubmittingContact = signal(false);
  contactFeedbackMessage = signal('');
  contactFeedbackSuccess = signal(true);

  onSubmitContactForm(event: Event) {
    event.preventDefault();
    if (!this.contactData.firstName || !this.contactData.lastName || !this.contactData.email || !this.contactData.message) {
      this.contactFeedbackMessage.set(this.i18n.currentLang() === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      this.contactFeedbackSuccess.set(false);
      return;
    }

    this.isSubmittingContact.set(true);
    this.contactFeedbackMessage.set('');

    const payload = {
      firstName: this.contactData.firstName,
      lastName: this.contactData.lastName,
      email: this.contactData.email,
      message: this.contactData.message
    };

    this.http.post<any>('http://localhost:5092/api/Contact/submit', payload).subscribe({
      next: (res) => {
        this.isSubmittingContact.set(false);
        this.contactFeedbackSuccess.set(true);
        this.contactFeedbackMessage.set(this.i18n.currentLang() === 'ar' 
          ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' 
          : 'Your message has been sent successfully! We will contact you soon.');
        // Reset form
        this.contactData = { firstName: '', lastName: '', email: '', message: '' };
      },
      error: (err) => {
        this.isSubmittingContact.set(false);
        this.contactFeedbackSuccess.set(false);
        const errMsg = err.error?.message || (this.i18n.currentLang() === 'ar' 
          ? 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.' 
          : 'An error occurred while sending the message. Please try again later.');
        this.contactFeedbackMessage.set(errMsg);
      }
    });
  }

  // --- Testimonials Carousel Logic ---
  startTestimonialAutoPlay() {
    this.stopTestimonialAutoPlay();
    this.testimonialInterval = setInterval(() => {
      this.nextTestimonial();
    }, 5000); // switch every 5 seconds
  }

  stopTestimonialAutoPlay() {
    if (this.testimonialInterval) {
      clearInterval(this.testimonialInterval);
      this.testimonialInterval = null;
    }
  }

  nextTestimonial() {
    const isMobile = window.innerWidth <= 900;
    // On desktop we show 2 cards at a time, so max index is length - 2
    // On mobile we show 1 card, so max index is length - 1
    const maxIndex = isMobile ? this.testimonials.length - 1 : Math.max(0, this.testimonials.length - 2);
    
    this.currentTestimonialIndex.update(idx => (idx >= maxIndex) ? 0 : idx + 1);
  }

  prevTestimonial() {
    const isMobile = window.innerWidth <= 900;
    const maxIndex = isMobile ? this.testimonials.length - 1 : Math.max(0, this.testimonials.length - 2);
    
    this.currentTestimonialIndex.update(idx => idx === 0 ? maxIndex : idx - 1);
  }

  goToTestimonial(index: number) {
    const isMobile = window.innerWidth <= 900;
    const maxIndex = isMobile ? this.testimonials.length - 1 : Math.max(0, this.testimonials.length - 2);
    
    if (index > maxIndex) {
      index = maxIndex;
    }
    this.currentTestimonialIndex.set(index);
    this.startTestimonialAutoPlay();
  }

  getTestimonialTransform(): string {
    const idx = this.currentTestimonialIndex();
    const isRtl = this.i18n.isRtl();
    const isMobile = window.innerWidth <= 900;
    const step = isMobile ? 100 : 50;
    const value = idx * step;
    return isRtl ? `translateX(${value}%)` : `translateX(-${value}%)`;
  }
}
