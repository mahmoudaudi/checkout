# Checkout Flow

A production-quality, multi-step checkout flow built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no dependencies.

**[Live Demo →](https://checkout-steel-beta.vercel.app/)**

---

## Overview

This project implements a complete e-commerce checkout experience across 8 pages, covering every step from cart review to order confirmation. It was built to demonstrate clean UI architecture, thoughtful UX decisions, and robust form validation — without relying on any frontend framework or third-party library.

**Flow:** Cart → Personal Info → Address → Payment → Review → Processing → Success / Failure

---

## Table of Contents

1. [Live Demo](#live-demo)
2. [How to Run Locally](#how-to-run-locally)
3. [Project Structure](#project-structure)
4. [Architecture Decisions](#architecture-decisions)
5. [Validation Strategy](#validation-strategy)
6. [UX Decisions](#ux-decisions)
7. [Accessibility](#accessibility)

---

## Live Demo

> [https://checkout-steel-beta.vercel.app/](https://checkout-steel-beta.vercel.app/)

No account or setup required — open the link and walk through the full checkout flow.

---

## How to Run Locally

The project is plain HTML/CSS/JS with no build step.

**Option 1 — Open directly**

Double-click `index.html`, or drag it into a browser tab. No server needed.

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

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension → right-click `index.html` → **Open with Live Server**.

---

## Project Structure

```
checkout-project/
│
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
│   ├── variables.css           # Design tokens — colors, spacing, radius, shadows
│   ├── base.css                # Reset, global typography, keyframe animations
│   ├── layout.css              # Split layout, page wrappers, review sections
│   └── components/
│       ├── button.css          # All button variants and states
│       ├── card.css            # Cart items, order summary, empty cart state
│       ├── card-preview.css    # Animated floating credit card (payment page)
│       ├── form.css            # Form fields, phone input, billing checkbox
│       ├── progress-steps.css  # 6-step progress indicator
│       ├── processing.css      # Payment loading screen
│       └── result.css          # Success and failure terminal pages
│
└── js/
    ├── data/
    │   └── countries.js        # Country list with ISO codes and flag emojis
    ├── shared/
    │   ├── state.js            # CheckoutState — sessionStorage wrapper
    │   └── progress-steps.js   # buildProgressSteps() utility
    └── pages/
        ├── cart.js             # Qty controls, remove items, proceed guard
        ├── personal-info.js    # Name / email / phone validation + save
        ├── address.js          # Shipping + billing, country select
        ├── payment.js          # Card formatting, type detection, live preview
        ├── confirmation.js     # Reads state and renders review summary
        ├── processing.js       # Simulated payment delay + redirect
        └── success.js          # Order number, delivery estimate, copy button
```

---

## Architecture Decisions

### Multi-Page Application (MPA)

The checkout is a set of separate HTML pages. Each page is self-contained: it loads its own CSS and JS, reads state on mount, and writes back on submit. Navigation uses `window.location.href`.

This was a deliberate choice over a SPA framework:

- **No build toolchain.** Every file is readable as-is — no compiled output, no node_modules.
- **Natural browser behavior.** History, back/forward navigation, and scroll restoration all work out of the box.
- **Easy to audit.** DevTools shows exactly what's on the page with no abstraction layer.

### SessionStorage State

`js/shared/state.js` provides a `CheckoutState` object that wraps `sessionStorage`:

```js
CheckoutState.get()        // returns the current state object
CheckoutState.set(updates) // shallow-merges and persists
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

Each page calls `CheckoutState.get()` on load to restore previously entered values (navigating back pre-fills the form), and `CheckoutState.set()` on submit. State is scoped to the browser tab and cleared automatically when the tab closes.

### BEM CSS + Design Tokens

All class names follow `Block__Element--Modifier`. All colors, spacing, radii, shadows, and transitions are CSS custom properties in `css/variables.css` — no hardcoded values anywhere else. The entire visual language can be changed by editing a single file.

### XSS Prevention

User input is always written to the DOM via `element.textContent`, never `innerHTML`. The only `innerHTML` usage in the codebase writes static, hardcoded SVG strings — never user-provided data.

---

## Validation Strategy

### Blur-First

Each field tracks a `touched` flag (starts `false`, set `true` on first `blur`). Error messages only render when `touched === true`, so errors never appear while the user is actively filling a field for the first time. Once touched, errors update in real time on every keystroke — giving immediate positive feedback as mistakes are corrected.

### Force-Validate on Submit

Pressing Continue runs validation across all required fields regardless of `touched` state. Any field that was skipped entirely shows its error immediately and blocks navigation. The page scrolls to the first invalid field.

### HTML5 Constraint Validation API

Inputs use native attributes (`required`, `type="email"`, `pattern`, `minlength`). Validity is checked with `input.checkValidity()`. Human-readable error copy replaces browser defaults via `input.setCustomValidity()`.

### Billing Address Exclusion

Billing inputs are `disabled` while "Same as shipping" is checked. The Constraint Validation API excludes `disabled` fields automatically — they can never block submission. When the checkbox is unchecked, `disabled` is removed and the fields re-enter validation.

---

## UX Decisions

### Split Layout

On desktop (≥ 1024 px), form pages use a two-column layout: white form panel on the left, dark order-summary sidebar on the right. Both columns fill the full viewport height — no page scroll. On mobile, the columns stack and the summary collapses into an accordion.

### 6-Step Progress Indicator

A progress bar persists across every page. Visual states:

| State     | Appearance                              |
|-----------|-----------------------------------------|
| Completed | Gradient-filled circle + checkmark      |
| Current   | Gradient-filled circle + glow shadow    |
| Upcoming  | Outlined circle + dashed connector line |

On narrow screens (< 640 px), labels are hidden and only circles are shown to prevent overflow.

### Live Card Preview

The payment page shows an animated credit card that mirrors the form in real time:

- Card number formatted as 4-4-4-4 (or 4-6-5 for Amex)
- Cardholder name and expiry date update as the user types
- Brand logo switches automatically based on card type detection

| Card type  | Detected from               |
|------------|-----------------------------|
| Visa       | Leading `4`                 |
| Mastercard | `51–55` or `2221–2720`      |
| Amex       | `34` or `37`                |

Amex uses 15-digit formatting and a 4-digit CVV. All other cards use 16-digit formatting and a 3-digit CVV. The input `maxlength`, format mask, and card preview all adapt automatically when the type changes.


### Mobile Order Summary Accordion

On mobile, the order summary collapses into a toggle button showing the running total. Tapping expands the full itemized breakdown. On desktop, the full summary is always visible in the sidebar.

### Success & Failure Pages

The **Success** page generates a unique order number, calculates a 5–7 business day delivery window, plays a confetti animation, and provides a copy-to-clipboard button for the order number.

The **Failure** page offers three clear recovery paths — Retry Payment, Change Payment Method, and Return to Cart — with a short list of common failure reasons so users know what to do next.

---

## Accessibility

| Feature | Implementation |
|---|---|
| Semantic HTML | `<main>`, `<aside>`, `<nav>`, `<article>`, `<section>`, `<fieldset>`, `<legend>` |
| Form labels | Every input has an associated `<label>` via `for`/`id` |
| Validation ARIA | `aria-invalid="true"` on failing inputs, `aria-describedby` pointing to error messages |
| Icon buttons | `aria-label` on all buttons that contain only an icon |
| Accordion | `aria-expanded` + `aria-controls` on the mobile summary toggle |
| Decorative elements | `aria-hidden="true"` on all SVGs and background blobs |
| Alert role | `role="alert"` on the failure result card for immediate screen reader announcement |
| Reduced motion | All animations wrapped in `@media (prefers-reduced-motion: reduce)` |
| Color + icon | Error states always use both — never color alone |
| Focus styles | `:focus-visible` styles preserved on all interactive elements |
