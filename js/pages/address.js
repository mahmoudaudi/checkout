document.addEventListener('DOMContentLoaded', function () {
  buildProgressSteps('progress-steps', 3);

  function populateCountries(selectId, savedValue) {
    var sel = document.getElementById(selectId);
    COUNTRIES.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.flag + '  ' + c.name;
      if (c.code === savedValue) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  var state = CheckoutState.get();
  var info  = state.addressInfo;

  populateCountries('country',        info.country);
  populateCountries('billingCountry', info.billingCountry);

  if (info.city)         document.getElementById('city').value         = info.city;
  if (info.addressLine1) document.getElementById('addressLine1').value = info.addressLine1;
  if (info.addressLine2) document.getElementById('addressLine2').value = info.addressLine2;
  if (info.postalCode)   document.getElementById('postalCode').value   = info.postalCode;
  if (info.billingCity)         document.getElementById('billingCity').value         = info.billingCity;
  if (info.billingAddressLine1) document.getElementById('billingAddressLine1').value = info.billingAddressLine1;
  if (info.billingAddressLine2) document.getElementById('billingAddressLine2').value = info.billingAddressLine2;
  if (info.billingPostalCode)   document.getElementById('billingPostalCode').value   = info.billingPostalCode;

  var checkbox     = document.getElementById('sameAsBilling');
  var billingForm  = document.getElementById('billing-form');
  var billingLabel = document.getElementById('billing-label');

  function syncBillingVisibility() {
    var same = checkbox.checked;
    billingForm.hidden = same;
    billingLabel.classList.toggle('billing-checkbox--checked', same);
    // Fields are only required when the billing section is visible
    ['billingCountry', 'billingCity', 'billingAddressLine1', 'billingPostalCode'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.required = !same;
    });
  }

  checkbox.checked = info.sameAsBilling !== false;
  syncBillingVisibility();
  checkbox.addEventListener('change', syncBillingVisibility);

  function attachValidation(id, isSelect) {
    var input   = document.getElementById(id);
    var errorEl = document.getElementById(id + '-error');
    if (!input || !errorEl) return input;
    var touched = false;

    function sync(force) {
      var hasValue = isSelect ? input.value !== '' : input.value.trim().length > 0;
      var valid    = input.checkValidity();
      var showErr  = !valid && (hasValue || force) && (touched || force);

      input.classList.toggle(isSelect ? 'form-field__select--error' : 'form-field__input--error', showErr);
      if (!isSelect) input.classList.toggle('form-field__input--valid', valid && hasValue);

      if (showErr) {
        errorEl.textContent = input.validationMessage;
        errorEl.hidden = false;
        input.setAttribute('aria-invalid', 'true');
      } else {
        errorEl.hidden = true;
        input.setAttribute('aria-invalid', 'false');
      }
    }

    var evt = isSelect ? 'change' : 'blur';
    input.addEventListener(evt, function () { touched = true; sync(false); });
    if (!isSelect) input.addEventListener('input', function () { sync(false); });
    input._forceValidate = function () { touched = true; sync(true); };
    return input;
  }

  var countryInput  = attachValidation('country',             true);
  var cityInput     = attachValidation('city',                false);
  var addr1Input    = attachValidation('addressLine1',        false);
  var postalInput   = attachValidation('postalCode',          false);
  var bCountryInput = attachValidation('billingCountry',      true);
  var bCityInput    = attachValidation('billingCity',         false);
  var bAddr1Input   = attachValidation('billingAddressLine1', false);
  var bPostalInput  = attachValidation('billingPostalCode',   false);

  document.getElementById('addr-form').addEventListener('submit', function (e) {
    e.preventDefault();

    var shipping = [countryInput, cityInput, addr1Input, postalInput];
    var billing  = [bCountryInput, bCityInput, bAddr1Input, bPostalInput];
    var active   = checkbox.checked ? shipping : shipping.concat(billing);
    var allValid = true;
    var firstErr = null;

    active.forEach(function (input) {
      if (input && !input.checkValidity()) {
        input._forceValidate();
        if (!firstErr) firstErr = input;
        allValid = false;
      }
    });

    if (!allValid) { if (firstErr) firstErr.focus(); return; }

    var nextBtn = document.getElementById('next-btn');
    nextBtn.disabled = true;
    nextBtn.querySelector('span').textContent = 'Saving…';

    CheckoutState.set({
      addressInfo: {
        country:      document.getElementById('country').value,
        city:         cityInput.value.trim(),
        addressLine1: addr1Input.value.trim(),
        addressLine2: document.getElementById('addressLine2').value.trim(),
        postalCode:   postalInput.value.trim(),
        sameAsBilling: checkbox.checked,
        billingCountry:      document.getElementById('billingCountry').value,
        billingCity:         document.getElementById('billingCity').value.trim(),
        billingAddressLine1: document.getElementById('billingAddressLine1').value.trim(),
        billingAddressLine2: document.getElementById('billingAddressLine2').value.trim(),
        billingPostalCode:   document.getElementById('billingPostalCode').value.trim(),
      }
    });

    window.location.href = 'payment.html';
  });
});
