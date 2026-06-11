document.addEventListener('DOMContentLoaded', function () {
  try { buildProgressSteps('progress-steps', 5); } catch (e) {}

  const state       = CheckoutState.get();
  const personalInfo = state.personalInfo;
  const addressInfo  = state.addressInfo;
  const paymentInfo  = state.paymentInfo;

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
  addRow(personalDl, 'Full Name', personalInfo.fullName);
  addRow(personalDl, 'Email',     personalInfo.email);
  addRow(personalDl, 'Phone',     personalInfo.phone);

  const addressDl = document.getElementById('address-details');
  addRow(addressDl, 'Address', [addressInfo.addressLine1, addressInfo.addressLine2].filter(Boolean).join(', '));
  addRow(addressDl, 'City',    addressInfo.city && addressInfo.postalCode ? addressInfo.city + ', ' + addressInfo.postalCode : addressInfo.city || addressInfo.postalCode);
  addRow(addressDl, 'Country', getCountryName(addressInfo.country));

  // Show last 4 digits only — full card number is never rendered
  const payDl  = document.getElementById('payment-details');
  const last4  = (paymentInfo.cardNumber || '').replace(/\D/g, '').slice(-4);
  const masked = '•••• •••• •••• ' + (last4 || '••••');

  addRow(payDl, 'Cardholder',  paymentInfo.cardholderName || '—');
  addRow(payDl, 'Card Number', masked);
  if (paymentInfo.expiryDate) addRow(payDl, 'Expires', paymentInfo.expiryDate);

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
    try { CheckoutState.set({ confirmed: true, step: 4 }); } catch (e) {}
    window.location.href = 'processing.html';
  }

  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
  const mobileCta = document.getElementById('confirm-btn-mobile');
  if (mobileCta) mobileCta.addEventListener('click', handleConfirm);

  const editPersonalBtn = document.getElementById('edit-personal-btn');
  if (editPersonalBtn) editPersonalBtn.addEventListener('click', function () { window.location.href = 'personal-info.html'; });
  const editAddressBtn = document.getElementById('edit-address-btn');
  if (editAddressBtn) editAddressBtn.addEventListener('click', function () { window.location.href = 'address.html'; });
  const editPaymentBtn = document.getElementById('edit-payment-btn');
  if (editPaymentBtn) editPaymentBtn.addEventListener('click', function () { window.location.href = 'payment.html'; });
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', function () { window.location.href = 'payment.html'; });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
