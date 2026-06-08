/**
 * @module CheckoutHeader
 * @description Renders a compact brand identity bar at the top of every
 * checkout page. Shows the store logo on the left and a "Secure Checkout"
 * trust indicator on the right.
 *
 * Why: Every top-tier checkout (Stripe, Shopify, Apple) has a persistent
 * brand identifier. Without it, users feel they've left the store, which
 * increases cart abandonment. The secure badge is a trust signal, not a
 * decorative element — it belongs at the top where users scan first.
 *
 * BEM block: checkout-header
 */

import { lockFilled } from './icons.js';

/**
 * Builds and returns the checkout header DOM node.
 * @returns {HTMLElement}
 */
export function CheckoutHeader() {
  const header = document.createElement('div');
  header.className = 'checkout-header';

  /* ── Brand logo ── */
  const brand = document.createElement('div');
  brand.className = 'checkout-header__brand';

  const logo = document.createElement('img');
  logo.src       = 'image/e-commerce with name.png';
  logo.alt       = 'Audi Online Shopping';
  logo.className = 'checkout-header__logo';
  logo.width     = 120;
  logo.height    = 48;
  logo.loading   = 'eager';
  logo.decoding  = 'async';

  brand.appendChild(logo);

  /* ── Secure indicator ── */
  const secure = document.createElement('div');
  secure.className = 'checkout-header__secure';
  secure.setAttribute('aria-label', 'Secure checkout');

  const secureIcon = document.createElement('span');
  secureIcon.setAttribute('aria-hidden', 'true');
  secureIcon.innerHTML = lockFilled();

  const secureText = document.createElement('span');
  secureText.textContent = 'Secure Checkout';

  secure.appendChild(secureIcon);
  secure.appendChild(secureText);

  header.appendChild(brand);
  header.appendChild(secure);

  return header;
}
