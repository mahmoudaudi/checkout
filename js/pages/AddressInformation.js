/**
 * @module AddressInformation
 * @description Renders step 3 of 6: Shipping Address (/checkout/address).
 *
 * Collects: country (select), city, address line 1, address line 2 (optional),
 * postal code, and a "billing same as shipping" toggle.
 *
 * Billing address:
 *   - When sameAsBilling = true (default): no billing form shown; billing = shipping
 *   - When sameAsBilling = false: a collapsible billing form slides in with the same
 *     address fields. Billing fields are only validated when visible.
 *
 * Validation: blur-first — errors appear after leaving a field, not while typing.
 *
 * BEM blocks used: page, form-page, form-field, billing-checkbox, btn
 */

import { getState, setState }        from '../state/store.js';
import { navigate }                  from '../router.js';
import { icon }                      from '../components/icons.js';
import { ProgressSteps }             from '../components/ProgressSteps.js';
import { COUNTRIES }                 from '../data/countries.js';
import { validateAll, firstInvalid } from '../utils/validation.js';

// ─────────────────────────────────────────────────────────────────────────────
// Blur-first validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attaches blur-first validation to an input or select.
 * @param {{ input: HTMLInputElement|HTMLSelectElement, errorEl: HTMLElement }} refs
 */
function attachBlurValidation({ input, errorEl }) {
  let touched = false;

  const sync = (forceError = false) => {
    const isSelect = input.tagName === 'SELECT';
    const hasValue = isSelect
      ? input.value !== ''
      : input.value.trim().length > 0;
    const valid   = input.checkValidity();
    const showErr = !valid && (hasValue || forceError) && (touched || forceError);

    input.classList.toggle(
      isSelect ? 'form-field__select--error' : 'form-field__input--error',
      showErr
    );
    input.classList.toggle('form-field__input--valid', !isSelect && valid && hasValue);

    if (showErr) {
      errorEl.textContent = input.validity.patternMismatch
        ? (input.dataset.patternMessage ?? input.validationMessage)
        : input.validationMessage;
      errorEl.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      errorEl.hidden = true;
      input.setAttribute('aria-invalid', 'false');
    }
  };

  const eventName = input.tagName === 'SELECT' ? 'change' : 'blur';
  input.addEventListener(eventName, () => { touched = true; sync(); });
  if (input.tagName !== 'SELECT') input.addEventListener('input', () => sync());

  input._forceValidate = () => { touched = true; sync(true); };
}

// ─────────────────────────────────────────────────────────────────────────────
// Field builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   id: string, label: string, type?: string, iconName: string,
 *   placeholder: string, value: string, required?: boolean,
 *   optional?: boolean, autocomplete?: string,
 * }} config
 * @returns {{ wrapper: HTMLElement, input: HTMLInputElement, errorEl: HTMLElement }}
 */
function buildInputField(config) {
  const {
    id, label, type = 'text', iconName, placeholder, value,
    required = true, optional = false, autocomplete,
  } = config;

  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const lbl = document.createElement('label');
  lbl.className   = 'form-field__label';
  lbl.htmlFor     = id;
  lbl.textContent = label;

  if (optional) {
    const optSpan = document.createElement('span');
    optSpan.className   = 'form-field__optional';
    optSpan.textContent = ' (Optional)';
    lbl.appendChild(optSpan);
  }

  const inputWrap = document.createElement('div');
  inputWrap.className = 'form-field__input-wrap';

  const inputIcon = document.createElement('span');
  inputIcon.className = 'form-field__icon';
  inputIcon.setAttribute('aria-hidden', 'true');
  inputIcon.innerHTML = icon(iconName, 20);

  const input = document.createElement('input');
  input.id          = id;
  input.name        = id;
  input.type        = type;
  input.placeholder = placeholder;
  input.value       = value;
  input.className   = 'form-field__input form-field__input--with-icon';
  if (required)     input.required     = true;
  if (autocomplete) input.autocomplete = autocomplete;
  input.setAttribute('aria-describedby', `${id}-error`);

  const errorEl = document.createElement('p');
  errorEl.className = 'form-field__error';
  errorEl.id        = `${id}-error`;
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.hidden = true;

  inputWrap.appendChild(inputIcon);
  inputWrap.appendChild(input);
  wrapper.appendChild(lbl);
  wrapper.appendChild(inputWrap);
  wrapper.appendChild(errorEl);

  if (required) attachBlurValidation({ input, errorEl });

  return { wrapper, input, errorEl };
}

/**
 * @param {string} idPrefix - Prefix for all field IDs (e.g. '' for shipping, 'billing' for billing).
 * @param {string} selectedValue - Pre-selected country code.
 * @returns {{ wrapper: HTMLElement, select: HTMLSelectElement, errorEl: HTMLElement }}
 */
function buildCountryField(idPrefix, selectedValue) {
  const id = idPrefix ? `${idPrefix}Country` : 'country';

  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const lbl = document.createElement('label');
  lbl.className   = 'form-field__label';
  lbl.htmlFor     = id;
  lbl.textContent = 'Country';

  const selectWrap = document.createElement('div');
  selectWrap.className = 'form-field__input-wrap form-field__input-wrap--select';

  const selectIcon = document.createElement('span');
  selectIcon.className = 'form-field__icon';
  selectIcon.setAttribute('aria-hidden', 'true');
  selectIcon.innerHTML = icon('globe', 20);

  const select = document.createElement('select');
  select.id          = id;
  select.name        = id;
  select.className   = 'form-field__select';
  select.required    = true;
  select.autocomplete = 'country';
  select.setAttribute('aria-describedby', `${id}-error`);

  const placeholder = document.createElement('option');
  placeholder.value       = '';
  placeholder.textContent = 'Select a country';
  placeholder.disabled    = true;
  placeholder.selected    = !selectedValue;
  select.appendChild(placeholder);

  for (const c of COUNTRIES) {
    const opt = document.createElement('option');
    opt.value       = c.code;
    opt.textContent = `${c.flag}  ${c.name}`;
    if (c.code === selectedValue) opt.selected = true;
    select.appendChild(opt);
  }

  const errorEl = document.createElement('p');
  errorEl.className = 'form-field__error';
  errorEl.id        = `${id}-error`;
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.hidden = true;

  selectWrap.appendChild(selectIcon);
  selectWrap.appendChild(select);
  wrapper.appendChild(lbl);
  wrapper.appendChild(selectWrap);
  wrapper.appendChild(errorEl);

  attachBlurValidation({ input: select, errorEl });

  return { wrapper, select, errorEl };
}

/**
 * @param {boolean} checked
 * @returns {{ wrapper: HTMLElement, checkbox: HTMLInputElement }}
 */
function buildBillingCheckbox(checked) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const label = document.createElement('label');
  label.className = 'billing-checkbox';
  label.htmlFor   = 'sameAsBilling';

  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.id        = 'sameAsBilling';
  checkbox.name      = 'sameAsBilling';
  checkbox.className = 'billing-checkbox__input';
  checkbox.checked   = checked;

  const textWrap = document.createElement('div');
  textWrap.className = 'billing-checkbox__text';

  const primary = document.createElement('span');
  primary.className   = 'billing-checkbox__primary';
  primary.textContent = 'Billing address same as shipping';

  const secondary = document.createElement('span');
  secondary.className   = 'billing-checkbox__secondary';
  secondary.textContent = 'Use my shipping address as billing address';

  textWrap.appendChild(primary);
  textWrap.appendChild(secondary);
  label.appendChild(checkbox);
  label.appendChild(textWrap);
  wrapper.appendChild(label);

  const syncCheckedStyle = () =>
    label.classList.toggle('billing-checkbox--checked', checkbox.checked);
  syncCheckedStyle();
  checkbox.addEventListener('change', syncCheckedStyle);

  return { wrapper, checkbox };
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing form section
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the collapsible billing address section.
 * Returns the section element and all field refs for validation.
 *
 * @param {{
 *   billingCountry: string, billingCity: string,
 *   billingAddressLine1: string, billingAddressLine2: string,
 *   billingPostalCode: string,
 * }} info
 * @returns {{
 *   el: HTMLElement,
 *   countrySelect: HTMLSelectElement,
 *   cityInput: HTMLInputElement,
 *   addr1Input: HTMLInputElement,
 *   addr2Input: HTMLInputElement,
 *   postalInput: HTMLInputElement,
 *   countryError: HTMLElement,
 *   cityError: HTMLElement,
 *   addr1Error: HTMLElement,
 *   postalError: HTMLElement,
 * }}
 */
function buildBillingForm(info) {
  const section = document.createElement('div');
  section.className = 'billing-form';
  section.setAttribute('aria-label', 'Billing address');

  const heading = document.createElement('p');
  heading.className   = 'billing-form__heading';
  heading.textContent = 'Billing Address';

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'form__group';

  const legend = document.createElement('legend');
  legend.className   = 'sr-only';
  legend.textContent = 'Billing address';

  const twoCol = document.createElement('div');
  twoCol.className = 'form__row form__row--two-col';

  const { wrapper: bCountryWrap, select: countrySelect, errorEl: countryError } =
    buildCountryField('billing', info.billingCountry);

  const { wrapper: bCityWrap, input: cityInput, errorEl: cityError } = buildInputField({
    id: 'billingCity', label: 'City', iconName: 'building',
    placeholder: 'New York', value: info.billingCity,
    autocomplete: 'address-level2',
  });

  twoCol.appendChild(bCountryWrap);
  twoCol.appendChild(bCityWrap);

  const { wrapper: bAddr1Wrap, input: addr1Input, errorEl: addr1Error } = buildInputField({
    id: 'billingAddressLine1', label: 'Address Line 1', iconName: 'home',
    placeholder: '123 Main Street', value: info.billingAddressLine1,
    autocomplete: 'address-line1',
  });

  const { wrapper: bAddr2Wrap, input: addr2Input } = buildInputField({
    id: 'billingAddressLine2', label: 'Address Line 2', iconName: 'map-pin',
    placeholder: 'Apt, suite, unit, etc.', value: info.billingAddressLine2 ?? '',
    required: false, optional: true, autocomplete: 'address-line2',
  });

  const { wrapper: bPostalWrap, input: postalInput, errorEl: postalError } = buildInputField({
    id: 'billingPostalCode', label: 'Postal Code', iconName: 'map-pin',
    placeholder: '10001', value: info.billingPostalCode,
    autocomplete: 'postal-code',
  });

  fieldset.appendChild(legend);
  fieldset.appendChild(twoCol);
  fieldset.appendChild(bAddr1Wrap);
  fieldset.appendChild(bAddr2Wrap);
  fieldset.appendChild(bPostalWrap);

  section.appendChild(heading);
  section.appendChild(fieldset);

  return {
    el: section,
    countrySelect, cityInput, addr1Input, addr2Input, postalInput,
    countryError, cityError, addr1Error, postalError,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// mount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mounts the Address Information page into `container`.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const { addressInfo } = getState();

  const page = document.createElement('main');
  page.className = 'page page--form';

  const inner = document.createElement('div');
  inner.className = 'page__inner';

  inner.appendChild(ProgressSteps(3));

  const card = document.createElement('section');
  card.className = 'form-page';
  card.setAttribute('aria-labelledby', 'addr-title');

  const cardHeader = document.createElement('header');
  cardHeader.className = 'form-page__header';

  const h1 = document.createElement('h1');
  h1.id          = 'addr-title';
  h1.className   = 'form-page__title';
  h1.textContent = 'Shipping Address';

  const subtitle = document.createElement('p');
  subtitle.className   = 'form-page__subtitle';
  subtitle.textContent = 'Where should we deliver your order?';

  cardHeader.appendChild(h1);
  cardHeader.appendChild(subtitle);

  const form = document.createElement('form');
  form.className  = 'form';
  form.noValidate = true;
  form.setAttribute('aria-label', 'Shipping address form');

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'form__group';

  const legend = document.createElement('legend');
  legend.className   = 'sr-only';
  legend.textContent = 'Delivery address';

  const twoCol = document.createElement('div');
  twoCol.className = 'form__row form__row--two-col';

  const { wrapper: countryWrap, select: countrySelect, errorEl: countryError } =
    buildCountryField('', addressInfo.country);

  const { wrapper: cityWrap, input: cityInput, errorEl: cityError } = buildInputField({
    id: 'city', label: 'City', iconName: 'building',
    placeholder: 'New York', value: addressInfo.city,
    autocomplete: 'address-level2',
  });

  twoCol.appendChild(countryWrap);
  twoCol.appendChild(cityWrap);

  const { wrapper: addr1Wrap, input: addr1Input, errorEl: addr1Error } = buildInputField({
    id: 'addressLine1', label: 'Address Line 1', iconName: 'home',
    placeholder: '123 Main Street', value: addressInfo.addressLine1,
    autocomplete: 'address-line1',
  });

  const { wrapper: addr2Wrap, input: addr2Input } = buildInputField({
    id: 'addressLine2', label: 'Address Line 2', iconName: 'map-pin',
    placeholder: 'Apt, suite, unit, etc.', value: addressInfo.addressLine2 ?? '',
    required: false, optional: true, autocomplete: 'address-line2',
  });

  const { wrapper: postalWrap, input: postalInput, errorEl: postalError } = buildInputField({
    id: 'postalCode', label: 'Postal Code', iconName: 'map-pin',
    placeholder: '10001', value: addressInfo.postalCode,
    autocomplete: 'postal-code',
  });

  const { wrapper: billingWrap, checkbox: billingCheckbox } =
    buildBillingCheckbox(addressInfo.sameAsBilling);

  /* ── Billing form (initially hidden when sameAsBilling = true) ── */
  const billing = buildBillingForm(addressInfo);
  billing.el.classList.toggle('billing-form--hidden', addressInfo.sameAsBilling);

  /* ── Fields for validation ── */
  const shippingFields = [
    { input: countrySelect, iconEl: null, successIconEl: null, errorEl: countryError },
    { input: cityInput,     iconEl: null, successIconEl: null, errorEl: cityError    },
    { input: addr1Input,    iconEl: null, successIconEl: null, errorEl: addr1Error   },
    { input: postalInput,   iconEl: null, successIconEl: null, errorEl: postalError  },
  ];

  const billingFields = [
    { input: billing.countrySelect, iconEl: null, successIconEl: null, errorEl: billing.countryError },
    { input: billing.cityInput,     iconEl: null, successIconEl: null, errorEl: billing.cityError    },
    { input: billing.addr1Input,    iconEl: null, successIconEl: null, errorEl: billing.addr1Error   },
    { input: billing.postalInput,   iconEl: null, successIconEl: null, errorEl: billing.postalError  },
  ];

  /* ── Billing toggle ── */
  billingCheckbox.addEventListener('change', () => {
    const same = billingCheckbox.checked;
    billing.el.classList.toggle('billing-form--hidden', same);
    billing.el.setAttribute('aria-hidden', String(same));
    // Disable billing fields when hidden so they don't interfere with validation
    for (const f of billingFields) {
      f.input.disabled = same;
    }
  });
  // Initial disabled state
  for (const f of billingFields) {
    f.input.disabled = addressInfo.sameAsBilling;
  }

  /* ── Navigation buttons ── */
  const actions = document.createElement('div');
  actions.className = 'form__actions';

  const backBtn = document.createElement('button');
  backBtn.type      = 'button';
  backBtn.className = 'btn btn--secondary';
  backBtn.innerHTML = `${icon('arrow-left', 20)}<span>Back</span>`;
  backBtn.setAttribute('aria-label', 'Go back to personal information');
  backBtn.addEventListener('click', () => navigate('/checkout/personal-info'));

  const nextBtn = document.createElement('button');
  nextBtn.type      = 'submit';
  nextBtn.className = 'btn btn--primary btn--icon-end';
  nextBtn.innerHTML = `<span>Continue to Payment</span>${icon('arrow-right', 20)}`;

  actions.appendChild(backBtn);
  actions.appendChild(nextBtn);

  /* ── Submit handler ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const activeFields = billingCheckbox.checked
      ? shippingFields
      : [...shippingFields, ...billingFields];

    if (!validateAll(activeFields)) {
      firstInvalid(activeFields)?.input.focus();
      return;
    }

    nextBtn.disabled = true;
    nextBtn.innerHTML = `${icon('loader', 20)}<span>Saving…</span>`;

    setState({
      addressInfo: {
        country:      countrySelect.value,
        city:         cityInput.value.trim(),
        addressLine1: addr1Input.value.trim(),
        addressLine2: addr2Input.value.trim(),
        postalCode:   postalInput.value.trim(),
        sameAsBilling: billingCheckbox.checked,
        billingCountry:      billing.countrySelect.value,
        billingCity:         billing.cityInput.value.trim(),
        billingAddressLine1: billing.addr1Input.value.trim(),
        billingAddressLine2: billing.addr2Input.value.trim(),
        billingPostalCode:   billing.postalInput.value.trim(),
      },
    });

    navigate('/checkout/payment');
  });

  /* ── Assemble DOM ── */
  fieldset.appendChild(legend);
  fieldset.appendChild(twoCol);
  fieldset.appendChild(addr1Wrap);
  fieldset.appendChild(addr2Wrap);
  fieldset.appendChild(postalWrap);
  fieldset.appendChild(billingWrap);

  form.appendChild(fieldset);
  form.appendChild(billing.el);
  form.appendChild(actions);

  card.appendChild(cardHeader);
  card.appendChild(form);

  inner.appendChild(card);
  page.appendChild(inner);
  container.appendChild(page);
}
