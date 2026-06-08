/**
 * @module fieldBuilder
 * @description DOM factory for labelled form fields.
 *
 * ─── SOLID ───────────────────────────────────────────────────────────────────
 * S – Single Responsibility: this module only builds field DOM nodes.
 *     It does NOT attach events or run validation; callers do that.
 * O – Open / Closed: add a new field type by exporting a new function,
 *     without modifying existing ones.
 * D – Dependency Inversion: depends on the icon abstraction (icons.js),
 *     not on any concrete icon library.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Exported builders
 *   createField(config)       – <input> with optional leading icon + success icon
 *   createSelectField(config) – <select> with icon and disabled placeholder option
 */

import { icon as svgIcon } from '../components/icons.js';

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions (JSDoc only – no runtime cost)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration accepted by {@link createField}.
 *
 * @typedef {object} FieldConfig
 * @property {string}   id              - Unique id, also used for `name` and `aria-describedby`.
 * @property {string}   label           - Human-readable label text.
 * @property {string}   [type='text']   - HTML input type (text | email | tel | password …).
 * @property {string}   [iconName]      - Icon key from icons.js; omit for no icon.
 * @property {string}   placeholder     - Placeholder text shown when the field is empty.
 * @property {string}   value           - Pre-filled value (from state or empty string).
 * @property {boolean}  [required=true] - Whether the field is required.
 * @property {boolean}  [optional=false]- Appends an "(Optional)" badge to the label.
 * @property {string}   [pattern]       - HTML pattern attribute for format validation.
 * @property {string}   [patternMessage]- User-friendly message shown on pattern mismatch.
 * @property {number}   [maxlength]     - Maximum allowed character count.
 * @property {string}   [autocomplete]  - Browser autocomplete hint (e.g. 'email', 'name').
 * @property {string}   [extraClass]    - Extra CSS class(es) appended to the <input>.
 */

/**
 * Return value of {@link createField}.
 *
 * @typedef {object} FieldRefs
 * @property {HTMLDivElement}           wrapper       - Outermost `.form-field` wrapper.
 * @property {HTMLInputElement}         input         - The actual <input> element.
 * @property {HTMLElement|null}         iconEl        - Leading icon span (null if no icon).
 * @property {HTMLElement|null}         successIconEl - Trailing success checkmark (null if no icon).
 * @property {HTMLParagraphElement}     errorEl       - Hidden error message paragraph.
 */

// ─────────────────────────────────────────────────────────────────────────────
// createField
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a labelled `<input>` field with optional leading icon, success icon,
 * and an `aria-live` error paragraph beneath it.
 *
 * The caller is responsible for wiring up `input` events and validation.
 * This keeps the builder purely structural (Single Responsibility).
 *
 * @param {FieldConfig} config
 * @returns {FieldRefs}
 *
 * @example
 * const { wrapper, input, iconEl, successIconEl, errorEl } = createField({
 *   id: 'email', label: 'Email', type: 'email', iconName: 'mail',
 *   placeholder: 'you@example.com', value: '', autocomplete: 'email',
 * });
 * form.appendChild(wrapper);
 */
export function createField(config) {
  const {
    id, label, type = 'text', iconName, placeholder, value,
    required = true, optional = false,
    pattern, patternMessage, maxlength, autocomplete, extraClass = '',
  } = config;

  /* ── Wrapper ──────────────────────────────────────────────────────────── */
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  /* ── Label ────────────────────────────────────────────────────────────── */
  const lbl = document.createElement('label');
  lbl.className = 'form-field__label';
  lbl.htmlFor = id;
  lbl.textContent = label;

  if (optional) {
    // "(Optional)" span inside the label so screen readers announce it together
    const optSpan = document.createElement('span');
    optSpan.className = 'form-field__optional';
    optSpan.textContent = ' (Optional)';
    lbl.appendChild(optSpan);
  }

  /* ── Input ────────────────────────────────────────────────────────────── */
  const input = document.createElement('input');
  input.id   = id;
  input.name = id;
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;

  const iconClass = iconName ? 'form-field__input--with-icon' : '';
  input.className = ['form-field__input', iconClass, extraClass]
    .filter(Boolean).join(' ');

  if (required) input.required = true;
  if (pattern) {
    input.pattern = pattern;
    // Store for retrieval in validation helpers
    input.dataset.patternMessage = patternMessage ?? 'Invalid format';
  }
  if (maxlength)    input.maxLength   = maxlength;
  if (autocomplete) input.autocomplete = autocomplete;

  // aria-describedby links the input to its error paragraph for screen readers
  input.setAttribute('aria-describedby', `${id}-error`);

  /* ── Error paragraph ──────────────────────────────────────────────────── */
  const errorEl = document.createElement('p');
  errorEl.className = 'form-field__error';
  errorEl.id = `${id}-error`;
  errorEl.setAttribute('aria-live', 'polite'); // announced without interrupting the user
  errorEl.hidden = true;                        // hidden until validation runs

  /* ── Optional icon wrappers ───────────────────────────────────────────── */
  let iconEl      = null;
  let successIconEl = null;

  if (iconName) {
    const inputWrap = document.createElement('div');
    inputWrap.className = 'form-field__input-wrap';

    iconEl = document.createElement('span');
    iconEl.className = 'form-field__icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.innerHTML = svgIcon(iconName, 20);

    // Success checkmark appears when field value is valid
    successIconEl = document.createElement('span');
    successIconEl.className = 'form-field__success-icon';
    successIconEl.setAttribute('aria-hidden', 'true');
    successIconEl.innerHTML = svgIcon('check-circle', 20);
    successIconEl.hidden = true;

    inputWrap.appendChild(iconEl);
    inputWrap.appendChild(input);
    inputWrap.appendChild(successIconEl);

    wrapper.appendChild(lbl);
    wrapper.appendChild(inputWrap);
  } else {
    /* No icon: flat label → input layout */
    wrapper.appendChild(lbl);
    wrapper.appendChild(input);
  }

  wrapper.appendChild(errorEl);

  return { wrapper, input, iconEl, successIconEl, errorEl };
}

// ─────────────────────────────────────────────────────────────────────────────
// createSelectField
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a labelled `<select>` dropdown with a leading icon and a disabled
 * placeholder option as the first child.
 *
 * @param {{
 *   id:            string,
 *   label:         string,
 *   iconName:      string,
 *   placeholder:   string,
 *   options:       Array<{ value: string, text: string }>,
 *   selectedValue: string,
 *   autocomplete?: string,
 * }} config
 * @returns {{
 *   wrapper:  HTMLDivElement,
 *   select:   HTMLSelectElement,
 *   errorEl:  HTMLParagraphElement,
 * }}
 */
export function createSelectField({ id, label, iconName, placeholder, options, selectedValue, autocomplete }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  /* ── Label ────────────────────────────────────────────────────────────── */
  const lbl = document.createElement('label');
  lbl.className = 'form-field__label';
  lbl.htmlFor = id;
  lbl.textContent = label;

  /* ── Select wrapper (positions the icon absolutely) ───────────────────── */
  const selectWrap = document.createElement('div');
  selectWrap.className = 'form-field__input-wrap form-field__input-wrap--select';

  const iconEl = document.createElement('span');
  iconEl.className = 'form-field__icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.innerHTML = svgIcon(iconName, 20);

  /* ── Select ───────────────────────────────────────────────────────────── */
  const select = document.createElement('select');
  select.id       = id;
  select.name     = id;
  select.className = 'form-field__select';
  select.required  = true;
  if (autocomplete) select.autocomplete = autocomplete;
  select.setAttribute('aria-describedby', `${id}-error`);

  // Disabled placeholder forces an active choice
  const placeholderOpt = document.createElement('option');
  placeholderOpt.value    = '';
  placeholderOpt.textContent = placeholder;
  placeholderOpt.disabled = true;
  placeholderOpt.selected = !selectedValue;
  select.appendChild(placeholderOpt);

  for (const { value, text } of options) {
    const opt = document.createElement('option');
    opt.value       = value;
    opt.textContent = text;
    if (value === selectedValue) opt.selected = true;
    select.appendChild(opt);
  }

  /* ── Error paragraph ──────────────────────────────────────────────────── */
  const errorEl = document.createElement('p');
  errorEl.className = 'form-field__error';
  errorEl.id = `${id}-error`;
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.hidden = true;

  selectWrap.appendChild(iconEl);
  selectWrap.appendChild(select);
  wrapper.appendChild(lbl);
  wrapper.appendChild(selectWrap);
  wrapper.appendChild(errorEl);

  return { wrapper, select, errorEl };
}
