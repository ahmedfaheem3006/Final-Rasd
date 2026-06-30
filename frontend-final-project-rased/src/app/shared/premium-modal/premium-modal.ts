import { Component, input, output, effect, HostListener, inject, Renderer2, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './premium-modal.html',
  styleUrl: './premium-modal.css'
})
export class PremiumModalComponent implements AfterViewInit {
  private renderer = inject(Renderer2);

  show = input(false);

  close = output<void>();

  @ViewChild('overlayEl') overlayRef!: ElementRef;
  private overlayMoved = false;

  constructor() {
    effect(() => {
      if (this.show()) {
        if (!this.overlayMoved && this.overlayRef?.nativeElement) {
          this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
          this.overlayMoved = true;
        }
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngAfterViewInit() {
    if (this.show() && !this.overlayMoved && this.overlayRef?.nativeElement) {
      this.renderer.appendChild(document.body, this.overlayRef.nativeElement);
      this.overlayMoved = true;
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    if (this.overlayMoved && this.overlayRef?.nativeElement?.parentNode) {
      this.renderer.removeChild(document.body, this.overlayRef.nativeElement);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.show()) this.close.emit();
  }

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('premium-modal-overlay')) {
      this.close.emit();
    }
  }
}
