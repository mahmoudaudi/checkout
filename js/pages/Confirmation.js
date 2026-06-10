document.addEventListener('DOMContentLoaded', function () {
  buildProgressSteps('progress-steps', 5);

  const state = CheckoutState.get();
  const pi    = state.personalInfo;
  const addr  = state.addressInfo;
  const pay   = state.paymentInfo;

  // Resolves a country code → "🇺🇸  United States" for display
  function getCountryName(code) {
    if (!code) return '';
    if (typeof COUNTRIES !== 'undefined') {
      const match = COUNTRIES.find(function (c) { return c.code === code; });
      if (match) return match.flag + '  ' + match.name;
    }
    return code;
  }

  function addRow(dl, label, value) {
    if (!value) return;
    const div = document.createElement('div');
    div.className = 'review-section__row';
    const dt = document.createElement('dt');
    dt.className = 'review-section__row-label';
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.className = 'review-section__row-value';
    dd.textContent = value;
    div.appendChild(dt);
    div.appendChild(dd);
    dl.appendChild(div);
  }

  const personalDl = document.getElementById('personal-details');
  addRow(personalDl, 'Full Name', pi.fullName);
  addRow(personalDl, 'Email',     pi.email);
  addRow(personalDl, 'Phone',     pi.phone);

  const addressDl = document.getElementById('address-details');
  addRow(addressDl, 'Address', [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '));
  addRow(addressDl, 'City',    addr.city && addr.postalCode ? addr.city + ', ' + addr.postalCode : addr.city || addr.postalCode);
  addRow(addressDl, 'Country', getCountryName(addr.country));

  // Show last 4 digits only — full card number is never rendered
  const payDl  = document.getElementById('payment-details');
  const last4  = (pay.cardNumber || '').replace(/\D/g, '').slice(-4);
  const masked = '•••• •••• •••• ' + (last4 || '••••');

  addRow(payDl, 'Cardholder',  pay.cardholderName || '—');
  addRow(payDl, 'Card Number', masked);
  if (pay.expiryDate) addRow(payDl, 'Expires', pay.expiryDate);

  // Guard against double-submit if the user clicks rapidly
  let confirming = false;
  function handleConfirm() {
    if (confirming) return;
    confirming = true;
    ['confirm-btn', 'confirm-btn-mobile'].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.disabled = true;
      btn.querySelector('span').textContent = 'Processing…';
    });
    CheckoutState.set({ confirmed: true, step: 4 });
    window.location.href = 'processing.html';
  }
  document.getElementById('confirm-btn').addEventListener('click', handleConfirm);
  const mobileCta = document.getElementById('confirm-btn-mobile');
  if (mobileCta) mobileCta.addEventListener('click', handleConfirm);

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
