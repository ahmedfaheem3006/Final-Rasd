import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../../../services/theme.service';
import { I18nService } from '../../../../../services/i18n.service';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-navbar.component.html',
  styleUrls: ['./landing-navbar.component.css']
})
export class LandingNavbarComponent {
  themeService = inject(ThemeService);
  i18n = inject(I18nService);

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLang() {
    this.i18n.toggleLang();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(val => !val);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
