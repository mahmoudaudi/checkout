document.addEventListener('DOMContentLoaded', function () {
  buildProgressSteps('progress-steps', 2);

  const dialSelect = document.getElementById('dialCode');
  COUNTRIES.forEach(function (c) {
    const opt = document.createElement('option');
    opt.value = c.dial;
    opt.textContent = c.flag + ' ' + c.dial;
    dialSelect.appendChild(opt);
  });

  const state = CheckoutState.get();
  const info  = state.personalInfo;
  if (info.fullName) document.getElementById('fullName').value = info.fullName;
  if (info.email)    document.getElementById('email').value    = info.email;
  if (info.phone) {
    // Stored as "dialCode number" — split back on first space after dial code
    for (let i = 0; i < COUNTRIES.length; i++) {
      const c = COUNTRIES[i];
      if (info.phone.startsWith(c.dial + ' ')) {
        dialSelect.value = c.dial;
        document.getElementById('phone').value = info.phone.slice(c.dial.length).trim();
        break;
      }
    }
  }

  // Validates on blur (not on first keystroke) then live on every input after touched.
  // iconId / successId may be null for fields without those elements.
  function attachValidation(inputId, iconId, successId, errorId) {
    const input   = document.getElementById(inputId);
    const icon    = iconId    ? document.getElementById(iconId)    : null;
    const success = successId ? document.getElementById(successId) : null;
    const error   = document.getElementById(errorId);
    let touched = false;

    function sync(force) {
      const hasValue = input.value.trim().length > 0;
      const valid    = input.checkValidity();
      const showErr  = !valid && (hasValue || force) && (touched || force);

      input.classList.toggle('form-field__input--error', showErr);
      input.classList.toggle('form-field__input--valid', valid && hasValue);
      if (icon) {
        icon.classList.toggle('form-field__icon--error', showErr);
        icon.classList.toggle('form-field__icon--valid', valid && hasValue);
      }
      if (success) success.hidden = !(valid && hasValue);
      if (showErr) {
        error.textContent = input.validity.patternMismatch
          ? (input.dataset.patternMessage || input.validationMessage)
          : input.validationMessage;
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
      } else {
        error.hidden = true;
        input.setAttribute('aria-invalid', 'false');
      }
    }

    input.addEventListener('blur',  function () { touched = true; sync(false); });
    input.addEventListener('input', function () { sync(false); });
    input._forceValidate = function () { touched = true; sync(true); };
    return input;
  }

  const nameInput  = attachValidation('fullName', 'fullName-icon', 'fullName-success', 'fullName-error');
  const emailInput = attachValidation('email',    'email-icon',    'email-success',    'email-error');

  // Phone has its own wrapper (prefix select + number input) so handled separately
  const phoneInput = (function () {
    const input   = document.getElementById('phone');
    const error   = document.getElementById('phone-error');
    let touched = false;

    function sync(force) {
      const hasValue = input.value.trim().length > 0;
      const valid    = input.checkValidity() && hasValue;
      const showErr  = !valid && (hasValue || force) && (touched || force);
      input.classList.toggle('form-field__input--error', showErr);
      input.classList.toggle('form-field__input--valid', valid);
      if (showErr) {
        error.textContent = input.validity.patternMismatch
          ? input.dataset.patternMessage
          : input.validationMessage;
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
      } else {
        error.hidden = true;
        input.setAttribute('aria-invalid', 'false');
      }
    }

    input.addEventListener('blur',  function () { touched = true; sync(false); });
    input.addEventListener('input', function () { sync(false); });
    input._forceValidate = function () { touched = true; sync(true); };
    return input;
  })();

  document.getElementById('pi-form').addEventListener('submit', function (e) {
    e.preventDefault();

    nameInput._forceValidate();
    emailInput._forceValidate();
    phoneInput._forceValidate();

    if (!nameInput.checkValidity())  { nameInput.focus();  return; }
    if (!emailInput.checkValidity()) { emailInput.focus(); return; }
    if (!phoneInput.checkValidity()) { phoneInput.focus(); return; }

    const nextBtn = document.getElementById('next-btn');
    nextBtn.disabled = true;
    nextBtn.querySelector('span').textContent = 'Saving…';

    CheckoutState.set({
      personalInfo: {
        fullName: nameInput.value.trim(),
        email:    emailInput.value.trim(),
        phone:    dialSelect.value + ' ' + phoneInput.value.trim(),
      }
    });

    window.location.href = 'address.html';
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
