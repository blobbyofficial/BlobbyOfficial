// Main JavaScript - Animations, Interactions & Performance
(function() {
  'use strict';

  // ===== SERVICE WORKER REGISTRATION =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
          // Check for updates periodically
          setInterval(() => registration.update(), 60000);
        })
        .catch((error) => console.warn('SW registration failed:', error));
    });
  }

  // ===== PERFORMANCE MONITORING =====
  const performanceMetrics = {
    startTime: performance.now(),
    resourceTiming: [],
    
    logMetric(name, value) {
      const metric = { name, value, timestamp: performance.now() };
      console.log(`[Metric] ${name}:`, value.toFixed(2) + 'ms');
      return metric;
    },

    reportCoreWebVitals() {
      // LCP - Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.logMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID - First Input Delay (via web-vitals library concept)
      document.addEventListener('pointerdown', (event) => {
        const timestamp = performance.now();
        requestAnimationFrame(() => {
          const fid = performance.now() - timestamp;
          if (fid > 0) this.logMetric('FID', fid);
        });
      }, { once: true });

      // CLS - Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.logMetric('CLS', entry.value);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  };

  // ===== SCROLL ANIMATIONS WITH INTERSECTION OBSERVER =====
  class ScrollAnimator {
    constructor() {
      this.observedElements = new WeakMap();
      this.intersectionObserver = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          root: null,
          rootMargin: '0px 0px -100px 0px',
          threshold: [0, 0.1, 0.5]
        }
      );
      this.resizeObserver = new ResizeObserver(() => this.updateAnimations());
      this.init();
    }

    init() {
      // Observe all elements with animation data attributes
      document.querySelectorAll('[data-animate]').forEach((el) => {
        this.intersectionObserver.observe(el);
        this.observedElements.set(el, {
          animating: false,
          animated: false,
          delay: parseInt(el.dataset.delay || 0)
        });
      });

      // Batch observe tiles and cards
      document.querySelectorAll('.tile, .card, .work-item').forEach((el, index) => {
        el.dataset.animate = 'fadeUpScale';
        el.dataset.delay = (index % 3) * 100; // Stagger effect
        this.intersectionObserver.observe(el);
        this.observedElements.set(el, {
          animating: false,
          animated: false,
          delay: (index % 3) * 100
        });
      });

      // Observe text sections for staggered character reveal
      document.querySelectorAll('h1, h2, h3, p').forEach((el) => {
        if (el.textContent.length > 20) {
          el.dataset.animate = 'textReveal';
          this.intersectionObserver.observe(el);
          this.observedElements.set(el, {
            animating: false,
            animated: false,
            delay: 0
          });
        }
      });
    }

    handleIntersection(entries) {
      entries.forEach((entry) => {
        const metadata = this.observedElements.get(entry.target);
        if (!metadata) return;

        if (entry.isIntersecting && !metadata.animated) {
          metadata.animating = true;
          const animation = entry.target.dataset.animate || 'fadeUpScale';
          const delay = metadata.delay;

          // Apply animation with delay
          setTimeout(() => {
            this.applyAnimation(entry.target, animation);
            metadata.animated = true;
            metadata.animating = false;
          }, delay);
        }
      });
    }

    applyAnimation(element, animationType) {
      element.style.opacity = '0';
      element.style.willChange = 'transform, opacity';

      // Trigger reflow to ensure the animation starts from the initial state
      void element.offsetWidth;

      switch (animationType) {
        case 'fadeUpScale':
          element.style.animation = 'fadeUpScale 0.8s cubic-bezier(0.2, 0.9, 0.25, 1) forwards';
          break;
        case 'fadeInLeft':
          element.style.animation = 'fadeInLeft 0.8s cubic-bezier(0.2, 0.9, 0.25, 1) forwards';
          break;
        case 'fadeInRight':
          element.style.animation = 'fadeInRight 0.8s cubic-bezier(0.2, 0.9, 0.25, 1) forwards';
          break;
        case 'textReveal':
          this.animateTextReveal(element);
          break;
        default:
          element.style.animation = 'fadeInUp 0.8s cubic-bezier(0.2, 0.9, 0.25, 1) forwards';
      }
    }

    animateTextReveal(element) {
      const text = element.textContent;
      const chars = text.split('');
      element.innerHTML = '';
      
      chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.opacity = '0';
        span.style.display = 'inline-block';
        span.style.animation = `charReveal 0.04s cubic-bezier(0.2, 0.9, 0.25, 1) ${index * 20}ms forwards`;
        element.appendChild(span);
      });
    }

    updateAnimations() {
      // Could be called on resize to recalculate animations
    }
  }

  // ===== PARALLAX SCROLL EFFECT =====
  class ParallaxManager {
    constructor() {
      this.parallaxElements = [];
      this.animationFrameId = null;
      this.init();
    }

    init() {
      const parallaxBg = document.querySelector('.parallax-bg');
      if (parallaxBg) {
        this.parallaxElements.push({
          element: parallaxBg,
          speed: 0.5,
          initialY: 0
        });
      }

      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    }

    onScroll() {
      const scrollY = window.scrollY;

      this.parallaxElements.forEach(({ element, speed }) => {
        const offset = scrollY * speed;
        element.style.transform = `translateY(${offset}px)`;
      });
    }
  }

  // ===== PAGE TRANSITIONS =====
  class PageTransition {
    constructor() {
      this.isTransitioning = false;
      this.setupLinks();
    }

    setupLinks() {
      document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href === '#' || href === '') return;

          e.preventDefault();
          this.transitionTo(href);
        });
      });
    }

    transitionTo(sectionId) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const targetSection = document.querySelector(sectionId);
      if (!targetSection) return;

      // Fade out current content
      document.querySelector('main').style.opacity = '0.5';
      document.querySelector('main').style.pointerEvents = 'none';

      setTimeout(() => {
        // Scroll to section
        targetSection.scrollIntoView({ behavior: 'smooth' });

        // Fade back in
        document.querySelector('main').style.opacity = '1';
        document.querySelector('main').style.pointerEvents = 'auto';

        this.isTransitioning = false;
      }, 200);
    }
  }

  // ===== SMOOTH SCROLL WITH OFFSET =====
  class SmoothScroll {
    constructor() {
      this.navHeight = 80; // Approximate navbar height
      this.setupScrollBehavior();
    }

    setupScrollBehavior() {
      document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href === '#') return;

          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            const offsetTop = target.offsetTop - this.navHeight;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        });
      });
    }
  }

  // ===== SCROLL SPY - HIGHLIGHT ACTIVE NAV ITEM =====
  class ScrollSpy {
    constructor() {
      this.navItems = [];
      this.sections = [];
      this.activeItem = null;
      this.init();
    }

    init() {
      // Get nav items
      const dropdown = document.querySelector('.dropdown');
      if (dropdown) {
        this.navItems = dropdown.querySelectorAll('a[href^="#"]');
      }

      // Get sections
      this.sections = Array.from(document.querySelectorAll('section[id]')).map((section) => ({
        id: section.id,
        element: section,
        top: section.offsetTop,
        height: section.offsetHeight
      }));

      window.addEventListener('scroll', () => this.updateScrollSpy(), { passive: true });
      this.updateScrollSpy(); // Initial call
    }

    updateScrollSpy() {
      const scrollY = window.scrollY + 100; // Offset for navbar

      this.sections.forEach((section) => {
        const isCurrent = scrollY >= section.top && scrollY < section.top + section.height;

        this.navItems.forEach((item) => {
          const href = item.getAttribute('href');
          if (href === `#${section.id}`) {
            if (isCurrent) {
              item.classList.add('active');
              item.setAttribute('aria-current', 'page');
            } else {
              item.classList.remove('active');
              item.removeAttribute('aria-current');
            }
          }
        });
      });
    }
  }

  // ===== MOBILE SWIPE NAVIGATION =====
  class SwipeNavigation {
    constructor() {
      this.touchStartX = 0;
      this.touchEndX = 0;
      this.mobilePanel = document.querySelector('.mobile-panel');
      this.init();
    }

    init() {
      if (!this.mobilePanel) return;

      document.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
      }, { passive: true });
    }

    handleSwipe() {
      const diff = this.touchStartX - this.touchEndX;
      const threshold = 50;

      // Swipe left - open panel
      if (diff > threshold) {
        this.openMobilePanel();
      }

      // Swipe right - close panel
      if (diff < -threshold) {
        this.closeMobilePanel();
      }
    }

    openMobilePanel() {
      const hamburger = document.querySelector('.mobile-nav-toggle');
      if (hamburger && !this.mobilePanel.classList.contains('active')) {
        hamburger.click();
      }
    }

    closeMobilePanel() {
      const scrim = document.querySelector('.mobile-scrim');
      if (scrim && this.mobilePanel.classList.contains('active')) {
        scrim.click();
      }
    }
  }

  // ===== BUTTON MICRO-INTERACTIONS =====
  class ButtonInteractions {
    constructor() {
      this.setupButtons();
    }

    setupButtons() {
      document.querySelectorAll('button, a.btn, [role="button"]').forEach((btn) => {
        // Ripple effect on click
        btn.addEventListener('click', (e) => this.createRipple(e));

        // Hover depth effect
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateY(-2px)';
          btn.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = '';
          btn.style.boxShadow = '';
        });

        // Loading state
        btn.addEventListener('processing', () => {
          btn.disabled = true;
          btn.dataset.originalText = btn.textContent;
          btn.textContent = 'Loading...';
          btn.style.opacity = '0.6';
        });

        btn.addEventListener('completed', () => {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalText;
          btn.style.opacity = '1';
        });
      });
    }

    createRipple(event) {
      const button = event.currentTarget;
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');

      // Remove existing ripples
      const existingRipple = button.querySelector('.ripple');
      if (existingRipple) existingRipple.remove();

      button.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    }
  }

  // ===== FORM VALIDATION =====
  class FormValidator {
    constructor() {
      this.forms = document.querySelectorAll('form');
      this.init();
    }

    init() {
      this.forms.forEach((form) => {
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        form.querySelectorAll('input, textarea').forEach((field) => {
          field.addEventListener('blur', () => this.validateField(field));
          field.addEventListener('input', () => this.validateField(field));
        });
      });
    }

    validateField(field) {
      const value = field.value.trim();
      const type = field.type;
      let isValid = true;

      // Required check
      if (field.required && !value) {
        isValid = false;
      }

      // Email validation
      if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
      }

      // Min length
      if (field.minLength && value.length < field.minLength) {
        isValid = false;
      }

      // Visual feedback
      if (isValid) {
        field.classList.remove('error');
        field.classList.add('valid');
      } else {
        field.classList.remove('valid');
        field.classList.add('error');
      }

      return isValid;
    }

    handleSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const fields = form.querySelectorAll('input, textarea');
      let isFormValid = true;

      fields.forEach((field) => {
        if (!this.validateField(field)) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        this.submitForm(form);
      }
    }

    submitForm(form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn?.dispatchEvent(new Event('processing'));

      // Simulate submission (replace with actual endpoint)
      setTimeout(() => {
        submitBtn?.dispatchEvent(new Event('completed'));
        form.reset();
        // Show success message
        alert('Form submitted successfully!');
      }, 1500);
    }
  }

  // ===== LAZY LOAD IMAGES =====
  class LazyLoadManager {
    constructor() {
      this.init();
    }

    init() {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadImage(img);
              imageObserver.unobserve(img);
            }
          });
        });

        document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
          imageObserver.observe(img);
        });
      }
    }

    loadImage(img) {
      const src = img.dataset.src || img.src;
      
      // Handle WebP with fallback
      if (img.dataset.srcWebp) {
        const picture = img.parentElement;
        if (picture.tagName === 'PICTURE') {
          const source = document.createElement('source');
          source.srcset = img.dataset.srcWebp;
          source.type = 'image/webp';
          picture.insertBefore(source, img);
        }
      }

      img.src = src;
      img.removeAttribute('data-src');
      img.removeAttribute('data-src-webp');
      img.classList.add('loaded');
    }
  }

  // ===== FOCUS VISIBLE MANAGEMENT =====
  class FocusManagement {
    constructor() {
      this.setupFocusStyles();
    }

    setupFocusStyles() {
      // Add focus-visible class for keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          document.body.classList.add('keyboard-nav');
        }
      });

      document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-nav');
      });

      // Style focus-visible elements
      const style = document.createElement('style');
      style.textContent = `
        .keyboard-nav :focus {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
          border-radius: 4px;
        }
        
        .keyboard-nav button:focus,
        .keyboard-nav a:focus {
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ===== REDUCED MOTION SUPPORT =====
  class ReducedMotionSupport {
    constructor() {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.setupReducedMotion();
    }

    setupReducedMotion() {
      if (this.prefersReducedMotion) {
        // Remove animations for users who prefer reduced motion
        const style = document.createElement('style');
        style.textContent = `
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        `;
        document.head.appendChild(style);
        console.log('Reduced motion support enabled');
      }

      // Listen for changes in preference
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
      });
    }
  }

  // ===== INITIALIZATION =====
  function initializeApp() {
    // Check if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initModules);
    } else {
      initModules();
    }
  }

  function initModules() {
    console.log('Initializing Blobby website modules...');
    
    // Performance first
    performanceMetrics.reportCoreWebVitals();
    
    // Accessibility & UX
    new ReducedMotionSupport();
    new FocusManagement();
    
    // Navigation & Scrolling
    new SmoothScroll();
    new ScrollSpy();
    new PageTransition();
    
    // Animations
    new ScrollAnimator();
    new ParallaxManager();
    
    // Interactions
    new ButtonInteractions();
    new SwipeNavigation();
    new LazyLoadManager();
    
    // Forms
    new FormValidator();

    console.log('All modules initialized successfully!');
  }

  // Start the app
  initializeApp();

  // Expose some utilities to window for external use
  window.BlobbyApp = {
    performanceMetrics,
    clearCache: () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
    }
  };
})();
