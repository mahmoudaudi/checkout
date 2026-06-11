// Reads cartInfo from CheckoutState and re-renders the order summary
// on pages 2-5 so totals always reflect the actual cart quantities.
(function () {
  function fmt(n) { return '$' + n.toFixed(2); }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderOrderSummary() {
    const cart = CheckoutState.get().cartInfo;
    if (!cart || !Array.isArray(cart.items) || !cart.items.length) return;

    const subtotal = cart.items.reduce(function (s, i) { return s + i.unitPrice * i.qty; }, 0);
    const shipping = typeof cart.shipping === 'number' ? cart.shipping : 12.99;
    const total    = subtotal + shipping;

    // ── Desktop sidebar ───────────────────────────────────────────────────────
    const itemsEl = document.querySelector('.sidebar-summary__items');
    if (itemsEl) {
      itemsEl.innerHTML = cart.items.map(function (i) {
        return '<div class="sidebar-item">' +
          '<div class="sidebar-item__badge">' +
            '<div class="sidebar-item__img-wrap"><img src="' + esc(i.img) + '" alt="" class="sidebar-item__img" width="56" height="56" loading="lazy"></div>' +
            '<span class="sidebar-item__qty-badge" aria-hidden="true">' + i.qty + '</span>' +
          '</div>' +
          '<div class="sidebar-item__body">' +
            '<p class="sidebar-item__name">' + esc(i.name) + '</p>' +
            '<p class="sidebar-item__variant">' + esc(i.variant) + '</p>' +
          '</div>' +
          '<span class="sidebar-item__price">' + fmt(i.unitPrice * i.qty) + '</span>' +
        '</div>';
      }).join('');
    }

    const ddEls = document.querySelectorAll('.sidebar-summary__rows .sidebar-summary__row dd');
    if (ddEls[0]) ddEls[0].textContent = fmt(subtotal);
    if (ddEls[1]) ddEls[1].textContent = fmt(shipping);
    const totalEl = document.querySelector('.sidebar-summary__total dd');
    if (totalEl) totalEl.textContent = fmt(total);

    // ── Mobile accordion ──────────────────────────────────────────────────────
    const mstAmount = document.querySelector('.mst-amount');
    if (mstAmount) mstAmount.textContent = fmt(total);

    const mstBody = document.getElementById('mst-body');
    if (mstBody) {
      const itemsHtml = cart.items.map(function (i) {
        return '<div style="display:flex;align-items:center;gap:0.75rem;">' +
          '<img src="' + esc(i.img) + '" alt="" width="44" height="44" style="border-radius:8px;object-fit:cover;flex-shrink:0;" loading="lazy">' +
          '<div style="flex:1;min-width:0;">' +
            '<p style="font-size:0.8125rem;font-weight:600;color:#111827;line-height:1.3;">' + esc(i.name) + '</p>' +
            '<p style="font-size:0.6875rem;color:#9ca3af;margin-top:2px;">' + esc(i.variant) + '</p>' +
          '</div>' +
          '<span style="font-size:0.8125rem;font-weight:700;color:#111827;flex-shrink:0;">' + fmt(i.unitPrice * i.qty) + '</span>' +
        '</div>';
      }).join('');

      mstBody.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:0.75rem;">' + itemsHtml + '</div>' +
        '<div style="height:1px;background:#f3f4f6;margin-block:0.75rem;"></div>' +
        '<div style="display:flex;flex-direction:column;gap:0.375rem;">' +
          '<div style="display:flex;justify-content:space-between;font-size:0.875rem;color:#6b7280;"><span>Subtotal</span><span style="font-weight:600;color:#374151;">' + fmt(subtotal) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:0.875rem;color:#6b7280;"><span>Shipping</span><span style="font-weight:600;color:#374151;">' + fmt(shipping) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;color:#111827;margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid #f3f4f6;"><span>Total</span><span>' + fmt(total) + '</span></div>' +
        '</div>';
    }

    // ── Confirm & Pay buttons (confirmation page only) ────────────────────────
    ['confirm-btn', 'confirm-btn-mobile'].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      const span = btn.querySelector('span');
      if (span) span.textContent = 'Confirm & Pay ' + fmt(total);
    });
  }

  document.addEventListener('DOMContentLoaded', renderOrderSummary);
})();
