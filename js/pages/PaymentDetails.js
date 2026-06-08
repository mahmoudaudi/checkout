/**
 * @module PaymentDetails
 * @description Renders step 4 of 6: Payment Details (/checkout/payment).
 *
 * Collects: cardholder name, card number (16/15 digits), expiry (MM/YY), CVV.
 * Features:
 *   - Auto-detects card type (Visa / Mastercard / Amex) from first digits
 *   - Formats card number live: 4-4-4-4 (Visa/MC) or 4-6-5 (Amex)
 *   - Auto-inserts "/" in expiry date after MM
 *   - Updates CVV max length & placeholder based on card type (3 vs 4 digits)
 *   - Animated card preview that reflects all inputs in real time
 *   - Blur-first validation: errors appear after leaving a field, not while typing
 *
 * BEM blocks used: page, form-page, form-field, card-preview, btn
 */

import { getState, setState }         from '../state/store.js';
import { navigate }                   from '../router.js';
import { icon }                       from '../components/icons.js';
import { ProgressSteps }              from '../components/ProgressSteps.js';
import { CheckoutHeader }             from '../components/CheckoutHeader.js';
import { validateAll, firstInvalid }  from '../utils/validation.js';

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detects card network from first digits.
 * @param {string} digits - Raw digit string.
 * @returns {'visa'|'mastercard'|'amex'|'unknown'}
 */
function detectCardType(digits) {
  if (/^4/.test(digits))                          return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits))           return 'mastercard';
  if (/^3[47]/.test(digits))                      return 'amex';
  return 'unknown';
}

/**
 * Formats digits into grouped card number string.
 * Visa/MC: 4-4-4-4 — Amex: 4-6-5
 * @param {string} digits
 * @param {'visa'|'mastercard'|'amex'|'unknown'} type
 * @returns {string}
 */
function formatCardNumber(digits, type = 'unknown') {
  if (type === 'amex') {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

/**
 * Returns the regex pattern for the formatted card number field.
 * @param {'visa'|'mastercard'|'amex'|'unknown'} type
 * @returns {string} HTML pattern attribute value.
 */
function cardPattern(type) {
  return type === 'amex'
    ? '[0-9]{4} [0-9]{6} [0-9]{5}'
    : '[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}';
}

// ─────────────────────────────────────────────────────────────────────────────
// Blur-first validation helper
// Attaches blur + input listeners implementing the pattern:
//   - blur  → always validate (show errors)
//   - input → validate only if field was already touched (reduces noise)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   input: HTMLInputElement,
 *   errorEl: HTMLElement,
 *   iconEl?: HTMLElement|null
 * }} refs
 * @param {() => void} [onInputExtra] - Extra callback on input (e.g. update preview).
 */
function attachValidation(refs, onInputExtra) {
  const { input, errorEl, iconEl = null } = refs;
  let touched = false;

  const syncState = () => {
    const hasValue = input.value.trim().length > 0;
    const valid    = input.checkValidity();

    input.classList.toggle('form-field__input--error', !valid && (hasValue || touched));
    input.classList.toggle('form-field__input--valid',  valid && hasValue);
    if (iconEl) {
      iconEl.classList.toggle('form-field__icon--error', !valid && (hasValue || touched));
      iconEl.classList.toggle('form-field__icon--valid',  valid && hasValue);
    }
    if (!valid && (hasValue || touched)) {
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

  input.addEventListener('blur', () => { touched = true; syncState(); });
  input.addEventListener('input', () => {
    if (touched) syncState();
    if (onInputExtra) onInputExtra();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Card preview builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the animated aurora credit card preview.
 * aria-hidden — purely decorative; inputs are authoritative.
 *
 * @param {{ cardholderName: string, cardNumber: string, expiryDate: string }} initial
 * @returns {{
 *   el:          HTMLElement,
 *   setName:     (v: string) => void,
 *   setNumber:   (v: string) => void,
 *   setExpiry:   (v: string) => void,
 *   setCardType: (t: string) => void,
 * }}
 */
function buildCardPreview(initial) {
  const initialType = detectCardType(initial.cardNumber.replace(/\D/g, ''));

  const el = document.createElement('div');
  el.className = 'card-preview';
  el.setAttribute('aria-hidden', 'true');

  // Top row: chip + brand icon
  const chip = document.createElement('div');
  chip.className = 'card-preview__chip';

  const cardIconEl = document.createElement('div');
  cardIconEl.className = 'card-preview__brand-icon';

  const topRow = document.createElement('div');
  topRow.className = 'card-preview__top-row';
  topRow.appendChild(chip);
  topRow.appendChild(cardIconEl);

  // Card number
  const numberEl = document.createElement('p');
  numberEl.className   = 'card-preview__number';
  const rawDigits = initial.cardNumber.replace(/\D/g, '');
  numberEl.textContent = rawDigits
    ? formatCardNumber(rawDigits, initialType)
    : '•••• •••• •••• ••••';

  // Bottom row: name + expiry
  const bottomRow = document.createElement('div');
  bottomRow.className = 'card-preview__bottom-row';

  const nameGroup = document.createElement('div');
  nameGroup.className = 'card-preview__group';

  const nameLbl = document.createElement('span');
  nameLbl.className   = 'card-preview__group-label';
  nameLbl.textContent = 'CARDHOLDER';

  const nameVal = document.createElement('span');
  nameVal.className   = 'card-preview__group-value';
  nameVal.textContent = initial.cardholderName || 'FULL NAME';

  nameGroup.appendChild(nameLbl);
  nameGroup.appendChild(nameVal);

  const expiryGroup = document.createElement('div');
  expiryGroup.className = 'card-preview__group card-preview__group--right';

  const expiryLbl = document.createElement('span');
  expiryLbl.className   = 'card-preview__group-label';
  expiryLbl.textContent = 'EXPIRES';

  const expiryVal = document.createElement('span');
  expiryVal.className   = 'card-preview__group-value';
  expiryVal.textContent = initial.expiryDate || 'MM/YY';

  expiryGroup.appendChild(expiryLbl);
  expiryGroup.appendChild(expiryVal);

  bottomRow.appendChild(nameGroup);
  bottomRow.appendChild(expiryGroup);

  el.appendChild(topRow);
  el.appendChild(numberEl);
  el.appendChild(bottomRow);

  // Initialize brand icon
  const setCardType = (type) => {
    cardIconEl.setAttribute('data-card-type', type);
    if (type === 'visa') {
      cardIconEl.innerHTML = '<span class="card-preview__brand-text card-preview__brand-text--visa">VISA</span>';
    } else if (type === 'amex') {
      cardIconEl.innerHTML = '<span class="card-preview__brand-text card-preview__brand-text--amex">AMEX</span>';
    } else if (type === 'mastercard') {
      cardIconEl.innerHTML = ''; // CSS pseudo-elements render MC circles
    } else {
      cardIconEl.innerHTML = icon('credit-card', 22);
    }
  };

  setCardType(initialType);

  return {
    el,
    setName:     (v) => { nameVal.textContent   = v || 'FULL NAME'; },
    setNumber:   (v, type = 'unknown') => {
      const digits = v.replace(/\D/g, '');
      numberEl.textContent = digits
        ? formatCardNumber(digits, type)
        : (type === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••');
    },
    setExpiry:   (v) => { expiryVal.textContent = v || 'MM/YY'; },
    setCardType,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// mount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mounts the Payment Details page into `container`.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const { paymentInfo } = getState();

  // Tracks current detected card type across event handlers
  let currentCardType = detectCardType(paymentInfo.cardNumber.replace(/\D/g, ''));

  /* ── Page shell ── */
  const page = document.createElement('main');
  page.className = 'page';

  const inner = document.createElement('div');
  inner.className = 'page__inner';

  inner.appendChild(CheckoutHeader());
  inner.appendChild(ProgressSteps(4));

  /* ── Form card ── */
  const card = document.createElement('section');
  card.className = 'form-page';
  card.setAttribute('aria-labelledby', 'pay-title');

  const cardHeader = document.createElement('header');
  cardHeader.className = 'form-page__header form-page__header--icon-row';

  const headerIcon = document.createElement('div');
  headerIcon.className = 'form-page__header-icon';
  headerIcon.setAttribute('aria-hidden', 'true');
  headerIcon.innerHTML = icon('credit-card', 20);

  const h1 = document.createElement('h1');
  h1.id          = 'pay-title';
  h1.className   = 'form-page__title';
  h1.textContent = 'Payment Details';

  cardHeader.appendChild(headerIcon);
  cardHeader.appendChild(h1);

  const subtitle = document.createElement('p');
  subtitle.className   = 'form-page__subtitle';
  subtitle.textContent = 'Enter your card information securely';

  /* ── Card preview ── */
  const cardPreview = buildCardPreview(paymentInfo);

  /* ── Form ── */
  const form = document.createElement('form');
  form.className  = 'form';
  form.noValidate = true;
  form.setAttribute('aria-label', 'Payment details form');

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'form__group';

  const legend = document.createElement('legend');
  legend.className   = 'sr-only';
  legend.textContent = 'Card information';

  /* ── Cardholder name ── */
  const holderWrap  = document.createElement('div');
  holderWrap.className = 'form-field';

  const holderLbl = document.createElement('label');
  holderLbl.className = 'form-field__label';
  holderLbl.htmlFor   = 'cardholderName';
  holderLbl.textContent = 'Cardholder Name';

  const holderInputWrap = document.createElement('div');
  holderInputWrap.className = 'form-field__input-wrap';

  const holderIcon = document.createElement('span');
  holderIcon.className = 'form-field__icon';
  holderIcon.setAttribute('aria-hidden', 'true');
  holderIcon.innerHTML = icon('credit-card', 20);

  const holderInput = document.createElement('input');
  holderInput.id           = 'cardholderName';
  holderInput.name         = 'cardholderName';
  holderInput.type         = 'text';
  holderInput.placeholder  = 'John Doe';
  holderInput.value        = paymentInfo.cardholderName;
  holderInput.className    = 'form-field__input form-field__input--with-icon';
  holderInput.required     = true;
  holderInput.autocomplete = 'cc-name';
  holderInput.setAttribute('aria-describedby', 'cardholderName-error');

  const holderError = document.createElement('p');
  holderError.className = 'form-field__error';
  holderError.id        = 'cardholderName-error';
  holderError.setAttribute('aria-live', 'polite');
  holderError.hidden = true;

  holderInputWrap.appendChild(holderIcon);
  holderInputWrap.appendChild(holderInput);
  holderWrap.appendChild(holderLbl);
  holderWrap.appendChild(holderInputWrap);
  holderWrap.appendChild(holderError);

  attachValidation(
    { input: holderInput, errorEl: holderError, iconEl: holderIcon },
    () => cardPreview.setName(holderInput.value)
  );

  /* ── Card number — formats with spaces as user types ── */
  const numberWrap  = document.createElement('div');
  numberWrap.className = 'form-field';

  const numberLbl = document.createElement('label');
  numberLbl.className   = 'form-field__label';
  numberLbl.htmlFor     = 'cardNumber';
  numberLbl.textContent = 'Card Number';

  const numberInput = document.createElement('input');
  numberInput.id           = 'cardNumber';
  numberInput.name         = 'cardNumber';
  numberInput.type         = 'text';
  numberInput.inputMode    = 'numeric';
  numberInput.autocomplete = 'cc-number';
  numberInput.className    = 'form-field__input form-field__input--mono';
  numberInput.required     = true;
  numberInput.maxLength    = 19; // 16 digits + 3 spaces
  numberInput.setAttribute('aria-describedby', 'cardNumber-error');

  // Show stored value as formatted
  const storedDigits = paymentInfo.cardNumber.replace(/\D/g, '');
  numberInput.value   = storedDigits ? formatCardNumber(storedDigits, currentCardType) : '';
  numberInput.pattern = cardPattern(currentCardType);
  numberInput.dataset.patternMessage = 'Please enter a valid card number';

  // Placeholder changes with card type
  numberInput.placeholder = '1234 5678 9012 3456';

  const numberError = document.createElement('p');
  numberError.className = 'form-field__error';
  numberError.id        = 'cardNumber-error';
  numberError.setAttribute('aria-live', 'polite');
  numberError.hidden = true;

  numberWrap.appendChild(numberLbl);
  numberWrap.appendChild(numberInput);
  numberWrap.appendChild(numberError);

  /* Card number: format-as-you-type + card type detection */
  let numberTouched = false;
  numberInput.addEventListener('blur', () => {
    numberTouched = true;
    const valid    = numberInput.checkValidity();
    const hasValue = numberInput.value.trim().length > 0;
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

  numberInput.addEventListener('input', (e) => {
    const raw   = e.target.value.replace(/\D/g, '');
    const type  = detectCardType(raw);
    const maxD  = type === 'amex' ? 15 : 16;
    const digits = raw.slice(0, maxD);
    const formatted = formatCardNumber(digits, type);

    // Update input display
    e.target.value    = formatted;
    e.target.maxLength = type === 'amex' ? 17 : 19;
    e.target.pattern  = cardPattern(type);
    e.target.placeholder = type === 'amex' ? '1234 567890 12345' : '1234 5678 9012 3456';

    // Update card preview
    cardPreview.setNumber(formatted, type);
    cardPreview.setCardType(type);

    // Update CVV for Amex (4-digit) vs others (3-digit)
    if (type !== currentCardType) {
      currentCardType = type;
      const isAmex = type === 'amex';
      cvvInput.maxLength    = 4;
      cvvInput.pattern      = isAmex ? '[0-9]{4}' : '[0-9]{3,4}';
      cvvInput.placeholder  = isAmex ? '1234' : '123';
      cvvInput.dataset.patternMessage = isAmex
        ? 'Amex CVV is 4 digits'
        : 'CVV must be 3 or 4 digits';
    }

    if (numberTouched) {
      const valid    = e.target.checkValidity();
      const hasValue = digits.length > 0;
      e.target.classList.toggle('form-field__input--error', !valid && hasValue);
      e.target.classList.toggle('form-field__input--valid',  valid && hasValue);
      numberError.hidden = valid || !hasValue;
      if (!valid && hasValue) numberError.textContent = e.target.dataset.patternMessage;
      e.target.setAttribute('aria-invalid', valid ? 'false' : 'true');
    }
  });

  /* ── Expiry + CVV row ── */
  const twoCol = document.createElement('div');
  twoCol.className = 'form__row form__row--two-col';

  // Expiry date
  const expiryWrap = document.createElement('div');
  expiryWrap.className = 'form-field';

  const expiryLbl = document.createElement('label');
  expiryLbl.className   = 'form-field__label';
  expiryLbl.htmlFor     = 'expiryDate';
  expiryLbl.textContent = 'Expiry Date';

  const expiryInputWrap = document.createElement('div');
  expiryInputWrap.className = 'form-field__input-wrap';

  const expiryIcon = document.createElement('span');
  expiryIcon.className = 'form-field__icon';
  expiryIcon.setAttribute('aria-hidden', 'true');
  expiryIcon.innerHTML = icon('calendar', 20);

  const expiryInput = document.createElement('input');
  expiryInput.id           = 'expiryDate';
  expiryInput.name         = 'expiryDate';
  expiryInput.type         = 'text';
  expiryInput.inputMode    = 'numeric';
  expiryInput.placeholder  = 'MM/YY';
  expiryInput.value        = paymentInfo.expiryDate;
  expiryInput.className    = 'form-field__input form-field__input--with-icon form-field__input--mono';
  expiryInput.required     = true;
  expiryInput.maxLength    = 5;
  expiryInput.pattern      = '(0[1-9]|1[0-2])\\/[0-9]{2}';
  expiryInput.autocomplete = 'cc-exp';
  expiryInput.dataset.patternMessage = 'Format: MM/YY (e.g. 09/27)';
  expiryInput.setAttribute('aria-describedby', 'expiryDate-error');

  const expiryError = document.createElement('p');
  expiryError.className = 'form-field__error';
  expiryError.id        = 'expiryDate-error';
  expiryError.setAttribute('aria-live', 'polite');
  expiryError.hidden = true;

  expiryInputWrap.appendChild(expiryIcon);
  expiryInputWrap.appendChild(expiryInput);
  expiryWrap.appendChild(expiryLbl);
  expiryWrap.appendChild(expiryInputWrap);
  expiryWrap.appendChild(expiryError);

  // Expiry: auto-insert slash after 2 digits
  let prevExpiryLen = (paymentInfo.expiryDate || '').length;
  attachValidation(
    { input: expiryInput, errorEl: expiryError, iconEl: expiryIcon },
    () => {
      const raw     = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      const current = expiryInput.value;
      let   formatted = raw;
      if (raw.length > 2) formatted = raw.slice(0, 2) + '/' + raw.slice(2);
      // Only rewrite if length grew (avoid breaking backspace)
      if (current.length > prevExpiryLen || raw.length > 2) {
        expiryInput.value = formatted;
      }
      prevExpiryLen = expiryInput.value.length;
      cardPreview.setExpiry(expiryInput.value);
    }
  );

  // CVV — declared before numberInput listener uses it
  const cvvWrap = document.createElement('div');
  cvvWrap.className = 'form-field';

  const cvvLbl = document.createElement('label');
  cvvLbl.className   = 'form-field__label';
  cvvLbl.htmlFor     = 'cvv';
  cvvLbl.textContent = 'CVV';

  const cvvInputWrap = document.createElement('div');
  cvvInputWrap.className = 'form-field__input-wrap';

  const cvvIcon = document.createElement('span');
  cvvIcon.className = 'form-field__icon';
  cvvIcon.setAttribute('aria-hidden', 'true');
  cvvIcon.innerHTML = icon('key-round', 20);

  const cvvInput = document.createElement('input');
  cvvInput.id           = 'cvv';
  cvvInput.name         = 'cvv';
  cvvInput.type         = 'password';
  cvvInput.inputMode    = 'numeric';
  cvvInput.placeholder  = '123';
  cvvInput.value        = paymentInfo.cvv;
  cvvInput.className    = 'form-field__input form-field__input--with-icon form-field__input--mono';
  cvvInput.required     = true;
  cvvInput.maxLength    = 4;
  cvvInput.pattern      = '[0-9]{3,4}';
  cvvInput.autocomplete = 'cc-csc';
  cvvInput.dataset.patternMessage = 'CVV must be 3 or 4 digits';
  cvvInput.setAttribute('aria-describedby', 'cvv-error');

  const cvvError = document.createElement('p');
  cvvError.className = 'form-field__error';
  cvvError.id        = 'cvv-error';
  cvvError.setAttribute('aria-live', 'polite');
  cvvError.hidden = true;

  cvvInputWrap.appendChild(cvvIcon);
  cvvInputWrap.appendChild(cvvInput);
  cvvWrap.appendChild(cvvLbl);
  cvvWrap.appendChild(cvvInputWrap);
  cvvWrap.appendChild(cvvError);

  attachValidation({ input: cvvInput, errorEl: cvvError, iconEl: cvvIcon });

  twoCol.appendChild(expiryWrap);
  twoCol.appendChild(cvvWrap);

  /* ── Fields for bulk submit-time validation ── */
  const fields = [
    { input: holderInput, iconEl: holderIcon, successIconEl: null, errorEl: holderError },
    { input: numberInput, iconEl: null,       successIconEl: null, errorEl: numberError },
    { input: expiryInput, iconEl: expiryIcon, successIconEl: null, errorEl: expiryError },
    { input: cvvInput,    iconEl: cvvIcon,    successIconEl: null, errorEl: cvvError    },
  ];

  /* ── Navigation buttons ── */
  const actions = document.createElement('div');
  actions.className = 'form__actions';

  const backBtn = document.createElement('button');
  backBtn.type      = 'button';
  backBtn.className = 'btn btn--secondary';
  backBtn.innerHTML = `${icon('arrow-left', 20)}<span>Back</span>`;
  backBtn.setAttribute('aria-label', 'Go back to shipping address');
  backBtn.addEventListener('click', () => navigate('/checkout/address'));

  const nextBtn = document.createElement('button');
  nextBtn.type      = 'submit';
  nextBtn.className = 'btn btn--primary btn--icon-start';
  nextBtn.innerHTML = `${icon('lock', 20)}<span>Review Order</span>`;

  actions.appendChild(backBtn);
  actions.appendChild(nextBtn);

  /* ── Submit handler ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateAll(fields)) {
      firstInvalid(fields)?.input.focus();
      return;
    }

    // Disable to prevent double-submission
    nextBtn.disabled = true;
    nextBtn.innerHTML = `${icon('loader', 20)}<span>Saving…</span>`;

    setState({
      paymentInfo: {
        cardholderName: holderInput.value.trim(),
        cardNumber:     numberInput.value.replace(/\s/g, ''), // strip spaces before saving
        expiryDate:     expiryInput.value.trim(),
        cvv:            cvvInput.value.trim(),
      },
    });

    navigate('/checkout/confirmation');
  });

  /* ── Assemble DOM ── */
  fieldset.appendChild(legend);
  fieldset.appendChild(holderWrap);
  fieldset.appendChild(numberWrap);
  fieldset.appendChild(twoCol);

  form.appendChild(cardPreview.el);
  form.appendChild(fieldset);
  form.appendChild(actions);

  card.appendChild(cardHeader);
  card.appendChild(subtitle);
  card.appendChild(form);

  inner.appendChild(card);
  page.appendChild(inner);
  container.appendChild(page);
}
