  if (!customElements.get('custom-popup-modal')) {
    class CustomPopupModal extends HTMLElement {
      constructor() {
        super();
        this.modal = this.querySelector('.cp-modal');
        this.closeButtons = this.querySelectorAll('[data-close-popup]');
        
        // Bind methods to maintain 'this' context
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleEscape = this.handleEscape.bind(this);

        this.init();
      }

      init() {
        // 1. Close Button logic
        this.closeButtons.forEach(btn => btn.addEventListener('click', this.close));
        
        // 2. Click outside modal box to close
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) this.close();
        });

        // 3. Escape key to close
        document.addEventListener('keydown', this.handleEscape);

        // 4. Global CTA Hijacker (Captures clicks anywhere on the page)
        document.addEventListener('click', this.handleGlobalClick);
      }

      get isOpen() {
        return this.modal.classList.contains('is-active');
      }

      open(e) {
        if (e) e.preventDefault();
        this.modal.classList.add('is-active');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevents background scrolling
      }

      close() {
        this.modal.classList.remove('is-active');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restores background scrolling
      }

      handleEscape(e) {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      }

      handleGlobalClick(e) {
        const target = e.target;
        
        // Identify valid CTA targets
        const cta = target.closest('a[href="#myform"]');
        
        if (!cta) return;

        // SAFEGUARD: Do not hijack core Shopify actions (Cart, Checkout, generic Submits)
        if (cta.type === 'submit' || cta.closest('form[action^="/cart"]') || cta.name === 'add' || cta.name === 'checkout') {
          return;
        }

        // Explicit link match
        if (cta.getAttribute('href') === '#myform') {
          this.open(e);
          return;
        }

        // Broad word-matching logic
        const text = cta.innerText.toLowerCase();
        const triggerWords = ['meet', 'contact', 'fill', 'get ', 'start', 'auditing', 'team', 'learn'];
        
        if (triggerWords.some(word => text.includes(word))) {
          this.open(e);
        }
      }
    }

    // Register Web Component
    customElements.define('custom-popup-modal', CustomPopupModal);
  }