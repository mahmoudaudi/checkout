# Checkout Flow

A production-quality, multi-step checkout flow built in pure vanilla JavaScript — no frameworks, no build tools, no dependencies beyond a single CDN script for confetti. Inspired by the UX patterns of Stripe and Shopify.

---

## Table of Contents

1. [How to Run Locally](#how-to-run-locally)
2. [Project Structure](#project-structure)
3. [Architecture Decisions](#architecture-decisions)
4. [Validation Strategy](#validation-strategy)
5. [UX Decisions](#ux-decisions)
6. [Accessibility](#accessibility)

---

## How to Run Locally

The project uses ES modules (`type="module"`). ES modules require a proper HTTP server — opening `index.html` as a `file://` URL will not work.

**Option 1 — Node.js (no install needed)**

```bash
npx serve .
# Visit http://localhost:3000/checkout
```

**Option 2 — Python 3**

```bash
python -m http.server 8080
# Visit http://localhost:8080/checkout
```

**Option 3 — VS Code Live Server**

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

No `npm install`, no build step, no configuration required.

---

## Project Structure

```
checkout-project/
├── index.html                      # Single entry point — all <link> and <script> tags
├── css/
│   ├── base.css                    # Design tokens (variables), reset, global typography
│   ├── layout.css                  # Page wrapper, grids, form-page card, accordion, billing
│   ├── animations.css              # Keyframes: fadeIn, slideUp, shimmer, pulse, spin
│   └── components/
│       ├── button.css              # btn block — all variants, sizes, states, loading
│       ├── card.css                # cart-item, order-summary, info-card
│       ├── card-preview.css        # Animated floating credit card (payment page)
│       ├── form.css                # form-field, validation states, billing-checkbox
│       ├── progress-steps.css      # 6-step progress indicator
│       └── result.css              # Success / Failure terminal pages
└── js/
    ├── main.js                     # Registers routes and boots the router
    ├── router.js                   # Client-side SPA router (history.pushState)
    ├── state/
    │   └── store.js                # Pub/sub store — single source of truth
    ├── components/
    │   ├── icons.js                # Inline SVG icon factory
    │   ├── ProgressSteps.js        # 6-step progress indicator component
    │   └── validation.js           # Shared validateAll() force-validate utility
    └── pages/
        ├── CheckoutSummary.js      # Step 1 — Cart review + order summary
        ├── PersonalInformation.js  # Step 2 — Name, email, phone
        ├── AddressInformation.js   # Step 3 — Shipping + billing address
        ├── PaymentDetails.js       # Step 4 — Card entry with live preview
        ├── Confirmation.js         # Step 5 — Review all details before paying
        ├── Processing.js           # Transition — animated processing screen
        ├── Success.js              # Terminal — payment confirmed + confetti
        └── Failure.js              # Terminal — payment failed + recovery CTAs
```

---

## Architecture Decisions

### Pure Vanilla JS with ES Modules

No React, Vue, or build toolchain. Each page exports a single `mount(container)` function; the router calls it on navigation and replaces the container's entire contents. This keeps each page fully self-contained — no component tree to reconcile, no virtual DOM overhead.

ES modules provide native scoping at zero cost. Dynamic imports (`import(...)`) mean unused pages are never loaded until the user actually navigates to them.

### Client-Side SPA Router

`js/router.js` maps URL paths to page modules and drives navigation with `history.pushState`. URLs are bookmarkable and the browser back/forward buttons work correctly. A `popstate` listener handles history traversal without a full page reload.

### Pub/Sub State Store

`js/state/store.js` is a minimal global store: a plain JS object with `getState()`, `setState(patch)`, and `subscribe(listener)`. Pages read from the store on mount (to pre-fill forms) and write back on submit. State persists across navigation for the lifetime of the session, so navigating back to a previous step restores what the user already typed.

State shape:

```js
{
  orderItems:   [{ id, name, price, quantity, image }],
  personalInfo: { fullName, email, phone },
  addressInfo: {
    country, city, addressLine1, addressLine2, postalCode,
    sameAsBilling,
    billingCountry, billingCity, billingAddressLine1,
    billingAddressLine2, billingPostalCode,
  },
  paymentInfo:  { cardholderName, cardNumber, expiryDate, cvv },
}
```

### BEM CSS

All class names follow the `Block__Element--Modifier` convention. Layout utilities (`page`, `page__inner`, `page__grid`) live in `layout.css`. Component-specific styles live in `css/components/`. No specificity conflicts; modifiers override base styles with a single class.

All colors, spacing, shadows, and transitions are CSS custom properties defined in `base.css`. Changing the design system is a single-file edit.

### XSS Prevention

User-provided data is always written via `element.textContent`, never `innerHTML`. The only code that uses `innerHTML` is the icon factory in `icons.js`, which generates static SVG strings — never user input.

---

## Validation Strategy

### HTML5 Constraint Validation API

All inputs use native validation attributes (`required`, `type`, `pattern`, `minlength`). Validation state is read with `input.checkValidity()` and `input.validationMessage`. Custom error messages are set with `input.setCustomValidity()` to replace browser defaults ("Please fill in this field") with human-friendly copy ("Please enter your full name").

No third-party form validation library is needed.

### Blur-First: Show Errors After Leaving a Field

Each field tracks a `touched` boolean flag that starts as `false`. The flag is set on the first `blur` event. Error messages are only rendered when `touched === true`.

This means errors never appear while the user is actively typing for the first time — they only appear after the field loses focus. Once touched, the error updates in real time on every `input` event so the user sees immediate positive feedback as they correct mistakes.

### Force-Validate on Submit

When the user presses Continue, `validateAll()` runs across all required fields regardless of `touched` state. This ensures fields that were skipped entirely (e.g. tabbed past without typing) still show errors before navigation proceeds.

`validateAll()` calls each input's `_forceValidate()` method, which sets `touched = true` and triggers a sync, immediately showing the error message.

### Billing Address Exclusion

Billing address inputs carry the `disabled` attribute when "Same as shipping" is checked. The HTML5 Constraint Validation API excludes `disabled` inputs from validity checks automatically — they cannot block form submission. When the checkbox is unchecked, `disabled` is removed and the fields re-enter validation.

---

## UX Decisions

### 6-Step Progress Indicator

The checkout is split into six named steps: Cart → Personal Info → Address → Payment → Review → Confirmation. A persistent progress bar at the top of every page communicates position (how far into the flow the user is), completion (which steps are done, shown with a checkmark), and direction (what comes next). This reduces checkout abandonment by setting clear expectations about effort remaining.

On narrow mobile screens (< 640 px), step labels are hidden and only the step circles are shown to prevent overflow. Labels reappear on tablet and desktop.

### Live Card Preview

The payment page shows a floating credit card that updates in real time as the user types:

- **Card number** — formatted with spaces in the correct grouping (4-4-4-4 for standard cards, 4-6-5 for Amex)
- **Cardholder name** — mirrors the name input live
- **Expiry** — mirrors the MM/YY input with auto-slash insertion
- **Brand logo** — switches based on detected card type

Card type is detected from the first digits:

| Card type  | Leading digits                    |
|------------|-----------------------------------|
| Visa       | 4                                 |
| Mastercard | 51–55 or 2221–2720 (new BIN range)|
| Amex       | 34 or 37                          |

Amex uses 15-digit format (4-6-5 grouping). All other cards use 16-digit format (4-4-4-4). The input `maxLength`, `pattern`, and live card formatting all switch when Amex is detected. The CVV field adapts to 4 digits for Amex, 3 for all others.

### Mobile Order Summary Accordion

On mobile, the order summary collapses into a toggle button that shows the total amount. Tapping expands the full itemized list. On desktop (≥ 1024 px), the toggle is hidden and the full summary is visible as a sticky sidebar positioned at the top of the viewport.

The collapse animation uses `max-height` CSS transition (0 → 1000 px) since `height: auto` is not animatable with CSS transitions.

### Billing Address Toggle

A "Billing address same as shipping" checkbox (checked by default) hides the billing address form. Unchecking it slides in a separate billing form. The form shows/hides via the same `max-height` CSS transition pattern. Billing inputs are `disabled` while hidden so they are invisible to validation and excluded from form submission.

### Button Loading States

Submit and navigate buttons are immediately `disabled` on click and show a spinning loader icon. This prevents double-submission and gives the user confirmation that their action was registered. The spinner is a CSS `animation: spin` on an SVG icon — no animation library required.

### Success and Failure Terminal Pages

The **Success** page shows all 6 progress steps in the "done" state, a generated order number, a confetti celebration (skipped when `prefers-reduced-motion` is set), and two CTAs: Continue Shopping and View Order.

The **Failure** page provides three recovery paths: Retry Payment (re-submits with existing card details), Change Payment Method (navigates back to the payment form), and Return to Cart. A list of common failure reasons gives users actionable context rather than a generic error message.

---

## Accessibility

### Semantic HTML

Every page uses proper landmark elements: `<main>` for page content, `<aside>` for the order summary sidebar, `<section>` for review groups, `<article>` for info cards. Heading levels follow a strict hierarchy (h1 → h2 → h3) with no skipped levels. Form inputs have associated `<label>` elements via `for`/`id` pairs. Grouped fields use `<fieldset>` and `<legend>`.

### ARIA Attributes

| Attribute | Where used | Purpose |
|---|---|---|
| `aria-label` | Icon-only buttons (edit, back) | Provides a text description for screen readers |
| `aria-describedby` | Form inputs | Points to the error message element; screen readers announce it on focus |
| `aria-invalid="true"` | Inputs with validation errors | Tells assistive technology the field is invalid |
| `aria-expanded` | Mobile order summary toggle | Announces current collapsed/expanded state |
| `aria-controls` | Mobile order summary toggle | Points to the panel ID it controls |
| `aria-hidden="true"` | Decorative SVGs, background blobs | Removes visual-only elements from the accessibility tree |
| `role="alert"` | Failure page result card | Announces the error state immediately, without requiring focus |

### Keyboard Navigation

All interactive elements are focusable and operable with the keyboard in natural DOM tab order. No `tabindex` values greater than 0 are used. Focus styles (`outline`) are preserved — the CSS reset does not remove `:focus-visible` styles.

### Color and Motion

Error states use both color (red) and an icon — error information is never communicated by color alone. Text colors meet WCAG AA contrast ratios (4.5:1 for body text).

All CSS animations are wrapped in a `@media (prefers-reduced-motion: reduce)` rule in `base.css` that sets `animation-duration: 0.01ms` and `transition-duration: 0.01ms`. The confetti effect additionally checks `window.matchMedia('(prefers-reduced-motion: reduce)')` in JavaScript and skips entirely when set.
