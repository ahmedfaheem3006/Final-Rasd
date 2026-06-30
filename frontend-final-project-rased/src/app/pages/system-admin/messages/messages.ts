import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../../../services/i18n.service';
import { ToastService } from '../../../services/toast.service';

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  createdAt: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class MessagesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  i18n = inject(I18nService);

  messages = signal<ContactMessage[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');
  selectedMessage = signal<ContactMessage | null>(null);

  // Computed signal to filter messages based on search query
  filteredMessages = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.messages();
    if (!query) return list;
    return list.filter(m => 
      m.firstName.toLowerCase().includes(query) || 
      m.lastName.toLowerCase().includes(query) || 
      m.email.toLowerCase().includes(query) || 
      m.message.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.isLoading.set(true);
    this.http.get<ContactMessage[]>('http://localhost:5092/api/Contact/messages').subscribe({
      next: (data) => {
        this.messages.set(data || []);
        this.isLoading.set(false);
        if (data && data.length > 0 && !this.selectedMessage()) {
          this.selectedMessage.set(data[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load messages', err);
        this.isLoading.set(false);
        this.toast.error(
          this.i18n.currentLang() === 'ar' 
            ? 'فشل في تحميل الرسائل الواردة.' 
            : 'Failed to load inbox messages.'
        );
      }
    });
  }

  selectMessage(msg: ContactMessage) {
    this.selectedMessage.set(msg);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(this.i18n.currentLang() === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
