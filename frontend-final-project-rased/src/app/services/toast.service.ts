import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private containerId = 'rasd-toast-container';

  constructor() {}

  success(message: string, title?: string) {
    this.show('success', message, title);
  }

  error(message: string, title?: string) {
    this.show('error', message, title);
  }

  warning(message: string, title?: string) {
    this.show('warning', message, title);
  }

  info(message: string, title?: string) {
    this.show('info', message, title);
  }

  private show(type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) {
    if (typeof document === 'undefined') return;

    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.className = 'rasd-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `rasd-toast rasd-toast-${type}`;

    let iconSvg = '';
    switch (type) {
      case 'success':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        break;
      case 'error':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        break;
      case 'warning':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        break;
      case 'info':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        break;
    }

    const defaultTitle = type === 'success' ? 'نجاح' : type === 'error' ? 'خطأ' : type === 'warning' ? 'تنبيه' : 'معلومة';
    const displayTitle = title || defaultTitle;

    toast.innerHTML = `
      <div class="rasd-toast-icon-wrapper rasd-toast-icon-${type}">
        ${iconSvg}
      </div>
      <div class="rasd-toast-content">
        <div class="rasd-toast-title">${displayTitle}</div>
        <div class="rasd-toast-message">${message}</div>
      </div>
      <button class="rasd-toast-close" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.rasd-toast-close');
    const dismiss = () => {
      if (!toast.classList.contains('rasd-toast-leaving')) {
        toast.classList.add('rasd-toast-leaving');
        toast.addEventListener('animationend', () => {
          toast.remove();
          if (container && container.childElementCount === 0) {
            container.remove();
          }
        });
      }
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', dismiss);
    }

    setTimeout(dismiss, 4000);
  }
}
