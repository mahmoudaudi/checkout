document.addEventListener('DOMContentLoaded', function () {
  buildProgressSteps('progress-steps', 4);

  var state = CheckoutState.get();
  var info  = state.paymentInfo;

  // ── Card type detection & live formatting ────────────────────────────────────

  function detectType(digits) {
    if (/^4/.test(digits))               return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits))           return 'amex';
    if (/^(6011|64[4-9]|65)/.test(digits)) return 'discover';
    return 'unknown';
  }

  function formatNumber(digits, type) {
    if (type === 'amex') {
      return [digits.slice(0,4), digits.slice(4,10), digits.slice(10,15)].filter(Boolean).join(' ');
    }
    return (digits.match(/.{1,4}/g) || [digits]).join(' ');
  }

  // ── Live card preview ────────────────────────────────────────────────────────

  var previewName   = document.getElementById('card-name-preview');
  var previewNumber = document.getElementById('card-number-preview');
  var previewExpiry = document.getElementById('card-expiry-preview');
  var brandEl       = document.getElementById('card-brand');

  var CREDIT_CARD_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';

  function updateBrand(type) {
    brandEl.setAttribute('data-card-type', type);
    if (type === 'visa') {
      brandEl.innerHTML = '<span class="card-preview__brand-text card-preview__brand-text--visa">VISA</span>';
    } else if (type === 'amex') {
      brandEl.innerHTML = '<span class="card-preview__brand-text card-preview__brand-text--amex">AMEX</span>';
    } else if (type === 'mastercard') {
      brandEl.innerHTML = ''; // MC circles drawn via CSS pseudo-elements
    } else {
      brandEl.innerHTML = CREDIT_CARD_SVG;
    }
    // Amex CID lives on the front face — unflip the card when switching to Amex
    if (amexCid) {
      amexCid.hidden = (type !== 'amex');
      if (type === 'amex' && cardFlip) cardFlip.classList.remove('card-flip--flipped');
    }
  }

  var currentType = detectType((info.cardNumber || '').replace(/\D/g, ''));
  updateBrand(currentType);

  if (info.cardholderName) {
    document.getElementById('cardholderName').value = info.cardholderName;
    previewName.textContent = info.cardholderName;
  }
  if (info.cardNumber) {
    var savedDigits = info.cardNumber.replace(/\D/g, '');
    document.getElementById('cardNumber').value = formatNumber(savedDigits, currentType);
    previewNumber.textContent = formatNumber(savedDigits, currentType);
  }
  if (info.expiryDate) {
    document.getElementById('expiryDate').value = info.expiryDate;
    previewExpiry.textContent = info.expiryDate;
  }

  // ── Validation helper ────────────────────────────────────────────────────────

  function attachValidation(inputId, iconId, onInput) {
    var input   = document.getElementById(inputId);
    var iconEl  = iconId ? document.getElementById(iconId) : null;
    var errorEl = document.getElementById(inputId + '-error');
    var touched = false;

    function sync(force) {
      var hasValue = input.value.trim().length > 0;
      var valid    = input.checkValidity();
      var showErr  = !valid && (hasValue || force) && (touched || force);

      input.classList.toggle('form-field__input--error', showErr);
      input.classList.toggle('form-field__input--valid', valid && hasValue);
      if (iconEl) {
        iconEl.classList.toggle('form-field__icon--error', showErr);
        iconEl.classList.toggle('form-field__icon--valid', valid && hasValue);
      }
      if (showErr) {
        errorEl.textContent = input.validity.patternMismatch || input.validity.customError
          ? (input.dataset.patternMessage && !input.validity.customError
              ? input.dataset.patternMessage
              : input.validationMessage)
          : input.validationMessage;
        errorEl.hidden = false;
        input.setAttribute('aria-invalid', 'true');
      } else {
        errorEl.hidden = true;
        input.setAttribute('aria-invalid', 'false');
      }
    }

    input.addEventListener('blur', function () { touched = true; sync(false); });
    input.addEventListener('input', function () {
      if (onInput) onInput();
      if (touched) sync(false);
    });
    input._forceValidate = function () { touched = true; sync(true); };
    return input;
  }

  // ── Cardholder name ──────────────────────────────────────────────────────────

  var holderInput = attachValidation('cardholderName', 'holder-icon', function () {
    previewName.textContent = document.getElementById('cardholderName').value || 'FULL NAME';
  });

  // ── Card number ──────────────────────────────────────────────────────────────

  var numberInput   = document.getElementById('cardNumber');
  var numberError   = document.getElementById('cardNumber-error');
  var numberTouched = false;
  var cvvInput      = document.getElementById('cvv'); // declared early — CVV constraints depend on card type

  numberInput.addEventListener('blur', function () {
    numberTouched = true;
    var valid    = numberInput.checkValidity();
    var hasValue = numberInput.value.trim().length > 0;
    numberInput.classList.toggle('form-field__input--error', !valid && hasValue);
    numberInput.classList.toggle('form-field__input--valid',  valid && hasValue);
    numberError.hidden = valid || !hasValue;
    if (!valid && hasValue) {
      numberError.textContent = numberInput.dataset.patternMessage;
      numberInput.setAttribute('aria-invalid', 'true');
    } else {
      numberInput.setAttribute('aria-invalid', 'false');
    }
  });

  numberInput.addEventListener('input', function () {
    var raw       = numberInput.value.replace(/\D/g, '');
    var type      = detectType(raw);
    var maxD      = type === 'amex' ? 15 : 16;
    var digits    = raw.slice(0, maxD);
    var formatted = formatNumber(digits, type);

    numberInput.value       = formatted;
    numberInput.maxLength   = type === 'amex' ? 17 : 19;
    numberInput.pattern     = type === 'amex' ? '[0-9]{4} [0-9]{6} [0-9]{5}' : '[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}';
    numberInput.placeholder = type === 'amex' ? '1234 567890 12345' : '1234 5678 9012 3456';

    previewNumber.textContent = digits
      ? formatNumber(digits, type)
      : (type === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••');
    updateBrand(type);

    // Amex uses 4-digit CID; all others use 3-digit CVV
    if (type !== currentType) {
      currentType = type;
      var isAmex = type === 'amex';
      cvvInput.maxLength  = isAmex ? 4 : 4;
      cvvInput.pattern    = isAmex ? '[0-9]{4}' : '[0-9]{3,4}';
      cvvInput.placeholder = isAmex ? '1234' : '123';
      cvvInput.dataset.patternMessage = isAmex ? 'Amex CID is 4 digits' : 'CVV must be 3 or 4 digits';
    }

    if (numberTouched) {
      var valid    = numberInput.checkValidity();
      var hasValue = digits.length > 0;
      numberInput.classList.toggle('form-field__input--error', !valid && hasValue);
      numberInput.classList.toggle('form-field__input--valid',  valid && hasValue);
      numberError.hidden = valid || !hasValue;
      if (!valid && hasValue) numberError.textContent = numberInput.dataset.patternMessage;
      numberInput.setAttribute('aria-invalid', valid ? 'false' : 'true');
    }
  });

  numberInput._forceValidate = function () {
    numberTouched = true;
    var valid    = numberInput.checkValidity();
    var hasValue = numberInput.value.trim().length > 0;
    numberInput.classList.toggle('form-field__input--error', !valid && hasValue);
    numberError.hidden = valid || !hasValue;
    if (!valid) { numberError.textContent = numberInput.dataset.patternMessage; numberInput.setAttribute('aria-invalid', 'true'); }
  };

  // ── Expiry ───────────────────────────────────────────────────────────────────

  // Set custom validity BEFORE attachValidation's listeners fire so sync() sees it
  var expiryEl = document.getElementById('expiryDate');
  function checkExpiryExpired() {
    var parts = expiryEl.value.match(/^(\d{2})\/(\d{2})$/);
    if (parts) {
      var mm = parseInt(parts[1], 10), yy = parseInt(parts[2], 10);
      var now = new Date(), curMM = now.getMonth() + 1, curYY = now.getFullYear() % 100;
      var expired = yy < curYY || (yy === curYY && mm < curMM);
      expiryEl.setCustomValidity(expired ? 'Card has expired' : '');
    } else {
      expiryEl.setCustomValidity('');
    }
  }
  expiryEl.addEventListener('input', checkExpiryExpired);
  expiryEl.addEventListener('blur',  checkExpiryExpired);

  var prevLen = (info.expiryDate || '').length;
  var expiryInput = attachValidation('expiryDate', 'expiry-icon', function () {
    var raw     = expiryEl.value.replace(/\D/g, '').slice(0, 4);
    var current = expiryEl.value;
    var fmt     = raw.length > 2 ? raw.slice(0, 2) + '/' + raw.slice(2) : raw;
    if (current.length > prevLen || raw.length > 2) expiryEl.value = fmt;
    prevLen = expiryEl.value.length;
    previewExpiry.textContent = expiryEl.value || 'MM/YY';
  });

  // ── CVV + card flip ──────────────────────────────────────────────────────────

  var cardFlip = document.getElementById('card-flip');
  var cvcBack  = document.getElementById('card-cvc-back');
  var cvcFront = document.getElementById('card-cvc-front');
  var amexCid  = document.getElementById('amex-cid');

  var cvvValidated = attachValidation('cvv', 'cvv-icon', function () {
    var val = document.getElementById('cvv').value;
    if (currentType === 'amex') {
      cvcFront.textContent = val || '••••';
    } else {
      cvcBack.textContent = val || '•••';
    }
  });

  document.getElementById('cvv').addEventListener('focus', function () {
    if (currentType !== 'amex') cardFlip.classList.add('card-flip--flipped');
  });
  document.getElementById('cvv').addEventListener('blur', function () {
    cardFlip.classList.remove('card-flip--flipped');
  });

  // ── Form submit ──────────────────────────────────────────────────────────────

  document.getElementById('pay-form').addEventListener('submit', function (e) {
    e.preventDefault();

    holderInput._forceValidate();
    numberInput._forceValidate();
    expiryInput._forceValidate();
    cvvValidated._forceValidate();

    var invalid = [holderInput, numberInput, expiryInput, cvvValidated]
      .find(function (i) { return !i.checkValidity(); });
    if (invalid) { invalid.focus(); return; }

    var nextBtn = document.getElementById('next-btn');
    nextBtn.disabled = true;
    nextBtn.querySelector('span').textContent = 'Saving…';

    // CVV is intentionally not saved — must never be stored even in sessionStorage
    CheckoutState.set({
      paymentInfo: {
        cardholderName: holderInput.value.trim(),
        cardNumber:     numberInput.value.replace(/\s/g, ''),
        expiryDate:     expiryInput.value.trim(),
      }
    });

    window.location.href = 'confirmation.html';
  });
});
