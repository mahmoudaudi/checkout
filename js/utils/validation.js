/**
 * @module validation
 * @description Shared form-field validation utilities for the checkout flow.
 *
 * ─── SOLID ───────────────────────────────────────────────────────────────────
 * S – Single Responsibility: this module is solely responsible for reading
 *     validity state and updating the corresponding DOM feedback elements.
 *     It does NOT build DOM nodes — see fieldBuilder.js for that.
 * O – Open / Closed: extend by adding new exported functions, not by modifying
 *     the existing ones.
 * D – Dependency Inversion: has zero imports — depends only on the browser's
 *     Constraint Validation API and vanilla DOM methods.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Exported functions
 *   syncFieldState(refs)  – update one field's classes + error paragraph
 *   validateAll(fields)   – run syncFieldState on every field; return overall validity
 *   firstInvalid(fields)  – find the first field that fails checkValidity()
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DOM references describing a single form field's feedback elements.
 *
 * @typedef {object} FieldRefs
 * @property {HTMLInputElement|HTMLSelectElement} input        - The form control.
 * @property {HTMLElement|null}                  iconEl        - Leading icon (may be null).
 * @property {HTMLElement|null}                  successIconEl - Trailing success icon (may be null).
 * @property {HTMLElement}                       errorEl       - The aria-live error paragraph.
 */

// ─────────────────────────────────────────────────────────────────────────────
// syncFieldState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a single field's CSS modifier classes, error message, and
 * `aria-invalid` attribute based on its current Constraint Validation state.
 *
 * Calling this inside an `input` or `change` listener gives real-time feedback.
 * Called on submit it surfaces errors on fields the user hasn't touched.
 *
 * @param {FieldRefs} refs
 *
 * @example
 * input.addEventListener('input', () => syncFieldState({ input, iconEl, successIconEl, errorEl }));
 */
export function syncFieldState({ input, iconEl, successIconEl, errorEl }) {
  const hasValue = input.value.trim().length > 0;
  const valid    = input.checkValidity();

  /* ── Input modifier classes ───────────────────────────────────────────── */
  input.classList.toggle('form-field__input--error', !valid && hasValue);
  input.classList.toggle('form-field__input--valid',  valid && hasValue);

  /* ── Leading icon colour ──────────────────────────────────────────────── */
  if (iconEl) {
    iconEl.classList.toggle('form-field__icon--error', !valid && hasValue);
    iconEl.classList.toggle('form-field__icon--valid',  valid && hasValue);
  }

  /* ── Trailing success checkmark ───────────────────────────────────────── */
  if (successIconEl) {
    successIconEl.hidden = !(valid && hasValue);
  }

  /* ── Error paragraph ──────────────────────────────────────────────────── */
  if (!valid && hasValue) {
    // Prefer the author-supplied message for pattern mismatches over the
    // browser's generic "Please match the requested format" wording
    errorEl.textContent = input.validity.patternMismatch
      ? (input.dataset.patternMessage ?? input.validationMessage)
      : input.validationMessage;
    errorEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  } else {
    errorEl.hidden = true;
    input.setAttribute('aria-invalid', 'false');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// validateAll
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs {@link syncFieldState} on every field in the array.
 *
 * Surfaces error messages on all invalid fields (including untouched empty
 * required fields) so the user sees everything that needs fixing at once.
 *
 * @param {FieldRefs[]} fields
 * @returns {boolean} `true` only when every field passes `checkValidity()`.
 *
 * @example
 * form.addEventListener('submit', (e) => {
 *   e.preventDefault();
 *   if (!validateAll(fields)) {
 *     firstInvalid(fields)?.input.focus();
 *     return;
 *   }
 *   // proceed with submission …
 * });
 */
export function validateAll(fields) {
  let allValid = true;

  for (const refs of fields) {
    // Force the field into an "errored" state even when the user hasn't typed:
    // temporarily set value to '' so hasValue=false logic in syncFieldState
    // won't suppress the error — we mark required empties directly here.
    if (!refs.input.checkValidity()) {
      const isSelect = refs.input.tagName === 'SELECT';
      refs.input.classList.add(
        isSelect ? 'form-field__select--error' : 'form-field__input--error'
      );

      refs.errorEl.textContent = refs.input.validity.patternMismatch
        ? (refs.input.dataset.patternMessage ?? refs.input.validationMessage)
        : refs.input.validationMessage;
      refs.errorEl.hidden = false;
      refs.input.setAttribute('aria-invalid', 'true');

      allValid = false;
    }
  }

  return allValid;
}

// ─────────────────────────────────────────────────────────────────────────────
// firstInvalid
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the first `FieldRefs` object whose input fails `checkValidity()`,
 * or `undefined` if all fields are valid.
 *
 * Intended for focusing the first error after a failed submit attempt.
 *
 * @param {FieldRefs[]} fields
 * @returns {FieldRefs | undefined}
 *
 * @example
 * firstInvalid(fields)?.input.focus();
 */
export function firstInvalid(fields) {
  return fields.find(refs => !refs.input.checkValidity());
}
