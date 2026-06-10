document.addEventListener('DOMContentLoaded', function () {
  buildProgressSteps('progress-steps', 1);

  const toggle  = document.getElementById('summary-toggle');
  const body    = document.getElementById('order-summary-body');
  const chevron = document.getElementById('summary-chevron');

  toggle.addEventListener('click', function () {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    body.classList.toggle('order-summary__body--collapsed', expanded);
    chevron.classList.toggle('order-summary__toggle-chevron--open', !expanded);
  });

  const SHIPPING = 12.99;
  const items    = [];

  // Restore quantities so navigating Back from a later page doesn't reset the cart
  const savedQty = {};
  try {
    const saved = CheckoutState.get().cartInfo;
    if (saved && saved.items) {
      saved.items.forEach(function (i) { savedQty[String(i.id)] = i.qty; });
    }
  } catch (e) {}

  document.querySelectorAll('.cart-item').forEach(function (el) {
    const id        = String(el.dataset.itemId);
    const unitPrice = parseFloat(el.dataset.unitPrice) || 0;
    const qty       = (savedQty[id] && savedQty[id] > 0) ? savedQty[id] : 1;
    items.push({ el: el, id: id, qty: qty, unitPrice: unitPrice });
  });

  function formatPrice(n) { return '$' + n.toFixed(2); }

  function recalc() {
    const subtotal = items.reduce(function (s, i) { return s + i.qty * i.unitPrice; }, 0);
    const total    = subtotal + SHIPPING;

    const rows = body ? body.querySelectorAll('.order-summary__row') : [];
    if (rows[0]) rows[0].querySelector('dd').textContent = formatPrice(subtotal);
    const totalEl = body ? body.querySelector('.order-summary__total-value') : null;
    if (totalEl) totalEl.textContent = formatPrice(total);

    const toggleAmt = document.querySelector('.order-summary__toggle-amount');
    if (toggleAmt) toggleAmt.textContent = formatPrice(total);

    const count    = items.reduce(function (s, i) { return s + i.qty; }, 0);
    const subtitle = document.querySelector('.page__subtitle');
    if (subtitle) subtitle.textContent = count + (count === 1 ? ' item' : ' items') + ' — ready for checkout';
  }

  const proceedBtn = document.getElementById('proceed-btn');

  proceedBtn.addEventListener('click', function () {
    try {
      CheckoutState.set({
        cartInfo: {
          items: items.map(function (item) {
            return {
              id:        item.id,
              name:      item.el.querySelector('.cart-item__name').textContent.trim(),
              variant:   item.el.querySelector('.cart-item__badge').textContent.trim(),
              img:       item.el.querySelector('.cart-item__img').getAttribute('src'),
              unitPrice: item.unitPrice,
              qty:       item.qty
            };
          }),
          shipping: SHIPPING
        }
      });
    } catch (e) {}
    window.location.href = 'personal-info.html';
  });

  items.forEach(function (item) {
    const decBtn  = item.el.querySelector('.cart-item__qty-btn--dec');
    const incBtn  = item.el.querySelector('.cart-item__qty-btn--inc');
    const qtyEl   = item.el.querySelector('.cart-item__qty-value');
    const priceEl = item.el.querySelector('[data-item-price]');

    function render() {
      qtyEl.textContent   = item.qty;
      priceEl.textContent = formatPrice(item.qty * item.unitPrice);
      decBtn.disabled     = item.qty <= 1;
    }

    decBtn.addEventListener('click', function () {
      if (item.qty > 1) { item.qty--; render(); recalc(); }
    });

    incBtn.addEventListener('click', function () {
      item.qty++;
      render();
      recalc();
    });

    render();
  });

  recalc();
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
