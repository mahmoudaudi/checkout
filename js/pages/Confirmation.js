document.addEventListener('DOMContentLoaded', function () {
  buildProgressSteps('progress-steps', 5);

  var state = CheckoutState.get();
  var pi    = state.personalInfo;
  var addr  = state.addressInfo;
  var pay   = state.paymentInfo;

  // Populate personal info
  var personalDl = document.getElementById('personal-details');
  [pi.fullName, pi.email, pi.phone].forEach(function (val) {
    if (!val) return;
    var dd = document.createElement('dd');
    dd.textContent = val;
    personalDl.appendChild(dd);
  });

  // Populate shipping address
  var addressDl = document.getElementById('address-details');
  var addrLines = [
    addr.addressLine1,
    addr.addressLine2,
    (addr.city && addr.postalCode ? addr.city + ', ' + addr.postalCode : addr.city || addr.postalCode),
    addr.country,
  ];
  addrLines.forEach(function (val) {
    if (!val) return;
    var dd = document.createElement('dd');
    dd.textContent = val;
    addressDl.appendChild(dd);
  });

  // Populate payment (mask card number)
  var payDl  = document.getElementById('payment-details');
  var last4  = (pay.cardNumber || '').slice(-4);
  var masked = '•••• •••• •••• ' + (last4 || '••••');

  var nameRow = document.createElement('dd');
  nameRow.className = 'review-section__detail--bold';
  nameRow.textContent = pay.cardholderName || '—';
  payDl.appendChild(nameRow);

  var numRow = document.createElement('dd');
  numRow.className = 'review-section__detail--mono';
  numRow.textContent = masked;
  payDl.appendChild(numRow);

  if (pay.expiryDate) {
    var expRow = document.createElement('dd');
    expRow.className = 'review-section__detail--muted';
    expRow.textContent = 'Expires ' + pay.expiryDate;
    payDl.appendChild(expRow);
  }

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
