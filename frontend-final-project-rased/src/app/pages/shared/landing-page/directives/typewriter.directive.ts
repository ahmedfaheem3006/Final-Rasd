import { Directive, ElementRef, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[appTypewriter]',
  standalone: true
})
export class TypewriterDirective implements OnInit, OnChanges, OnDestroy {
  @Input('appTypewriter') text: string = '';
  @Input() typeSpeed: number = 25; // milliseconds per character
  @Input() typeDelay: number = 0;   // delay in milliseconds before typing starts

  private el = inject(ElementRef);
  private observer: IntersectionObserver | null = null;
  private timeoutId: any = null;
  private hasAnimated = false;

  ngOnInit() {
    this.setupObserver();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['text'] && !changes['text'].firstChange) {
      // Re-type immediately if text changes (e.g. language toggle)
      this.startTyping();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.clearTimer();
  }

  private setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasAnimated) {
          this.hasAnimated = true;
          this.observer?.unobserve(this.el.nativeElement);
          
          this.timeoutId = setTimeout(() => {
            this.startTyping();
          }, +this.typeDelay || 0);
        }
      });
    }, { threshold: 0.1 });

    this.observer.observe(this.el.nativeElement);
    
    // Set initial text invisible to avoid flash before animation starts
    this.setInitialState();
  }

  private setInitialState() {
    const text = this.text || '';
    this.el.nativeElement.innerHTML = `<span class="typewriter-invisible" style="opacity: 0; pointer-events: none;">${text}</span>`;
  }

  private startTyping() {
    this.clearTimer();
    
    const targetText = this.text || '';
    const speed = +this.typeSpeed || 25;
    let currentLength = 0;
    
    const type = () => {
      if (currentLength <= targetText.length) {
        const visibleSlice = targetText.slice(0, currentLength);
        const invisibleSlice = targetText.slice(currentLength);
        
        this.el.nativeElement.innerHTML = 
          `<span class="typewriter-visible">${visibleSlice}</span>` +
          `<span class="typewriter-cursor">|</span>` +
          `<span class="typewriter-invisible" style="opacity: 0; pointer-events: none;">${invisibleSlice}</span>`;
        
        currentLength++;
        this.timeoutId = setTimeout(type, speed);
      } else {
        // Remove cursor when typing completes
        this.el.nativeElement.innerHTML = `<span class="typewriter-visible">${targetText}</span>`;
      }
    };

    type();
  }

  private clearTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
