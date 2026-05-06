/* ==========================================================================
   carousel.js — generic carousel
   Used for the Incidents carousel and the Tools carousel.
   Reads slide count from the DOM, supports keyboard nav, swipe on touch,
   arrow buttons, and dot indicators.
   ========================================================================== */

class Carousel {
  constructor(rootEl) {
    this.root = rootEl;
    this.track = rootEl.querySelector('.carousel-track');
    this.slides = [...rootEl.querySelectorAll('.carousel-slide')];
    this.viewport = rootEl.querySelector('.carousel-viewport');
    this.prevBtn = rootEl.querySelector('.carousel-arrow.prev');
    this.nextBtn = rootEl.querySelector('.carousel-arrow.next');
    this.dotsContainer = rootEl.querySelector('.carousel-dots');
    this.counter = rootEl.querySelector('.carousel-counter');

    this.index = 0;
    this.isProducts = rootEl.classList.contains('products');
    this.touchStartX = 0;
    this.touchEndX = 0;

    if (this.slides.length === 0) return;

    this.calculateSlidesPerView();
    this.buildDots();
    this.bindControls();
    this.update();

    window.addEventListener('resize', () => {
      this.calculateSlidesPerView();
      this.buildDots();
      // Clamp index after resize
      this.index = Math.min(this.index, this.maxIndex);
      this.update();
    });
  }

  calculateSlidesPerView() {
    if (!this.isProducts) {
      this.slidesPerView = 1;
    } else {
      const w = window.innerWidth;
      if (w <= 680) this.slidesPerView = 1;
      else if (w <= 980) this.slidesPerView = 2;
      else this.slidesPerView = 3;
    }
    this.maxIndex = Math.max(0, this.slides.length - this.slidesPerView);
  }

  buildDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    const dotCount = this.maxIndex + 1;
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        this.index = i;
        this.update();
      });
      this.dotsContainer.appendChild(dot);
    }
  }

  bindControls() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    // Keyboard nav (when carousel has focus)
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
    });

    // Touch swipe
    if (this.viewport) {
      this.viewport.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      this.viewport.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        const dx = this.touchEndX - this.touchStartX;
        if (Math.abs(dx) > 50) {
          if (dx < 0) this.next();
          else this.prev();
        }
      }, { passive: true });
    }
  }

  prev() {
    if (this.index > 0) {
      this.index--;
      this.update();
    }
  }

  next() {
    if (this.index < this.maxIndex) {
      this.index++;
      this.update();
    }
  }

  update() {
    if (!this.track) return;

    // Calculate slide width from actual viewport (handles padding/borders)
    const slideEl = this.slides[0];
    if (!slideEl) return;

    const slideWidth = slideEl.offsetWidth;
    const gap = parseInt(getComputedStyle(this.track).gap || 24, 10);
    const offset = this.index * (slideWidth + gap);

    this.track.style.transform = `translateX(-${offset}px)`;

    // Update arrow disabled states
    if (this.prevBtn) this.prevBtn.disabled = this.index === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.index >= this.maxIndex;

    // Update dots
    if (this.dotsContainer) {
      [...this.dotsContainer.children].forEach((d, i) => {
        d.classList.toggle('active', i === this.index);
      });
    }

    // Update counter text
    if (this.counter) {
      const total = this.slides.length;
      const showing = Math.min(total, this.index + this.slidesPerView);
      const start = this.index + 1;
      this.counter.textContent = total <= this.slidesPerView
        ? `${total} of ${total}`
        : `${start}–${showing} of ${total}`;
    }
  }
}

// Initialize all carousels on the page
document.querySelectorAll('.carousel').forEach(el => new Carousel(el));
