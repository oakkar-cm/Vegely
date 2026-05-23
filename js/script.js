/* ============================================================
   Vegely — global interactions + persistent Cart store
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     Cart store — backed by localStorage, broadcasts updates
     ============================================================ */
  const CART_KEY = 'vegely.cart.v1';

  const Cart = {
    items: [],
    deliveryFlat: 3.0,
    freeDeliveryAt: 30.0,
    taxRate: 0.09,            // GST 9%
    memberDiscountRate: 0,    // 0.5 when member toggle active

    load() {
      try {
        const raw = localStorage.getItem(CART_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (data && Array.isArray(data.items)) {
          this.items = data.items;
          this.memberDiscountRate = Number(data.memberDiscountRate) || 0;
        }
      } catch {
        this.items = [];
      }
    },
    save() {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify({ items: this.items, memberDiscountRate: this.memberDiscountRate })
      );
      this.emit();
    },
    add(item) {
      if (!item || !item.id) return;
      const existing = this.items.find((i) => i.id === item.id);
      if (existing) existing.qty += 1;
      else this.items.push(Object.assign({}, item, { qty: 1 }));
      this.save();
    },
    setQty(id, qty) {
      const item = this.items.find((i) => i.id === id);
      if (!item) return;
      qty = Math.max(0, qty);
      if (qty === 0) this.remove(id);
      else {
        item.qty = qty;
        this.save();
      }
    },
    remove(id) {
      this.items = this.items.filter((i) => i.id !== id);
      this.save();
    },
    clear() {
      this.items = [];
      this.memberDiscountRate = 0;
      this.save();
    },

    count() {
      return this.items.reduce((n, i) => n + i.qty, 0);
    },
    subtotal() {
      return this.items.reduce((s, i) => s + i.qty * i.price, 0);
    },
    discountAmount() {
      return this.subtotal() * this.memberDiscountRate;
    },
    deliveryAmount() {
      if (this.items.length === 0) return 0;
      if (this.memberDiscountRate > 0) return 0;
      if (this.subtotal() >= this.freeDeliveryAt) return 0;
      return this.deliveryFlat;
    },
    taxAmount() {
      return Math.max(0, this.subtotal() - this.discountAmount()) * this.taxRate;
    },
    total() {
      return (
        Math.max(0, this.subtotal() - this.discountAmount()) +
        this.deliveryAmount() +
        this.taxAmount()
      );
    },
    setMember(active) {
      this.memberDiscountRate = active ? 0.5 : 0;
      this.save();
    },

    emit() {
      document
        .querySelectorAll('[data-cart-count]')
        .forEach((el) => (el.textContent = this.count()));
      document.dispatchEvent(new CustomEvent('vegely:cart'));
    },
  };

  Cart.load();
  Cart.emit();
  window.Vegely = { Cart };

  /* ============================================================
     Sticky navbar shadow on scroll
     ============================================================ */
  const nav = document.querySelector('.navbar-vegely');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     Mobile nav toggle
     ============================================================ */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMobile = document.querySelector('[data-nav-mobile]');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const open = navMobile.classList.toggle('open');
      navMobile.style.display = open ? 'block' : 'none';
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navMobile.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        navMobile.classList.remove('open');
        navMobile.style.display = 'none';
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ============================================================
     Fade-up on scroll
     ============================================================ */
  const fadeEls = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach((el) => io.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ============================================================
     Toast
     ============================================================ */
  function showToast(msg) {
    const toast = document.querySelector('[data-cart-toast]');
    if (!toast) return;
    toast.querySelector('[data-cart-toast-msg]').textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ============================================================
     Add to cart — read item data from surrounding card DOM
     so home & menu buttons don't need extra data attributes.
     ============================================================ */
  function readItemFromCard(btn) {
    const card = btn.closest('.menu-card, .dish-card');
    let name = btn.getAttribute('data-add-to-cart') || '';
    let price = 0,
      image = '',
      category = 'Dish',
      kcal = 0;

    if (card) {
      name = name || card.querySelector('h3')?.textContent.trim() || 'Item';
      image = card.querySelector('img')?.getAttribute('src') || '';
      const priceText = (card.querySelector('.price-val, .price')?.textContent || '').replace(/\s/g, '');
      const m = priceText.match(/([\d]+(?:\.[\d]+)?)/);
      price = m ? parseFloat(m[1]) : 0;
      const cat = card.querySelector('.badge-cat')?.textContent.trim();
      const tag = card.querySelector('.dish-meta .tag')?.textContent.trim();
      category = cat || (tag ? tag.split(/[·•]/)[0].trim() : 'Dish');
      const kcalText = card.querySelector('.badge-kcal')?.textContent || '';
      const km = kcalText.match(/\d+/);
      kcal = km ? parseInt(km[0], 10) : 0;
    }

    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return { id, name, price, image, category, kcal };
  }

  document.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const item = readItemFromCard(btn);
      Cart.add(item);
      const chip = document.querySelector('[data-cart]');
      if (chip)
        chip.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.12)' },
            { transform: 'scale(1)' },
          ],
          { duration: 320, easing: 'ease-out' }
        );
      showToast(`Added “${item.name}” to cart`);
    });
  });

  /* ============================================================
     Menu category filter
     ============================================================ */
  const tabs = document.querySelectorAll('[data-menu-tab]');
  const items = document.querySelectorAll('[data-menu-item]');
  if (tabs.length && items.length) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-menu-tab');
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        items.forEach((it) => {
          const c = it.getAttribute('data-category');
          it.style.display = cat === 'all' || c === cat ? '' : 'none';
        });
      });
    });
  }

  /* ============================================================
     Contact / Newsletter forms (demo)
     ============================================================ */
  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.info('[Vegely] form:', Object.fromEntries(new FormData(form).entries()));
      form.reset();
      showToast('Thanks! We will reach out shortly.');
    });
  });

  document.querySelectorAll('[data-newsletter]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.reset();
      showToast('You are subscribed.');
    });
  });

  /* ============================================================
     Year stamp
     ============================================================ */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ============================================================
     Cart page — only runs if [data-cart-root] is on the page
     ============================================================ */
  function fmt(n) {
    return 'S$' + Number(n).toFixed(2);
  }
  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }
  function etaWindow() {
    const start = new Date(Date.now() + 25 * 60 * 1000);
    const end = new Date(Date.now() + 40 * 60 * 1000);
    const fmtT = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return fmtT(start) + ' – ' + fmtT(end);
  }

  const cartRoot = document.querySelector('[data-cart-root]');
  if (cartRoot) {
    function renderEmpty() {
      return `
        <div class="empty-cart fade-up is-visible">
          <div class="empty-icon"><i class="bi bi-bag-heart"></i></div>
          <h2>Your cart is empty.</h2>
          <p class="lead-soft mx-auto">Start with one of our chef-crafted bowls — you'll wonder how lunch ever got better.</p>
          <a href="menu.html" class="btn btn-vegely mt-3">Browse menu <i class="bi bi-arrow-right ms-1"></i></a>
        </div>
      `;
    }

    function renderItems() {
      return Cart.items
        .map(
          (it) => `
        <article class="cart-line" data-line-id="${escapeHtml(it.id)}">
          <div class="line-img">
            <img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}" />
          </div>
          <div class="line-body">
            <div class="line-head">
              <div>
                <span class="line-cat">${escapeHtml(it.category || 'Dish')}${
            it.kcal ? ' · ' + it.kcal + ' kcal' : ''
          }</span>
                <h3>${escapeHtml(it.name)}</h3>
              </div>
              <button class="line-remove" type="button" data-line-remove="${escapeHtml(
                it.id
              )}" aria-label="Remove ${escapeHtml(it.name)}">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="line-foot">
              <div class="qty-stepper">
                <button type="button" data-line-dec="${escapeHtml(it.id)}" aria-label="Decrease"><i class="bi bi-dash"></i></button>
                <span class="qty">${it.qty}</span>
                <button type="button" data-line-inc="${escapeHtml(it.id)}" aria-label="Increase"><i class="bi bi-plus"></i></button>
              </div>
              <div class="line-price text-end">
                <div class="line-each">${fmt(it.price)} each</div>
                <div class="line-total">${fmt(it.price * it.qty)}</div>
              </div>
            </div>
          </div>
        </article>
      `
        )
        .join('');
    }

    function syncSummary() {
      document.querySelectorAll('[data-summary-count]').forEach((el) => (el.textContent = Cart.count()));
      document.querySelectorAll('[data-summary-subtotal]').forEach((el) => (el.textContent = fmt(Cart.subtotal())));
      document.querySelectorAll('[data-summary-discount]').forEach(
        (el) => (el.textContent = Cart.discountAmount() > 0 ? '−' + fmt(Cart.discountAmount()) : '—')
      );
      document.querySelectorAll('[data-summary-delivery]').forEach(
        (el) => (el.textContent = Cart.deliveryAmount() === 0 && Cart.items.length ? 'Free' : fmt(Cart.deliveryAmount()))
      );
      document.querySelectorAll('[data-summary-tax]').forEach((el) => (el.textContent = fmt(Cart.taxAmount())));
      document.querySelectorAll('[data-summary-total]').forEach((el) => (el.textContent = fmt(Cart.total())));
      document.querySelectorAll('[data-checkout-disabled]').forEach((btn) =>
        btn.toggleAttribute('disabled', Cart.items.length === 0)
      );

      // Free-delivery hint
      const hint = document.querySelector('[data-free-hint]');
      if (hint) {
        const remaining = Cart.freeDeliveryAt - Cart.subtotal();
        if (Cart.items.length === 0 || Cart.deliveryAmount() === 0) {
          hint.textContent = Cart.items.length === 0
            ? 'Add S$30 of bowls to unlock free delivery.'
            : 'You unlocked free delivery. Nice.';
          hint.classList.toggle('hint-success', Cart.items.length > 0 && Cart.deliveryAmount() === 0);
        } else {
          hint.textContent = `Add ${fmt(remaining)} more for free delivery.`;
          hint.classList.remove('hint-success');
        }
      }
    }

    function render() {
      cartRoot.innerHTML = Cart.items.length === 0 ? renderEmpty() : renderItems();
      syncSummary();
    }

    render();

    // Line item interactions
    cartRoot.addEventListener('click', (e) => {
      const inc = e.target.closest('[data-line-inc]');
      const dec = e.target.closest('[data-line-dec]');
      const rem = e.target.closest('[data-line-remove]');
      if (inc) {
        const id = inc.getAttribute('data-line-inc');
        const it = Cart.items.find((i) => i.id === id);
        if (it) Cart.setQty(id, it.qty + 1);
      } else if (dec) {
        const id = dec.getAttribute('data-line-dec');
        const it = Cart.items.find((i) => i.id === id);
        if (it) Cart.setQty(id, it.qty - 1);
      } else if (rem) {
        Cart.remove(rem.getAttribute('data-line-remove'));
      } else return;
      render();
    });

    // Member toggle
    const memberToggle = document.querySelector('[data-member-toggle]');
    if (memberToggle) {
      memberToggle.checked = Cart.memberDiscountRate > 0;
      memberToggle.addEventListener('change', () => {
        Cart.setMember(memberToggle.checked);
        syncSummary();
      });
    }

    // Promo code
    const promoForm = document.querySelector('[data-promo-form]');
    if (promoForm) {
      promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = (promoForm.querySelector('input').value || '').trim().toUpperCase();
        if (code === 'MEMBER50') {
          Cart.setMember(true);
          if (memberToggle) memberToggle.checked = true;
          showToast('Member discount activated — 50% off!');
          syncSummary();
        } else if (code === 'VEGELY10') {
          showToast('VEGELY10 applied — 10% off your first order at checkout.');
          promoForm.classList.add('applied');
        } else if (code === '') {
          showToast('Enter a promo code.');
        } else {
          showToast('Promo code not recognised.');
        }
      });
    }

    // Clear cart
    const clearBtn = document.querySelector('[data-cart-clear]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (Cart.items.length === 0) return;
        if (window.confirm('Remove all items from your cart?')) {
          Cart.clear();
          render();
        }
      });
    }

    // Place order
    const checkoutForm = document.querySelector('[data-checkout-form]');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (Cart.items.length === 0) {
          showToast('Your cart is empty.');
          return;
        }
        if (!checkoutForm.checkValidity()) {
          checkoutForm.reportValidity();
          return;
        }
        const data = Object.fromEntries(new FormData(checkoutForm).entries());
        const orderNo = 'VG-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const totalSnap = Cart.total();
        const itemsSnap = Cart.count();

        const modalEl = document.querySelector('#orderConfirmModal');
        if (modalEl && window.bootstrap) {
          modalEl.querySelector('[data-order-number]').textContent = orderNo;
          modalEl.querySelector('[data-order-total]').textContent = fmt(totalSnap);
          modalEl.querySelector('[data-order-items]').textContent =
            itemsSnap + ' item' + (itemsSnap === 1 ? '' : 's');
          modalEl.querySelector('[data-order-eta]').textContent = etaWindow();
          modalEl.querySelector('[data-order-name]').textContent = data.name || 'You';
          modalEl.querySelector('[data-order-address]').textContent =
            (data.address || '') + (data.unit ? ', ' + data.unit : '') + (data.postal ? ', S' + data.postal : '');
          window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }

        setTimeout(() => {
          Cart.clear();
          render();
          checkoutForm.reset();
        }, 350);
      });
    }
  }
})();
