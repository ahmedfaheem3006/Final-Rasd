import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private static readonly STORAGE_KEY = 'rasd_theme';

  currentTheme = signal<Theme>(this.loadTheme());
  isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
      localStorage.setItem(ThemeService.STORAGE_KEY, theme);
    });
  }

  toggleTheme() {
    this.currentTheme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
  }

  private loadTheme(): Theme {
    const saved = localStorage.getItem(ThemeService.STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Default dark (Vision UI)
  }
}
