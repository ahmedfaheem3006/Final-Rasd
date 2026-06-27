import { Component, inject, ViewChild, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  // Initialize services to trigger their effects (theme/lang application)
  private themeService = inject(ThemeService);
  private i18nService = inject(I18nService);

  @ViewChild('sidebarRef') sidebar?: Sidebar;

  @HostListener('document:keydown.escape')
  onEscape() {
    this.sidebar?.closeMobile();
  }
}
