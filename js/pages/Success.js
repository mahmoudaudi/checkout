document.addEventListener('DOMContentLoaded', function () {
  const state = CheckoutState.get();
  const pi    = state.personalInfo;
  const pay   = state.paymentInfo;

  // Generate random order number
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ordNum = '';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) ordNum += '-';
    ordNum += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('order-number').textContent = ordNum;

  // Copy order number button
  const copyBtn = document.getElementById('copy-order-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const num = document.getElementById('order-number').textContent;
      const label = copyBtn.querySelector('span');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num).then(function () {
          label.textContent = 'Copied!';
          setTimeout(function () { label.textContent = 'Copy'; }, 2000);
        });
      } else {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = num;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        label.textContent = 'Copied!';
        setTimeout(function () { label.textContent = 'Copy'; }, 2000);
      }
    });
  }

  // Delivery estimate: 5–7 business days from today
  const today    = new Date();
  const earliest = new Date(today);
  const latest   = new Date(today);
  earliest.setDate(today.getDate() + 5);
  latest.setDate(today.getDate() + 7);

  const fmt = { month: 'short', day: 'numeric' };
  const earlyStr = earliest.toLocaleDateString('en-US', fmt);
  const lateStr  = latest.toLocaleDateString('en-US', Object.assign({ year: 'numeric' }, fmt));
  document.getElementById('delivery-date').textContent = earlyStr + ' – ' + lateStr;

  // Populate info cards (email + last4)
  const grid     = document.getElementById('info-grid');
  const email    = pi.email || '—';
  const last4    = (pay.cardNumber || '').replace(/\D/g, '').slice(-4) || '••••';
  const cardMask = '•••• ' + last4;

  const cards = [
    {
      icon: '<i data-lucide="mail" width="18" height="18" aria-hidden="true"></i>',
      label: 'Confirmation sent to',
      value: email,
    },
    {
      icon: '<i data-lucide="credit-card" width="18" height="18" aria-hidden="true"></i>',
      label: 'Charged to card ending',
      value: cardMask,
    },
  ];

  cards.forEach(function (c) {
    const div   = document.createElement('div');
    div.className = 'result__info-card';
    div.innerHTML =
      '<div class="result__info-icon-wrap" aria-hidden="true">' + c.icon + '</div>' +
      '<div class="result__info-body">' +
        '<p class="result__info-label">' + escapeHtml(c.label) + '</p>' +
        '<p class="result__info-value">' + escapeHtml(c.value) + '</p>' +
      '</div>';
    grid.appendChild(div);
  });
  if (typeof lucide !== 'undefined') lucide.createIcons();

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
  const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
  const COUNT  = 60;

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999;';
  document.body.appendChild(container);

  for (let i = 0; i < COUNT; i++) {
    (function (idx) {
      const el   = document.createElement('div');
      const size = 6 + Math.random() * 6;
      const x    = Math.random() * 100;
      const delay = Math.random() * 800;
      const dur   = 1000 + Math.random() * 1200;
      const color = COLORS[idx % COLORS.length];

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
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = '@keyframes confetti-fall{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(100vh) rotate(360deg)}}';
    document.head.appendChild(style);
  }

  setTimeout(function () {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 3000);
}
