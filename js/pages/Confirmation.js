document.addEventListener('DOMContentLoaded', function () {
  buildProgressSteps('progress-steps', 5);

  var state = CheckoutState.get();
  var pi    = state.personalInfo;
  var addr  = state.addressInfo;
  var pay   = state.paymentInfo;

  // Resolve country code (e.g. "US") → full name (e.g. "United States")
  function getCountryName(code) {
    if (!code) return '';
    if (typeof COUNTRIES !== 'undefined') {
      var match = COUNTRIES.find(function (c) { return c.code === code; });
      if (match) return match.flag + '  ' + match.name;
    }
    return code;
  }

  function addRow(dl, label, value) {
    if (!value) return;
    var div = document.createElement('div');
    div.className = 'review-section__row';
    var dt = document.createElement('dt');
    dt.className = 'review-section__row-label';
    dt.textContent = label;
    var dd = document.createElement('dd');
    dd.className = 'review-section__row-value';
    dd.textContent = value;
    div.appendChild(dt);
    div.appendChild(dd);
    dl.appendChild(div);
  }

  // Populate personal info
  var personalDl = document.getElementById('personal-details');
  addRow(personalDl, 'Full Name', pi.fullName);
  addRow(personalDl, 'Email',     pi.email);
  addRow(personalDl, 'Phone',     pi.phone);

  // Populate shipping address
  var addressDl = document.getElementById('address-details');
  addRow(addressDl, 'Address',     [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '));
  addRow(addressDl, 'City',        addr.city && addr.postalCode ? addr.city + ', ' + addr.postalCode : addr.city || addr.postalCode);
  addRow(addressDl, 'Country',     getCountryName(addr.country));

  // Populate payment (mask card number)
  var payDl  = document.getElementById('payment-details');
  var last4  = (pay.cardNumber || '').replace(/\D/g, '').slice(-4);
  var masked = '•••• •••• •••• ' + (last4 || '••••');

  addRow(payDl, 'Cardholder', pay.cardholderName || '—');
  addRow(payDl, 'Card Number', masked);
  if (pay.expiryDate) addRow(payDl, 'Expires', pay.expiryDate);

  // Confirm payment button
  var confirming = false;
  document.getElementById('confirm-btn').addEventListener('click', function () {
    if (confirming) return;
    confirming = true;
    var btn = document.getElementById('confirm-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Processing…';
    window.location.href = 'processing.html';
  });
});
