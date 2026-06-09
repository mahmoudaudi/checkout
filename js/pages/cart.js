document.addEventListener('DOMContentLoaded', function () {
  // Build progress steps — Cart is step 1
  buildProgressSteps('progress-steps', 1);

  // Mobile accordion toggle
  var toggle  = document.getElementById('summary-toggle');
  var body    = document.getElementById('order-summary-body');
  var chevron = document.getElementById('summary-chevron');

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    body.classList.toggle('order-summary__body--collapsed', expanded);
    chevron.classList.toggle('order-summary__toggle-chevron--open', !expanded);
  });

  // ── Cart quantity + remove logic ─────────────────────────────────────────────

  var SUBTOTAL_BASE = 0;
  var SHIPPING      = 12.99;
  var items         = [];

  // Build items state from DOM
  document.querySelectorAll('.cart-item').forEach(function (el) {
    var unitPrice = parseFloat(el.dataset.unitPrice) || 0;
    items.push({ el: el, qty: 1, unitPrice: unitPrice });
    SUBTOTAL_BASE += unitPrice;
  });

  function formatPrice(n) {
    return '$' + n.toFixed(2);
  }

  function recalc() {
    var subtotal = items.reduce(function (s, i) {
      return s + (i.qty > 0 ? i.qty * i.unitPrice : 0);
    }, 0);
    var total    = subtotal + SHIPPING;

    var el = document.getElementById('order-summary-body');
    var rows = el ? el.querySelectorAll('.order-summary__row') : [];
    if (rows[0]) rows[0].querySelector('dd').textContent = formatPrice(subtotal);
    var totalEl = el ? el.querySelector('.order-summary__total-value') : null;
    if (totalEl) totalEl.textContent = formatPrice(total);

    // Update toggle amount
    var toggleAmt = document.querySelector('.order-summary__toggle-amount');
    if (toggleAmt) toggleAmt.textContent = formatPrice(total);

    // Update item count in subtitle
    var count    = items.reduce(function (s, i) { return s + i.qty; }, 0);
    var subtitle = document.querySelector('.page__subtitle');
    if (subtitle) subtitle.textContent = count + (count === 1 ? ' item' : ' items') + ' — ready for checkout';
  }

  var proceedBtn = document.getElementById('proceed-btn');

  proceedBtn.addEventListener('click', function () {
    window.location.href = 'personal-info.html';
  });

  items.forEach(function (item) {
    var decBtn  = item.el.querySelector('.cart-item__qty-btn--dec');
    var incBtn  = item.el.querySelector('.cart-item__qty-btn--inc');
    var qtyEl   = item.el.querySelector('.cart-item__qty-value');
    var priceEl = item.el.querySelector('[data-item-price]');

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
});
