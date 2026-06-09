# Checkout Flow

A production-quality, multi-step checkout flow built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no dependencies.

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

The project is plain HTML/CSS/JS with no build step. You can open it directly in a browser or serve it with any local server.

**Option 1 — Open directly**

Double-click `index.html` in your file explorer, or drag it into a browser tab.

**Option 2 — Node.js**

```bash
npx serve .
# Visit http://localhost:3000
```

**Option 3 — Python 3**

```bash
python -m http.server 8080
# Visit http://localhost:8080
```

**Option 4 — VS Code Live Server**

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

No `npm install`, no build step, no configuration required.

---

## Project Structure

```
checkout-project/
├── index.html              # Step 1 — Cart & order summary
├── personal-info.html      # Step 2 — Name, email, phone
├── address.html            # Step 3 — Shipping + optional billing address
├── payment.html            # Step 4 — Card details with live preview
├── confirmation.html       # Step 5 — Review all details before paying
├── processing.html         # Transition — animated payment loading screen
├── success.html            # Terminal — order confirmed + confetti
├── failure.html            # Terminal — payment failed + recovery options
│
├── css/
│   ├── variables.css       # Design tokens — colors, spacing, radius, shadows
│   ├── base.css            # Reset, global typography, keyframe animations
│   ├── layout.css          # Split layout, page wrappers, review sections
│   └── components/
│       ├── button.css      # All button variants and states
│       ├── card.css        # Cart items, order summary, empty cart state
│       ├── card-preview.css # Animated floating credit card (payment page)
│       ├── form.css        # Form fields, phone input, billing checkbox
│       ├── progress-steps.css # 6-step progress indicator
│       ├── processing.css  # Payment loading screen
│       └── result.css      # Success and failure terminal pages
│
└── js/
    ├── data/
    │   └── countries.js    # Country list with ISO codes and flag emojis
    ├── shared/
    │   ├── state.js        # CheckoutState — sessionStorage wrapper
    │   └── progress-steps.js # buildProgressSteps() — builds the step indicator
    └── pages/
        ├── cart.js         # Qty controls, remove items, proceed guard
        ├── personal-info.js # Name/email/phone validation + save
        ├── address.js      # Shipping + billing address, country select
        ├── payment.js      # Card formatting, type detection, live preview
        ├── confirmation.js # Reads state and renders review summary
        ├── processing.js   # Simulated payment delay + redirect
        └── success.js      # Order number, delivery estimate, copy button
```

---

## Architecture Decisions

### Multi-Page Application (MPA)

The checkout is implemented as a set of separate HTML pages. Each page is fully self-contained: it loads its own CSS and JS, reads state on mount, and writes back on submit. Navigation between steps uses `window.location.href`.

This approach was chosen deliberately:
- **No framework overhead.** Each page is a plain HTML document — readable without any build tooling or prior framework knowledge.
- **Natural browser behavior.** The browser handles page transitions, scroll restoration, and history natively. The back button works exactly as expected.
- **Easy to audit.** Inspecting any page in DevTools shows exactly what's happening, with no virtual DOM or compiled output in the way.

### SessionStorage State

`js/shared/state.js` exports a `CheckoutState` IIFE that wraps `sessionStorage`. It provides two methods:

```js
CheckoutState.get()        // returns the full state object
CheckoutState.set(updates) // shallow-merges updates and persists
```

State shape:

```js
{
  personalInfo: { fullName, email, phone },
  addressInfo: {
    country, city, addressLine1, addressLine2, postalCode,
    sameAsBilling,
    billingCountry, billingCity, billingAddressLine1,
    billingAddressLine2, billingPostalCode,
  },
  paymentInfo: { cardholderName, cardNumber, expiryDate, cvv },
}
```

Each page reads from `CheckoutState.get()` on load (to restore previously entered values when navigating back) and writes via `CheckoutState.set()` on submit. `sessionStorage` scopes the state to the current browser tab and clears it when the tab is closed.

### BEM CSS + Design Tokens

All class names follow the `Block__Element--Modifier` convention. All colors, spacing values, border radii, shadows, and transitions are CSS custom properties defined in `css/variables.css`. No hardcoded values appear elsewhere in the stylesheets — changing the visual language is a single-file edit.

### XSS Prevention

User input is always written to the DOM via `element.textContent`, never `innerHTML`. The only `innerHTML` assignments in the codebase write static, hardcoded SVG strings.

---

## Validation Strategy

### Blur-First: Errors Appear After Leaving a Field

Each field tracks a `touched` boolean that starts as `false` and is set to `true` on the first `blur` event. Error messages are only shown when `touched === true`.

This means errors never appear while the user is typing for the first time. Once a field has been visited, errors update in real time on every `input` event — giving immediate positive feedback as the user corrects mistakes.

### Force-Validate on Submit

When the user presses Continue, every required field is force-validated regardless of its `touched` state. Fields that were skipped entirely (never focused) immediately show their error message and block navigation. The page scrolls to the first invalid field.

### HTML5 Constraint Validation API

Inputs use native validation attributes (`required`, `type="email"`, `pattern`, `minlength`). Validity is read with `input.checkValidity()`. Custom error copy is set with `input.setCustomValidity()` to replace default browser messages with human-friendly text.

### Billing Address Exclusion

Billing address inputs carry the `disabled` attribute while "Same as shipping" is checked. The HTML5 Constraint Validation API automatically excludes `disabled` inputs from validity checks, so they cannot block submission. When the checkbox is unchecked, `disabled` is removed and the fields re-enter validation.

---

## UX Decisions

### Split Layout

On desktop (≥ 1024 px), the form pages use a two-column split layout: a white form panel on the left and a dark order-summary sidebar on the right. Both columns fill the full viewport height with no page scroll — the form content scrolls independently if needed. On mobile, the columns stack vertically with the summary collapsed into an accordion.

### 6-Step Progress Indicator

A persistent progress bar at the top of every page shows position, completion, and direction. Completed steps show a checkmark with a gradient fill. The current step shows a filled circle with a glow shadow. Future steps show an outlined circle with a dashed connector line. On narrow screens (< 640 px), step labels are hidden and only the circles are shown.

### Live Card Preview

The payment page shows a floating credit card that updates in real time:

- **Card number** — formatted with spaces in the correct grouping (4-4-4-4 for standard cards, 4-6-5 for Amex)
- **Cardholder name** — mirrors the name field live
- **Expiry** — auto-inserts the `/` separator as the user types
- **Brand logo** — switches dynamically based on the detected card type

Card type detection from first digits:

| Type       | Leading digits                     |
|------------|------------------------------------|
| Visa       | 4                                  |
| Mastercard | 51–55 or 2221–2720 (new BIN range) |
| Amex       | 34 or 37                           |

For Amex: 15-digit format (4-6-5 grouping), 4-digit CVV. All others: 16-digit format (4-4-4-4), 3-digit CVV. The input `maxlength`, formatting, and card preview all adapt automatically.

### Cart Empty Guard

If the user removes all items from the cart, the Proceed button is disabled and an empty-state message replaces the item list. The page subtitle also updates to reflect the empty state. The button re-enables as soon as items are present.

### Mobile Order Summary Accordion

On mobile, the order summary collapses into a toggle that shows the running total. Tapping it expands the full itemized breakdown. On desktop, the toggle is hidden and the full summary is always visible in the sidebar.

### Billing Address Toggle

"Billing address same as shipping" is checked by default, hiding the billing form. Unchecking it reveals a separate billing address section. The visibility is driven by the `hidden` attribute toggled in JS — the inputs are also `disabled` while hidden to exclude them from validation.

### Success and Failure Pages

The **Success** page generates a random order number, calculates a 5–7 business day delivery estimate, shows a confetti animation, and provides a copy-to-clipboard button for the order number.

The **Failure** page provides three recovery paths: Retry Payment, Change Payment Method, and Return to Cart — along with a short list of common failure reasons to give users actionable context.

---

## Accessibility

- Semantic HTML throughout: `<main>`, `<aside>`, `<nav>`, `<article>`, `<section>`, `<fieldset>`, `<legend>`
- All form inputs have associated `<label>` elements via `for`/`id` pairs
- `aria-invalid="true"` is set on inputs that fail validation
- `aria-describedby` links each input to its error message element
- `aria-label` is used on all icon-only buttons
- `aria-expanded` and `aria-controls` on the mobile summary accordion toggle
- `aria-hidden="true"` on all decorative SVGs and background elements
- `role="alert"` on the failure page result card for immediate announcement
- All animations respect `@media (prefers-reduced-motion: reduce)`
- Error states use both color and an icon — never color alone
- Focus styles are preserved on all interactive elements
