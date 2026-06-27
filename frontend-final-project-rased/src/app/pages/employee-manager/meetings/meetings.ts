import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: 'internal' | 'client' | 'training';
  location: string;
  attendees: string[];
  organizer: string;
}

interface PastMeeting {
  title: string;
  date: string;
  outcome: string;
  participants: number;
}

@Component({
  selector: 'app-employee-manager-meetings',
  imports: [CommonModule, FormsModule],
  templateUrl: './meetings.html',
  styleUrl: './meetings.css'
})
export class EmployeeManagerMeetings {

  upcomingMeetings = signal<Meeting[]>([]);

  pastMeetings = signal<PastMeeting[]>([]);

  showModal = signal(false);

  // Form Fields
  newTitle = '';
  newDate = '';
  newTime = '';
  newDuration = '60';
  newType: 'internal' | 'client' | 'training' = 'internal';
  newLocation = '';
  newAttendeesStr = '';
  newOrganizer = 'سارة القحطاني';

  openModal() { this.showModal.set(true); }

  closeModal() {
    this.showModal.set(false);
    this.resetForm();
  }

  saveMeeting() {
    if (!this.newTitle || !this.newDate || !this.newTime) return;

    const attendeesList = this.newAttendeesStr
      ? this.newAttendeesStr.split(',').map(a => a.trim().toUpperCase().slice(0, 2)).filter(Boolean)
      : ['HR'];

    const meeting: Meeting = {
      id: Date.now(),
      title: this.newTitle,
      date: this.newDate,
      time: this.newTime,
      duration: `${this.newDuration} دقيقة`,
      type: this.newType,
      location: this.newLocation || 'قاعة الاجتماعات',
      attendees: attendeesList,
      organizer: this.newOrganizer
    };

    this.upcomingMeetings.update(prev => [meeting, ...prev]);
    this.closeModal();
  }

  private resetForm() {
    this.newTitle = '';
    this.newDate = '';
    this.newTime = '';
    this.newDuration = '60';
    this.newType = 'internal';
    this.newLocation = '';
    this.newAttendeesStr = '';
    this.newOrganizer = 'سارة القحطاني';
  }
}
