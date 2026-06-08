/**
 * @module CheckoutSummary
 * @description Renders the /checkout cart summary page (step 1 of 6).
 *
 * Features:
 *   - Progress stepper showing step 1 of the 6-step flow
 *   - Cart items with skeleton image loaders (CSS shimmer until image loads)
 *   - Order summary with collapsible accordion on mobile
 *   - Sticky sidebar on desktop (≥ 1024px)
 *
 * BEM blocks used: page, cart-item, order-summary, btn
 */

import { getState } from '../state/store.js';
import { navigate } from '../router.js';
import { icon, lockFilled } from '../components/icons.js';
import { ProgressSteps } from '../components/ProgressSteps.js';

const SHIPPING = 12.99;

/**
 * Builds a single cart item article element.
 * Image wrapper shows a skeleton shimmer while the image loads.
 *
 * @param {{ id: string, name: string, price: number, quantity: number, image: string }} item
 * @param {number} index - Used for staggered animation delay.
 * @returns {HTMLElement}
 */
function CartItem(item, index) {
  const article = document.createElement('article');
  article.className = 'cart-item';
  article.style.animationDelay = `${index * 100}ms`;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'cart-item__img-wrap cart-item__img-wrap--skeleton';

  const img = document.createElement('img');
  img.src     = item.image;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width   = 112;
  img.height  = 112;
  img.className = 'cart-item__img';
  img.alt     = '';  // decorative — name is in heading

  img.addEventListener('load', () => {
    imgWrap.classList.remove('cart-item__img-wrap--skeleton');
  });
  img.addEventListener('error', () => {
    imgWrap.classList.remove('cart-item__img-wrap--skeleton');
  });

  imgWrap.appendChild(img);

  const body = document.createElement('div');
  body.className = 'cart-item__body';

  const heading = document.createElement('h2');
  heading.className   = 'cart-item__name';
  heading.textContent = item.name;

  const badge = document.createElement('div');
  badge.className = 'cart-item__badge';
  badge.innerHTML = icon('sparkles', 14);
  const badgeText = document.createElement('span');
  badgeText.textContent = 'Premium Quality';
  badge.appendChild(badgeText);

  const footer = document.createElement('div');
  footer.className = 'cart-item__footer';

  const qty = document.createElement('span');
  qty.className   = 'cart-item__qty';
  qty.textContent = `Qty: ${item.quantity}`;

  const price = document.createElement('span');
  price.className   = 'cart-item__price';
  price.textContent = `$${item.price.toFixed(2)}`;

  footer.appendChild(qty);
  footer.appendChild(price);
  body.appendChild(heading);
  body.appendChild(badge);
  body.appendChild(footer);
  article.appendChild(imgWrap);
  article.appendChild(body);
  return article;
}

/**
 * Builds the order summary sidebar with a mobile accordion toggle.
 *
 * Desktop: always expanded, sticky.
 * Mobile:  collapsed by default showing just total; toggle expands full details.
 *
 * @param {number} subtotal
 * @param {Array<{ name: string, price: number, quantity: number }>} orderItems
 * @returns {HTMLElement}
 */
function OrderSummaryPanel(subtotal, orderItems) {
  const total = subtotal + SHIPPING;

  const aside = document.createElement('aside');
  aside.className = 'order-summary';
  aside.setAttribute('aria-label', 'Order summary');

  /* ── Mobile accordion toggle ── */
  const toggle = document.createElement('button');
  toggle.type      = 'button';
  toggle.className = 'order-summary__toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'order-summary-body');

  const toggleLeft = document.createElement('span');
  toggleLeft.className = 'order-summary__toggle-label';
  toggleLeft.textContent = 'Order Summary';

  const toggleRight = document.createElement('span');
  toggleRight.className = 'order-summary__toggle-right';

  const toggleAmount = document.createElement('span');
  toggleAmount.className   = 'order-summary__toggle-amount';
  toggleAmount.textContent = `$${total.toFixed(2)}`;

  const chevron = document.createElement('span');
  chevron.className = 'order-summary__toggle-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML = icon('arrow-right', 16); // rotated 90deg by CSS

  toggleRight.appendChild(toggleAmount);
  toggleRight.appendChild(chevron);
  toggle.appendChild(toggleLeft);
  toggle.appendChild(toggleRight);

  /* ── Collapsible body ── */
  const body = document.createElement('div');
  body.className = 'order-summary__body order-summary__body--collapsed';
  body.id        = 'order-summary-body';

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    body.classList.toggle('order-summary__body--collapsed', expanded);
    chevron.classList.toggle('order-summary__toggle-chevron--open', !expanded);
  });

  /* ── Body content ── */
  const heading = document.createElement('h2');
  heading.className   = 'order-summary__title';
  heading.textContent = 'Order Summary';

  const rows = document.createElement('dl');
  rows.className = 'order-summary__rows';

  const subtotalRow = buildRow('Subtotal', `$${subtotal.toFixed(2)}`);
  const shippingRow = buildRow('Shipping', `$${SHIPPING.toFixed(2)}`);

  const divider = document.createElement('div');
  divider.className = 'order-summary__divider';
  divider.setAttribute('aria-hidden', 'true');

  const totalRow = document.createElement('div');
  totalRow.className = 'order-summary__total-row';

  const totalLabel = document.createElement('dt');
  totalLabel.className   = 'order-summary__total-label';
  totalLabel.textContent = 'Total';

  const totalValue = document.createElement('dd');
  totalValue.className   = 'order-summary__total-value';
  totalValue.textContent = `$${total.toFixed(2)}`;

  totalRow.appendChild(totalLabel);
  totalRow.appendChild(totalValue);
  rows.appendChild(subtotalRow);
  rows.appendChild(shippingRow);
  rows.appendChild(divider);
  rows.appendChild(totalRow);

  const cta = document.createElement('button');
  cta.className = 'btn btn--primary btn--full btn--icon-end';
  cta.type      = 'button';
  cta.innerHTML = `<span>Proceed to Checkout</span>${icon('arrow-right', 20)}`;
  cta.addEventListener('click', () => navigate('/checkout/personal-info'));

  const secure = document.createElement('p');
  secure.className = 'order-summary__secure';
  secure.innerHTML = `${lockFilled()}<span>Secure checkout powered by SSL</span>`;

  body.appendChild(heading);
  body.appendChild(rows);
  body.appendChild(cta);
  body.appendChild(secure);

  aside.appendChild(toggle);
  aside.appendChild(body);
  return aside;
}

/** @param {string} label @param {string} value @returns {HTMLElement} */
function buildRow(label, value) {
  const row = document.createElement('div');
  row.className = 'order-summary__row';

  const dt = document.createElement('dt');
  dt.textContent = label;

  const dd = document.createElement('dd');
  dd.textContent = value;

  row.appendChild(dt);
  row.appendChild(dd);
  return row;
}

/**
 * Mounts the CheckoutSummary page into the given container.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const { orderItems } = getState();
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const page = document.createElement('main');
  page.className = 'page page--summary';

  const inner = document.createElement('div');
  inner.className = 'page__inner page__inner--wide';

  inner.appendChild(ProgressSteps(1));

  // Header
  const header = document.createElement('header');
  header.className = 'page__header page__header--centered';

  const iconWrap = document.createElement('div');
  iconWrap.className = 'page__icon-wrap page__icon-wrap--brand';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = icon('shopping-bag', 24);

  const h1 = document.createElement('h1');
  h1.className   = 'page__title page__title--gradient';
  h1.textContent = 'Your Cart';

  const subtitle = document.createElement('p');
  subtitle.className   = 'page__subtitle';
  subtitle.textContent = 'Review your items before checkout';

  header.appendChild(iconWrap);
  header.appendChild(h1);
  header.appendChild(subtitle);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'page__grid page__grid--summary';

  const itemsSection = document.createElement('section');
  itemsSection.className = 'page__items';
  itemsSection.setAttribute('aria-label', 'Cart items');

  orderItems.forEach((item, i) => {
    itemsSection.appendChild(CartItem(item, i));
  });

  grid.appendChild(itemsSection);
  grid.appendChild(OrderSummaryPanel(subtotal, orderItems));

  inner.appendChild(header);
  inner.appendChild(grid);
  page.appendChild(inner);
  container.appendChild(page);
}
