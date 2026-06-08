/**
 * @module PersonalInformation
 * @description Renders step 2 of 6: Personal Information (/checkout/personal-info).
 *
 * Collects: full name, email address, phone number (with dial-code prefix).
 *
 * Validation strategy — blur-first:
 *   - Errors appear after the user leaves a field (blur), not on every keystroke
 *   - Success checkmark appears as soon as the value is valid (even before blur)
 *   - On submit, all fields are force-validated and the first error is focused
 *
 * BEM blocks used: page, form-page, form-field, phone-field, btn
 */

import { getState, setState }         from '../state/store.js';
import { navigate }                   from '../router.js';
import { icon }                       from '../components/icons.js';
import { ProgressSteps }              from '../components/ProgressSteps.js';
import { CheckoutHeader }             from '../components/CheckoutHeader.js';
import { COUNTRIES as DIAL_CODES }    from '../data/countries.js';
import { validateAll, firstInvalid }  from '../utils/validation.js';

// ─────────────────────────────────────────────────────────────────────────────
// Blur-first validation helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attaches blur-first validation to a field.
 * Errors only appear after the first blur; success shows immediately on valid input.
 *
 * @param {{
 *   input:        HTMLInputElement,
 *   iconEl:       HTMLElement|null,
 *   successIconEl: HTMLElement|null,
 *   errorEl:      HTMLElement,
 * }} refs
 */
function attachBlurValidation(refs) {
  const { input, iconEl, successIconEl, errorEl } = refs;
  let touched = false;

  const sync = (forceError = false) => {
    const hasValue = input.value.trim().length > 0;
    const valid    = input.checkValidity();
    const showErr  = !valid && (hasValue || forceError) && (touched || forceError);

    input.classList.toggle('form-field__input--error', showErr);
    input.classList.toggle('form-field__input--valid',  valid && hasValue);

    if (iconEl) {
      iconEl.classList.toggle('form-field__icon--error', showErr);
      iconEl.classList.toggle('form-field__icon--valid',  valid && hasValue);
    }
    if (successIconEl) successIconEl.hidden = !(valid && hasValue);

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

  input.addEventListener('blur',  () => { touched = true; sync(); });
  input.addEventListener('input', () => sync());

  // Expose a force-validate function for submit-time validation
  input._forceValidate = () => { touched = true; sync(true); };
}

// ─────────────────────────────────────────────────────────────────────────────
// Field builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a labelled text/email input with leading icon, trailing success checkmark,
 * and an aria-live error paragraph. Attaches blur-first validation.
 *
 * @param {{
 *   id: string, label: string, type: string, iconName: string,
 *   placeholder: string, value: string, required?: boolean,
 *   pattern?: string, patternMessage?: string, autocomplete?: string,
 * }} config
 * @returns {{ wrapper: HTMLElement, input: HTMLInputElement, iconEl: HTMLElement, successIconEl: HTMLElement, errorEl: HTMLElement }}
 */
function buildField(config) {
  const {
    id, label, type, iconName, placeholder, value,
    required = true, pattern, patternMessage, autocomplete,
  } = config;

  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const lbl = document.createElement('label');
  lbl.className   = 'form-field__label';
  lbl.htmlFor     = id;
  lbl.textContent = label;

  const inputWrap = document.createElement('div');
  inputWrap.className = 'form-field__input-wrap';

  const iconEl = document.createElement('span');
  iconEl.className = 'form-field__icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.innerHTML = icon(iconName, 20);

  const input = document.createElement('input');
  input.id          = id;
  input.name        = id;
  input.type        = type;
  input.placeholder = placeholder;
  input.value       = value;
  input.className   = 'form-field__input form-field__input--with-icon';
  if (required)       input.required     = true;
  if (pattern)        input.pattern      = pattern;
  if (patternMessage) input.dataset.patternMessage = patternMessage;
  if (autocomplete)   input.autocomplete = autocomplete;
  input.setAttribute('aria-describedby', `${id}-error`);

  const successIconEl = document.createElement('span');
  successIconEl.className = 'form-field__success-icon';
  successIconEl.setAttribute('aria-hidden', 'true');
  successIconEl.innerHTML = icon('check-circle', 20);
  successIconEl.hidden = true;

  const errorEl = document.createElement('p');
  errorEl.className = 'form-field__error';
  errorEl.id        = `${id}-error`;
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.hidden = true;

  inputWrap.appendChild(iconEl);
  inputWrap.appendChild(input);
  inputWrap.appendChild(successIconEl);
  wrapper.appendChild(lbl);
  wrapper.appendChild(inputWrap);
  wrapper.appendChild(errorEl);

  attachBlurValidation({ input, iconEl, successIconEl, errorEl });

  return { wrapper, input, iconEl, successIconEl, errorEl };
}

/**
 * Builds the phone field: country dial-code select + number input.
 * @param {string} storedValue - Previously saved combined phone string.
 * @returns {{ wrapper: HTMLElement, input: HTMLInputElement, errorEl: HTMLElement, getFullValue: () => string }}
 */
function buildPhoneField(storedValue) {
  let savedDial   = DIAL_CODES[0];
  let savedNumber = storedValue;

  for (const dc of DIAL_CODES) {
    if (storedValue.startsWith(dc.dial + ' ') || storedValue === dc.dial) {
      savedDial   = dc;
      savedNumber = storedValue.slice(dc.dial.length).trim();
      break;
    }
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const lbl = document.createElement('label');
  lbl.className   = 'form-field__label';
  lbl.htmlFor     = 'phone';
  lbl.textContent = 'Phone Number';

  const inputWrap = document.createElement('div');
  inputWrap.className = 'form-field__input-wrap phone-field__wrap';

  const prefix = document.createElement('select');
  prefix.className    = 'phone-field__prefix';
  prefix.setAttribute('aria-label', 'Country dial code');
  prefix.autocomplete = 'tel-country-code';

  for (const dc of DIAL_CODES) {
    const opt = document.createElement('option');
    opt.value       = dc.dial;
    opt.textContent = `${dc.flag} ${dc.dial}`;
    if (dc.code === savedDial.code) opt.selected = true;
    prefix.appendChild(opt);
  }

  const input = document.createElement('input');
  input.id          = 'phone';
  input.name        = 'phone';
  input.type        = 'tel';
  input.placeholder = '555 123 4567';
  input.value       = savedNumber;
  input.className   = 'form-field__input phone-field__number';
  input.required    = true;
  input.autocomplete = 'tel-national';
  input.pattern     = '[0-9][0-9\\s\\-().]{5,14}';
  input.dataset.patternMessage = 'Please enter a valid phone number';
  input.setAttribute('aria-describedby', 'phone-error');

  const errorEl = document.createElement('p');
  errorEl.className = 'form-field__error';
  errorEl.id        = 'phone-error';
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.hidden = true;

  // Blur-first validation for phone (no icon/success elements)
  let touched = false;
  const syncPhone = (forceError = false) => {
    const hasValue = input.value.trim().length > 0;
    const valid    = input.checkValidity() && hasValue;
    const showErr  = !valid && (hasValue || forceError) && (touched || forceError);

    input.classList.toggle('form-field__input--error', showErr);
    input.classList.toggle('form-field__input--valid', valid);

    if (showErr) {
      errorEl.textContent = input.validity.patternMismatch
        ? input.dataset.patternMessage
        : input.validationMessage;
      errorEl.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      errorEl.hidden = true;
      input.setAttribute('aria-invalid', 'false');
    }
  };

  input.addEventListener('blur',   () => { touched = true; syncPhone(); });
  input.addEventListener('input',  () => syncPhone());
  prefix.addEventListener('change', () => { if (touched) syncPhone(); });
  input._forceValidate = () => { touched = true; syncPhone(true); };

  inputWrap.appendChild(prefix);
  inputWrap.appendChild(input);
  wrapper.appendChild(lbl);
  wrapper.appendChild(inputWrap);
  wrapper.appendChild(errorEl);

  return {
    wrapper, input, errorEl,
    getFullValue: () => `${prefix.value} ${input.value.trim()}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// mount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mounts the Personal Information page into `container`.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const { personalInfo } = getState();

  const page = document.createElement('main');
  page.className = 'page';

  const inner = document.createElement('div');
  inner.className = 'page__inner';

  inner.appendChild(CheckoutHeader());
  inner.appendChild(ProgressSteps(2));

  const card = document.createElement('section');
  card.className = 'form-page';
  card.setAttribute('aria-labelledby', 'pi-title');

  const cardHeader = document.createElement('header');
  cardHeader.className = 'form-page__header';

  const h1 = document.createElement('h1');
  h1.id          = 'pi-title';
  h1.className   = 'form-page__title';
  h1.textContent = 'Personal Information';

  const subtitle = document.createElement('p');
  subtitle.className   = 'form-page__subtitle';
  subtitle.textContent = "Let's start with your basic details";

  cardHeader.appendChild(h1);
  cardHeader.appendChild(subtitle);

  const form = document.createElement('form');
  form.className  = 'form';
  form.noValidate = true;
  form.setAttribute('aria-label', 'Personal information form');

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'form__group';

  const legend = document.createElement('legend');
  legend.className   = 'sr-only';
  legend.textContent = 'Contact details';

  const { wrapper: nameWrap, input: nameInput, errorEl: nameError } = buildField({
    id: 'fullName', label: 'Full Name', type: 'text',
    iconName: 'user', placeholder: 'John Doe',
    value: personalInfo.fullName, autocomplete: 'name',
  });

  const { wrapper: emailWrap, input: emailInput, errorEl: emailError } = buildField({
    id: 'email', label: 'Email Address', type: 'email',
    iconName: 'mail', placeholder: 'john@example.com',
    value: personalInfo.email, autocomplete: 'email',
    pattern: '[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}',
    patternMessage: 'Please enter a valid email address',
  });

  const { wrapper: phoneWrap, input: phoneInput, errorEl: phoneError, getFullValue: getPhone } =
    buildPhoneField(personalInfo.phone);

  const fields = [
    { input: nameInput,  iconEl: null, successIconEl: null, errorEl: nameError  },
    { input: emailInput, iconEl: null, successIconEl: null, errorEl: emailError },
    { input: phoneInput, iconEl: null, successIconEl: null, errorEl: phoneError },
  ];

  /* ── Navigation buttons ── */
  const actions = document.createElement('div');
  actions.className = 'form__actions';

  const backBtn = document.createElement('button');
  backBtn.type      = 'button';
  backBtn.className = 'btn btn--secondary';
  backBtn.innerHTML = `${icon('arrow-left', 20)}<span>Back</span>`;
  backBtn.setAttribute('aria-label', 'Go back to cart');
  backBtn.addEventListener('click', () => navigate('/checkout'));

  const nextBtn = document.createElement('button');
  nextBtn.type      = 'submit';
  nextBtn.className = 'btn btn--primary btn--icon-end';
  nextBtn.innerHTML = `<span>Continue to Address</span>${icon('arrow-right', 20)}`;

  actions.appendChild(backBtn);
  actions.appendChild(nextBtn);

  /* ── Submit handler ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateAll(fields)) {
      firstInvalid(fields)?.input.focus();
      return;
    }

    nextBtn.disabled = true;
    nextBtn.innerHTML = `${icon('loader', 20)}<span>Saving…</span>`;

    setState({
      personalInfo: {
        fullName: nameInput.value.trim(),
        email:    emailInput.value.trim(),
        phone:    getPhone(),
      },
    });

    navigate('/checkout/address');
  });

  /* ── Assemble ── */
  fieldset.appendChild(legend);
  fieldset.appendChild(nameWrap);
  fieldset.appendChild(emailWrap);
  fieldset.appendChild(phoneWrap);

  form.appendChild(fieldset);
  form.appendChild(actions);

  card.appendChild(cardHeader);
  card.appendChild(form);

  inner.appendChild(card);
  page.appendChild(inner);
  container.appendChild(page);
}
