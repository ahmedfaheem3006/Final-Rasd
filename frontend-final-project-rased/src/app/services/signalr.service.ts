import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { NotificationService } from './notification.service';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private notificationService = inject(NotificationService);
  private i18n = inject(I18nService);

  private hubConnection: signalR.HubConnection | null = null;

  // Observable subjects for components to subscribe to
  meetingCreated$ = new Subject<any>();
  meetingUpdated$ = new Subject<any>();
  meetingDeleted$ = new Subject<any>();
  paymentCreated$ = new Subject<any>();
  paymentUpdated$ = new Subject<any>();
  paymentDeleted$ = new Subject<any>();

  async startConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return; // Already connected
    }

    const token = localStorage.getItem('rasd_jwt_token');
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5292/hubs/notifications', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register event listeners
    this.hubConnection.on('MeetingCreated', (meeting: any) => {
      this.meetingCreated$.next(meeting);
      this.pushMeetingNotification('created', meeting);
    });

    this.hubConnection.on('MeetingUpdated', (meeting: any) => {
      this.meetingUpdated$.next(meeting);
      this.pushMeetingNotification('updated', meeting);
    });

    this.hubConnection.on('MeetingDeleted', (data: any) => {
      this.meetingDeleted$.next(data);
    });

    this.hubConnection.on('PaymentCreated', (payment: any) => {
      this.paymentCreated$.next(payment);
      this.pushPaymentNotification('created', payment);
    });

    this.hubConnection.on('PaymentUpdated', (payment: any) => {
      this.paymentUpdated$.next(payment);
      this.pushPaymentNotification('updated', payment);
    });

    this.hubConnection.on('PaymentDeleted', (data: any) => {
      this.paymentDeleted$.next(data);
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR connected successfully');

      // Join tenant group using the tenantId from the JWT token
      const tenantId = this.extractTenantIdFromToken(token);
      if (tenantId) {
        await this.hubConnection.invoke('JoinTenantGroup', tenantId);
      }
    } catch (err) {
      console.error('SignalR connection error:', err);
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  private extractTenantIdFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.tenantId || payload.TenantId || null;
    } catch (e) {
      return null;
    }
  }

  private pushMeetingNotification(type: 'created' | 'updated', meeting: any) {
    const notifId = `meeting-${type}-${meeting.id}-${Date.now()}`;

    if (type === 'updated') {
      this.notificationService.notifications.update(prev => [
        {
          id: notifId,
          titleAr: `📝 تم تحديث اجتماع: ${meeting.title}`,
          titleEn: `📝 Meeting updated: ${meeting.title}`,
          descriptionAr: `تم تعديل الاجتماع. الموعد الجديد: ${meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('ar-EG') : ''} الساعة ${meeting.meetingTime}`,
          descriptionEn: `Meeting has been updated. New schedule: ${meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-US') : ''} at ${meeting.meetingTime}`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          isRead: false,
          type: 'info'
        },
        ...prev
      ]);
    } else if (type === 'created') {
      this.notificationService.notifications.update(prev => [
        {
          id: notifId,
          titleAr: `📅 اجتماع جديد: ${meeting.title}`,
          titleEn: `📅 New meeting: ${meeting.title}`,
          descriptionAr: `تم جدولة اجتماع جديد في ${meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('ar-EG') : ''} الساعة ${meeting.meetingTime}`,
          descriptionEn: `New meeting scheduled on ${meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-US') : ''} at ${meeting.meetingTime}`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          isRead: false,
          type: 'success'
        },
        ...prev
      ]);
    }
  }

  private pushPaymentNotification(type: 'created' | 'updated', payment: any) {
    const notifId = `payment-${type}-${payment.id}-${Date.now()}`;

    if (type === 'created') {
      this.notificationService.notifications.update(prev => [{
        id: notifId,
        titleAr: `💰 دفعة جديدة: ${payment.referenceNumber || 'مدفوعة'}`,
        titleEn: `💰 New payment: ${payment.referenceNumber || 'Payment'}`,
        descriptionAr: `تم تسجيل دفعة بقيمة ${payment.amount?.toLocaleString()} ريال من ${payment.clientName || ''}`,
        descriptionEn: `Payment of ${payment.amount?.toLocaleString()} SAR recorded from ${payment.clientName || ''}`,
        timeAr: 'الآن',
        timeEn: 'Just now',
        isRead: false,
        type: 'success'
      }, ...prev]);
    } else if (type === 'updated') {
      this.notificationService.notifications.update(prev => [{
        id: notifId,
        titleAr: `✏️ تم تحديث الدفعة: ${payment.referenceNumber || ''}`,
        titleEn: `✏️ Payment updated: ${payment.referenceNumber || ''}`,
        descriptionAr: `تم تعديل بيانات الدفعة`,
        descriptionEn: 'Payment details have been updated',
        timeAr: 'الآن',
        timeEn: 'Just now',
        isRead: false,
        type: 'info'
      }, ...prev]);
    }
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}
