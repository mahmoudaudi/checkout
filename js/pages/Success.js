document.addEventListener('DOMContentLoaded', function () {
  var state = CheckoutState.get();
  var pi    = state.personalInfo;
  var pay   = state.paymentInfo;

  // Generate random order number
  var chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var ordNum = '';
  for (var i = 0; i < 12; i++) {
    if (i === 4 || i === 8) ordNum += '-';
    ordNum += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('order-number').textContent = ordNum;

  // Delivery estimate: 5–7 business days from today
  var today    = new Date();
  var earliest = new Date(today);
  var latest   = new Date(today);
  earliest.setDate(today.getDate() + 5);
  latest.setDate(today.getDate() + 7);

  var fmt = { month: 'short', day: 'numeric' };
  var earlyStr = earliest.toLocaleDateString('en-US', fmt);
  var lateStr  = latest.toLocaleDateString('en-US', Object.assign({ year: 'numeric' }, fmt));
  document.getElementById('delivery-date').textContent = earlyStr + ' – ' + lateStr;

  // Populate info cards (email + last4)
  var grid     = document.getElementById('info-grid');
  var email    = pi.email || '—';
  var last4    = (pay.cardNumber || '').replace(/\D/g, '').slice(-4) || '••••';
  var cardMask = '•••• ' + last4;

  var cards = [
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
      label: 'Confirmation sent to',
      value: email,
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
      label: 'Charged to card ending',
      value: cardMask,
    },
  ];

  cards.forEach(function (c) {
    var div   = document.createElement('div');
    div.className = 'result__info-card';
    div.innerHTML =
      '<span class="result__info-icon" aria-hidden="true">' + c.icon + '</span>' +
      '<span class="result__info-label">' + escapeHtml(c.label) + '</span>' +
      '<span class="result__info-value">' + escapeHtml(c.value) + '</span>';
    grid.appendChild(div);
  });

  // Confetti burst (pure CSS + JS, no library)
  spawnConfetti();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function spawnConfetti() {
  var COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
  var COUNT  = 60;

  var container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999;';
  document.body.appendChild(container);

  for (var i = 0; i < COUNT; i++) {
    (function (idx) {
      var el   = document.createElement('div');
      var size = 6 + Math.random() * 6;
      var x    = Math.random() * 100;
      var delay = Math.random() * 800;
      var dur   = 1000 + Math.random() * 1200;
      var color = COLORS[idx % COLORS.length];

      el.style.cssText = [
        'position:absolute',
        'top:-' + size + 'px',
        'left:' + x + '%',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'background:' + color,
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px'),
        'opacity:0',
        'animation:confetti-fall ' + dur + 'ms ' + delay + 'ms ease-in forwards',
      ].join(';');
      container.appendChild(el);
    })(i);
  }

  if (!document.getElementById('confetti-style')) {
    var style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = '@keyframes confetti-fall{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(100vh) rotate(360deg)}}';
    document.head.appendChild(style);
  }

  setTimeout(function () {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 3000);
}
