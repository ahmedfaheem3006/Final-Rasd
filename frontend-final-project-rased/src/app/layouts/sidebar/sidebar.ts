import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';
import { LeaveService } from '../../services/leave.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private authService = inject(AuthService);
  i18n = inject(I18nService);
  themeService = inject(ThemeService);
  leaveService = inject(LeaveService);

  currentUser = this.authService.currentUser;
  role = this.authService.userRole;
  isCollapsed = signal(false);
  isMobileOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.isMobileOpen()) {
        document.body.style.overflow = 'hidden';
        document.body.classList.add('mobile-drawer-open');
      } else {
        document.body.style.overflow = '';
        document.body.classList.remove('mobile-drawer-open');
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  toggleCollapse() {
    this.isCollapsed.update(v => !v);
  }

  toggleMobile() {
    this.isMobileOpen.update(v => !v);
  }

  closeMobile() {
    this.isMobileOpen.set(false);
  }
}
