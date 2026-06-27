import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { I18nService } from '../../../services/i18n.service';
import { MeetingService, MeetingSchedule } from '../../../services/meeting.service';
import { AuthService } from '../../../services/auth.service';
import { CrmService } from '../../../services/crm.service';
import { NotificationService } from '../../../services/notification.service';
import { SignalRService } from '../../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-meetings',
  imports: [CommonModule, FormsModule],
  templateUrl: './meetings.html',
  styleUrl: './meetings.css'
})
export class Meetings implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  public i18n = inject(I18nService);
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);
  private crmService = inject(CrmService);
  private notificationService = inject(NotificationService);
  private signalRService = inject(SignalRService);

  private signalRSubs: Subscription[] = [];

  upcomingMeetings = signal<any[]>([]);
  pastMeetings = signal<any[]>([]);

  // Modal State
  showModal = signal(false);
  editingMeetingId = signal<number | null>(null);
  isEditMode = computed(() => this.editingMeetingId() !== null);

  // Form Fields
  newMeetingTitle = '';
  newMeetingDate = '';
  newMeetingTime = '';
  newMeetingDuration = '';
  newMeetingType = 'internal';
  newMeetingLocation = '';
  newMeetingAttendees = '';
  newMeetingLink = '';
  newMeetingPlatform = 'zoom';

  // Conditional selects fields
  selectedClientId = '';
  selectedStrategicCompany = '';

  // Data Lists
  employeesList = signal<any[]>([]);
  clientsList = signal<any[]>([]);
  strategicCompaniesList = signal<string[]>([]);

  // Options arrays
  timeOptions = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
    '08:00 PM'
  ];

  platformOptions = [
    { key: 'zoom', label: 'Zoom' },
    { key: 'teams', label: 'Microsoft Teams' },
    { key: 'meet', label: 'Google Meet' },
    { key: 'office', label: 'Office / In-person' }
  ];

  currentUser = this.authService.currentUser;
  userRole = this.authService.userRole;

  // Permissions logic
  canSchedule = computed(() => {
    const role = this.userRole()?.toLowerCase();
    return ['owner-admin', 'sales-manager', 'employee-manager', 'hr'].includes(role || '');
  });

  isAllSelected = computed(() => {
    const list = this.employeesList();
    return list.length > 0 && list.every(e => e.selected);
  });

  ngOnInit() {
    this.loadMeetings();
    this.loadDropdownData();
    this.initSignalR();
  }

  private initSignalR() {
    this.signalRService.startConnection();

    this.signalRSubs.push(
      this.signalRService.meetingCreated$.subscribe(() => {
        this.loadMeetings();
      }),
      this.signalRService.meetingUpdated$.subscribe(() => {
        this.loadMeetings();
      }),
      this.signalRService.meetingDeleted$.subscribe(() => {
        this.loadMeetings();
      })
    );
  }

  loadDropdownData() {
    // Load employees
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const mapped = res.data.map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            role: u.role,
            selected: false
          }));
          this.employeesList.set(mapped);
        }
      },
      error: (err) => console.error('Failed to load employees', err)
    });

    // Load clients
    this.crmService.getClients().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.clientsList.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load clients', err)
    });

    // Load deals for strategic partner companies list
    this.crmService.getDeals().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const companies = new Set<string>();
          res.data.forEach((deal: any) => {
            const company = deal.clientName || deal.client?.companyName || deal.client?.name;
            if (company) {
              companies.add(company);
            }
          });
          this.strategicCompaniesList.set(Array.from(companies));
        }
      },
      error: (err) => console.error('Failed to load deals', err)
    });
  }

  loadMeetings() {
    this.meetingService.getMeetings().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const upcomingList: any[] = [];
          const pastList: any[] = [];
          
          const user = this.currentUser();
          const isCreator = this.canSchedule();

          res.data.forEach((m: MeetingSchedule) => {
            const mDate = m.meetingDate ? new Date(m.meetingDate) : new Date();
            const attendeesArray = m.attendees 
              ? m.attendees.split(',').map(a => a.trim()).filter(a => a.length > 0)
              : [];

            // Filtering for non-schedule roles (employees and sales-reps only see their meetings)
            if (user && !isCreator) {
              const userEmail = user.email.toLowerCase();
              const userName = user.name.toLowerCase();
              const userInitials = user.avatarInitials?.toLowerCase() || '';

              const isUserAttendee = attendeesArray.some(att => {
                const attL = att.toLowerCase();
                return attL === userEmail || attL === userName || attL === userInitials;
              });

              if (!isUserAttendee) {
                return; // skip showing this meeting to this employee
              }
            }

            // Notification alert triggers 15 minutes before meeting starts
            if (mDate >= now && user) {
              const meetingTimeDate = this.getMeetingDateTime(m.meetingDate, m.meetingTime);
              if (meetingTimeDate) {
                const currentMs = new Date().getTime();
                const diffMins = (meetingTimeDate.getTime() - currentMs) / (1000 * 60);

                if (diffMins >= -60 && diffMins <= 15) {
                  const userEmail = user.email.toLowerCase();
                  const userName = user.name.toLowerCase();
                  const userInitials = user.avatarInitials?.toLowerCase() || '';
                  const isUserAttendee = isCreator || attendeesArray.some(att => {
                    const attL = att.toLowerCase();
                    return attL === userEmail || attL === userName || attL === userInitials;
                  });

                  if (isUserAttendee) {
                    const notifId = `meeting-start-${m.id}`;
                    const exists = this.notificationService.notifications().some(n => n.id === notifId);
                    if (!exists) {
                      this.notificationService.notifications.update(prev => [
                        {
                          id: notifId,
                          titleAr: `اقترب موعد الاجتماع: ${m.title} ⏰`,
                          titleEn: `Meeting starts soon: ${m.title} ⏰`,
                          descriptionAr: `يبدأ الاجتماع خلال 15 دقيقة في تمام الساعة ${m.meetingTime}`,
                          descriptionEn: `Meeting starts in 15 minutes at ${m.meetingTime}`,
                          timeAr: 'نشط الآن',
                          timeEn: 'Active now',
                          isRead: false,
                          type: 'warning'
                        },
                        ...prev
                      ]);
                    }
                  }
                }
              }
            }

            const formattedAttendees = attendeesArray.map(a => {
              const parts = a.trim().split(/\s+/);
              if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
              }
              return a.substring(0, 2).toUpperCase();
            });

            const formattedMeeting = {
              id: m.id,
              title: m.title,
              date: m.meetingDate ? this.formatDateLabel(m.meetingDate) : '',
              rawDate: m.meetingDate,
              time: m.meetingTime,
              duration: m.duration,
              type: m.meetingType,
              location: m.location,
              attendees: formattedAttendees,
              rawAttendees: m.attendees,
              link: m.virtualLink,
              outcome: this.i18n.isRtl() 
                ? 'تم إكمال الاجتماع بنجاح' 
                : 'Meeting completed successfully'
            };

            if (mDate < now) {
              pastList.push(formattedMeeting);
            } else {
              upcomingList.push(formattedMeeting);
            }
          });

          this.upcomingMeetings.set(upcomingList);
          this.pastMeetings.set(pastList);
        }
      },
      error: (err) => {
        console.error('Error fetching meetings:', err);
        const msg = this.i18n.isRtl() ? 'حدث خطأ أثناء تحميل الاجتماعات.' : 'An error occurred while loading meetings.';
        this.toastService.error(msg, this.i18n.isRtl() ? 'خطأ' : 'Error');
      }
    });
  }

  getMeetingDateTime(dateStr: string | Date, timeStr: string): Date | null {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;

      let hours = 0;
      let minutes = 0;
      const timeClean = timeStr.trim().toUpperCase();
      const timePart = timeClean.replace(/(AM|PM|ص|م)/g, '').trim();
      const parts = timePart.split(':');
      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        if ((timeClean.includes('PM') || timeClean.includes('م')) && hours < 12) {
          hours += 12;
        } else if ((timeClean.includes('AM') || timeClean.includes('ص')) && hours === 12) {
          hours = 0;
        }
      }
      d.setHours(hours, minutes, 0, 0);
      return d;
    } catch (e) {
      return null;
    }
  }

  formatDateLabel(dateStr: string | Date): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(d, today)) {
      return this.i18n.isRtl() ? 'اليوم' : 'Today';
    } else if (isSameDay(d, tomorrow)) {
      return this.i18n.isRtl() ? 'غداً' : 'Tomorrow';
    }

    if (this.i18n.isRtl()) {
      const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return `${d.getDate()} ${monthsAr[d.getMonth()]} ${d.getFullYear()}`;
    } else {
      const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthsEn[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  }

  // Auto generates dummy URL and sets location label based on inputs
  autoGenerateLink() {
    if (!this.newMeetingPlatform || !this.newMeetingDate || !this.newMeetingTime) {
      return;
    }
    
    if (this.newMeetingPlatform === 'zoom') {
      this.newMeetingLink = `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`;
      this.newMeetingLocation = 'Zoom Meeting';
    } else if (this.newMeetingPlatform === 'teams') {
      this.newMeetingLink = `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${Math.random().toString(36).substring(2, 15)}%40thread.v2/0`;
      this.newMeetingLocation = 'Microsoft Teams';
    } else if (this.newMeetingPlatform === 'meet') {
      const randomCode = Array.from({length:3}, () => Math.random().toString(36).substring(2,5)).join('-');
      this.newMeetingLink = `https://meet.google.com/${randomCode}`;
      this.newMeetingLocation = 'Google Meet';
    } else {
      this.newMeetingLink = '';
      this.newMeetingLocation = this.i18n.isRtl() ? 'مقر الشركة' : 'Company Office';
    }
  }

  // Attendees multi-select helpers
  selectAllAttendees(event: any) {
    const checked = event.target.checked;
    this.employeesList.update(list => list.map(emp => ({ ...emp, selected: checked })));
    this.updateAttendeesString();
  }

  toggleAttendee(empEmail: string) {
    this.employeesList.update(list => list.map(emp => {
      if (emp.email === empEmail) {
        return { ...emp, selected: !emp.selected };
      }
      return emp;
    }));
    this.updateAttendeesString();
  }

  updateAttendeesString() {
    const selected = this.employeesList().filter(emp => emp.selected).map(emp => emp.fullName);
    this.newMeetingAttendees = selected.join(', ');
  }

  translateRole(role: string): string {
    const r = role?.toLowerCase();
    if (this.i18n.isRtl()) {
      if (r === 'owner' || r === 'owner-admin') return 'مالك الشركة';
      if (r === 'salesmanager' || r === 'sales-manager') return 'مدير المبيعات';
      if (r === 'employeemanager' || r === 'employee-manager') return 'مدير الموظفين (HR)';
      if (r === 'employee') return 'موظف عمليات';
      if (r === 'sales' || r === 'sales-rep') return 'مندوب مبيعات';
      if (r === 'accountant') return 'المحاسب المالي';
      return role;
    } else {
      if (r === 'owner' || r === 'owner-admin') return 'Owner';
      if (r === 'salesmanager' || r === 'sales-manager') return 'Sales Manager';
      if (r === 'employeemanager' || r === 'employee-manager') return 'HR Manager';
      if (r === 'employee') return 'Operations Employee';
      if (r === 'sales' || r === 'sales-rep') return 'Sales Rep';
      if (r === 'accountant') return 'Accountant';
      return role;
    }
  }

  formatTimeOption(time: string): string {
    if (this.i18n.isRtl()) {
      return time.replace('AM', 'ص').replace('PM', 'م');
    }
    return time;
  }

  openModal() {
    this.editingMeetingId.set(null);
    this.showModal.set(true);
    document.body.classList.add('modal-open');
  }

  openEditModal(meeting: any) {
    this.editingMeetingId.set(meeting.id);

    // Pre-fill form fields with existing meeting data
    this.newMeetingTitle = meeting.title;
    
    // Parse raw date to YYYY-MM-DD format for input[type=date]
    if (meeting.rawDate) {
      const d = new Date(meeting.rawDate);
      if (!isNaN(d.getTime())) {
        this.newMeetingDate = d.toISOString().split('T')[0];
      }
    }
    
    this.newMeetingTime = meeting.time || '';
    this.newMeetingDuration = meeting.duration || '';
    this.newMeetingType = meeting.type || 'internal';
    this.newMeetingLocation = meeting.location || '';
    this.newMeetingLink = meeting.link || '';
    
    // Detect platform from location/link
    if (meeting.link?.includes('zoom.us')) {
      this.newMeetingPlatform = 'zoom';
    } else if (meeting.link?.includes('teams.microsoft.com')) {
      this.newMeetingPlatform = 'teams';
    } else if (meeting.link?.includes('meet.google.com')) {
      this.newMeetingPlatform = 'meet';
    } else {
      this.newMeetingPlatform = 'office';
    }

    // Pre-select attendees from raw attendees string
    if (meeting.rawAttendees) {
      const meetingAtts = meeting.rawAttendees.split(',').map((a: string) => a.trim().toLowerCase());
      this.employeesList.update(list => list.map(emp => ({
        ...emp,
        selected: meetingAtts.some((att: string) => {
          const empInitials = this.getInitials(emp.fullName).toLowerCase();
          return att === emp.fullName.toLowerCase() || att === emp.email.toLowerCase() || att === empInitials;
        })
      })));
      this.updateAttendeesString();
    }

    this.showModal.set(true);
    document.body.classList.add('modal-open');
  }

  private getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]);
    }
    return name.substring(0, 2);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingMeetingId.set(null);
    document.body.classList.remove('modal-open');
    this.resetForm();
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
    this.signalRSubs.forEach(s => s.unsubscribe());
  }

  saveMeeting() {
    if (!this.newMeetingTitle || !this.newMeetingDate || !this.newMeetingTime) {
      const msg = this.i18n.isRtl()
        ? 'يرجى تعبئة الحقول الأساسية: عنوان الاجتماع، التاريخ، والوقت.'
        : 'Please fill in the essential fields: Meeting Title, Date, and Time.';
      const title = this.i18n.isRtl() ? 'تنبيه' : 'Warning';
      this.toastService.warning(msg, title);
      return;
    }

    // Build attendees list
    const attendeesList = this.employeesList().filter(emp => emp.selected).map(emp => emp.fullName);

    // Conditional details appending
    if (this.newMeetingType === 'client') {
      const chosenClient = this.clientsList().find(c => String(c.id) === String(this.selectedClientId));
      if (chosenClient) {
        attendeesList.push(chosenClient.name);
      }
    } else if (this.newMeetingType === 'strategic' && this.selectedStrategicCompany) {
      attendeesList.push(this.selectedStrategicCompany);
    }

    const finalAttendees = attendeesList.length > 0 ? attendeesList.join(', ') : 'ME';

    const payload: Partial<MeetingSchedule> = {
      title: this.newMeetingTitle,
      meetingDate: this.newMeetingDate,
      meetingTime: this.newMeetingTime,
      duration: this.newMeetingDuration || (this.i18n.isRtl() ? '60 دقيقة' : '60 minutes'),
      meetingType: this.newMeetingType,
      location: this.newMeetingLocation || (this.i18n.isRtl() ? 'مكتب الشركة' : 'Company Office'),
      attendees: finalAttendees,
      virtualLink: this.newMeetingLink
    };

    const editId = this.editingMeetingId();
    
    if (editId) {
      // UPDATE existing meeting
      this.meetingService.updateMeeting(editId, payload).subscribe({
        next: (res) => {
          if (res.success) {
            const successMsg = this.i18n.isRtl()
              ? `تم تحديث الاجتماع "${this.newMeetingTitle}" بنجاح!`
              : `Meeting "${this.newMeetingTitle}" has been updated successfully!`;
            const successTitle = this.i18n.isRtl() ? 'تعديل اجتماع' : 'Edit Meeting';
            this.toastService.success(successMsg, successTitle);

            // Push local notification about the update
            this.notificationService.notifications.update(prev => [
              {
                id: `meeting-edit-local-${editId}-${Date.now()}`,
                titleAr: `✏️ تم تعديل اجتماع: ${this.newMeetingTitle}`,
                titleEn: `✏️ Meeting edited: ${this.newMeetingTitle}`,
                descriptionAr: `تم تحديث تفاصيل الاجتماع. الموعد: ${this.newMeetingDate} الساعة ${this.newMeetingTime}`,
                descriptionEn: `Meeting details updated. Schedule: ${this.newMeetingDate} at ${this.newMeetingTime}`,
                timeAr: 'الآن',
                timeEn: 'Just now',
                isRead: false,
                type: 'info'
              },
              ...prev
            ]);

            this.closeModal();
            this.loadMeetings();
          }
        },
        error: (err) => {
          console.error('Error updating meeting:', err);
          const errMsg = this.i18n.isRtl() ? 'حدث خطأ أثناء تحديث الاجتماع' : 'An error occurred while updating the meeting';
          this.toastService.error(errMsg, this.i18n.isRtl() ? 'خطأ' : 'Error');
        }
      });
    } else {
      // CREATE new meeting
      this.meetingService.createMeeting(payload).subscribe({
        next: (res) => {
          if (res.success) {
            const successMsg = this.i18n.isRtl()
              ? `تم جدولة الاجتماع الجديد "${this.newMeetingTitle}" بنجاح!`
              : `New meeting "${this.newMeetingTitle}" has been scheduled successfully!`;
            const successTitle = this.i18n.isRtl() ? 'جدولة اجتماع' : 'Schedule Meeting';
            this.toastService.success(successMsg, successTitle);
            this.closeModal();
            this.loadMeetings();
          }
        },
        error: (err) => {
          console.error('Error creating meeting:', err);
          const errMsg = this.i18n.isRtl() ? 'حدث خطأ أثناء جدولة الاجتماع' : 'An error occurred while scheduling the meeting';
          this.toastService.error(errMsg, this.i18n.isRtl() ? 'خطأ' : 'Error');
        }
      });
    }
  }

  deleteMeeting(id: number | undefined, event: Event) {
    if (!id) return;
    event.stopPropagation();

    const confirmMsg = this.i18n.isRtl()
      ? 'هل أنت متأكد من رغبتك في إلغاء هذا الاجتماع؟'
      : 'Are you sure you want to cancel this meeting?';

    if (confirm(confirmMsg)) {
      this.meetingService.deleteMeeting(id).subscribe({
        next: (res) => {
          if (res.success) {
            const successMsg = this.i18n.isRtl() ? 'تم إلغاء الاجتماع بنجاح' : 'Meeting cancelled successfully';
            this.toastService.success(successMsg, this.i18n.isRtl() ? 'إلغاء اجتماع' : 'Cancel Meeting');
            this.loadMeetings();
          }
        },
        error: (err) => {
          console.error('Error cancelling meeting:', err);
          const errMsg = this.i18n.isRtl() ? 'حدث خطأ أثناء إلغاء الاجتماع' : 'An error occurred while cancelling the meeting';
          this.toastService.error(errMsg, this.i18n.isRtl() ? 'خطأ' : 'Error');
        }
      });
    }
  }

  private resetForm() {
    this.newMeetingTitle = '';
    this.newMeetingDate = '';
    this.newMeetingTime = '';
    this.newMeetingDuration = '';
    this.newMeetingType = 'internal';
    this.newMeetingLocation = '';
    this.newMeetingAttendees = '';
    this.newMeetingLink = '';
    this.newMeetingPlatform = 'zoom';
    this.selectedClientId = '';
    this.selectedStrategicCompany = '';
    this.employeesList.update(list => list.map(emp => ({ ...emp, selected: false })));
  }

  onJoinMeeting(link: string) {
    if (link) {
      window.open(link, '_blank');
    } else {
      const msg = this.i18n.isRtl() ? 'لا يوجد رابط متاح لهذا الاجتماع.' : 'No link available for this meeting.';
      const title = this.i18n.isRtl() ? 'رابط الاجتماع' : 'Meeting Link';
      this.toastService.warning(msg, title);
    }
  }
}
