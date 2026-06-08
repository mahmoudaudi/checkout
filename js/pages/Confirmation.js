/**
 * @module Confirmation
 * @description Renders the /checkout/confirmation review page (step 4 of 4).
 * Displays a summary of personal info, shipping address, payment method,
 * and order items. User confirms payment to proceed to /checkout/processing.
 * Edit buttons navigate back to the relevant step without clearing data.
 *
 * ─── SOLID ───────────────────────────────────────────────────────────────────
 * S – buildReviewSection() constructs a single review card with an edit button;
 *     buildOrderSummary() constructs the totals sidebar; maskCard() is a pure
 *     string utility — each function has one responsibility.
 * O – A new review section (e.g. "Gift Message") can be added by calling
 *     buildReviewSection() with a new config, without changing existing sections.
 * D – Depends on abstractions: store, router, icons — not on their implementations.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─── SEO / Semantic HTML ─────────────────────────────────────────────────────
 * • <main>     — page landmark
 * • <section>  — each review card (personal info, address, payment)
 * • <aside>    — order summary sidebar (related but secondary content)
 * • <h1>       — page title; <h2> — section titles (correct heading hierarchy)
 * • <dl>/<dt>/<dd> — definition list for label/value pairs (name, email, etc.)
 * • maskCard() hides 12 digits before rendering — PAN partial exposure only
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * BEM blocks used: page, form-page, review-section, order-summary, btn
 */

import { getState } from '../state/store.js';
import { navigate } from '../router.js';
import { icon, lockFilled } from '../components/icons.js';
import { ProgressSteps } from '../components/ProgressSteps.js';
import { CheckoutHeader } from '../components/CheckoutHeader.js';

const SHIPPING = 12.99;

/**
 * Masks all but the last 4 digits of a card number.
 * @param {string} cardNumber
 * @returns {string}
 */
function maskCard(cardNumber) {
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Builds a review section card (personal info, address, or payment).
 * @param {{ iconName: string, title: string, editPath: string, editLabel: string, themeClass: string }} config
 * @param {() => HTMLElement} bodyBuilder - Function that returns the content element.
 * @returns {HTMLElement}
 */
function buildReviewSection(config, bodyBuilder) {
  const { iconName, title, editPath, editLabel, themeClass } = config;

  const section = document.createElement('section');
  section.className = `review-section ${themeClass}`;

  const header = document.createElement('div');
  header.className = 'review-section__header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'review-section__title-group';

  const iconWrap = document.createElement('div');
  iconWrap.className = 'review-section__icon';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = icon(iconName, 20);

  const h2 = document.createElement('h2');
  h2.className = 'review-section__title';
  h2.textContent = title;

  titleGroup.appendChild(iconWrap);
  titleGroup.appendChild(h2);

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn--ghost btn--small';
  editBtn.setAttribute('aria-label', editLabel);
  editBtn.innerHTML = `${icon('edit', 20)}<span class="review-section__edit-label">Edit</span>`;
  editBtn.addEventListener('click', () => navigate(editPath));

  header.appendChild(titleGroup);
  header.appendChild(editBtn);

  const body = bodyBuilder();

  section.appendChild(header);
  section.appendChild(body);
  return section;
}

/**
 * Builds the order summary sidebar for the confirmation page.
 * @param {ReturnType<typeof getState>} state
 * @returns {HTMLElement}
 */
function buildOrderSummary(state) {
  const { orderItems } = state;
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING;

  const aside = document.createElement('aside');
  aside.className = 'order-summary order-summary--dark';
  aside.setAttribute('aria-label', 'Order summary');

  const titleRow = document.createElement('div');
  titleRow.className = 'order-summary__title-row';
  titleRow.innerHTML = icon('package', 20);

  const title = document.createElement('h2');
  title.className = 'order-summary__title';
  title.textContent = 'Order Summary';
  titleRow.appendChild(title);

  const itemsList = document.createElement('ul');
  itemsList.className = 'order-summary__items';

  for (const item of orderItems) {
    const li = document.createElement('li');
    li.className = 'order-summary__item';

    const itemBody = document.createElement('div');
    itemBody.className = 'order-summary__item-body';

    const itemName = document.createElement('span');
    itemName.className = 'order-summary__item-name';
    itemName.textContent = item.name;

    const itemQty = document.createElement('span');
    itemQty.className = 'order-summary__item-qty';
    itemQty.textContent = `Qty: ${item.quantity}`;

    itemBody.appendChild(itemName);
    itemBody.appendChild(itemQty);

    const itemPrice = document.createElement('span');
    itemPrice.className = 'order-summary__item-price';
    itemPrice.textContent = `$${item.price.toFixed(2)}`;

    li.appendChild(itemBody);
    li.appendChild(itemPrice);
    itemsList.appendChild(li);
  }

  const divider = document.createElement('div');
  divider.className = 'order-summary__divider order-summary__divider--light';

  const rows = document.createElement('dl');
  rows.className = 'order-summary__rows order-summary__rows--light';

  const addRow = (label, value) => {
    const row = document.createElement('div');
    row.className = 'order-summary__row';
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    row.appendChild(dt);
    row.appendChild(dd);
    rows.appendChild(row);
  };

  addRow('Subtotal', `$${subtotal.toFixed(2)}`);
  addRow('Shipping', `$${SHIPPING.toFixed(2)}`);

  const totalDivider = document.createElement('div');
  totalDivider.className = 'order-summary__divider order-summary__divider--light';

  const totalRow = document.createElement('div');
  totalRow.className = 'order-summary__total-row order-summary__total-row--light';
  const totalLabel = document.createElement('dt');
  totalLabel.textContent = 'Total';
  const totalValue = document.createElement('dd');
  totalValue.textContent = `$${total.toFixed(2)}`;
  totalRow.appendChild(totalLabel);
  totalRow.appendChild(totalValue);

  let isProcessing = false;

  const confirmBtn = document.createElement('button');
  confirmBtn.type      = 'button';
  confirmBtn.className = 'btn btn--primary btn--full btn--icon-start';
  confirmBtn.innerHTML = `${icon('lock', 20)}<span>Confirm Payment</span>`;
  confirmBtn.addEventListener('click', () => {
    if (isProcessing) return;
    isProcessing = true;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `${icon('loader', 20)}<span>Processing…</span>`;
    navigate('/checkout/processing');
  });

  const secureNote = document.createElement('p');
  secureNote.className = 'order-summary__secure';
  secureNote.innerHTML = `${lockFilled()}<span>Secure payment processing</span>`;

  aside.appendChild(titleRow);
  aside.appendChild(itemsList);
  aside.appendChild(divider);
  aside.appendChild(rows);
  aside.appendChild(totalDivider);
  aside.appendChild(totalRow);
  aside.appendChild(confirmBtn);
  aside.appendChild(secureNote);
  return aside;
}

/**
 * Mounts the Confirmation page into the given container.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const state = getState();
  const { personalInfo, addressInfo, paymentInfo } = state;

  const page = document.createElement('main');
  page.className = 'page page--wide';

  const inner = document.createElement('div');
  inner.className = 'page__inner page__inner--wide';

  inner.appendChild(CheckoutHeader());
  inner.appendChild(ProgressSteps(5));

  const card = document.createElement('div');
  card.className = 'form-page';

  const cardHeader = document.createElement('div');
  cardHeader.className = 'form-page__header';

  const h1 = document.createElement('h1');
  h1.className = 'form-page__title';
  h1.textContent = 'Review Your Order';

  const subtitle = document.createElement('p');
  subtitle.className = 'form-page__subtitle';
  subtitle.textContent = 'Please review all details before confirming your payment';

  cardHeader.appendChild(h1);
  cardHeader.appendChild(subtitle);

  const grid = document.createElement('div');
  grid.className = 'page__grid page__grid--confirmation';

  // Left column: review sections
  const leftCol = document.createElement('div');
  leftCol.className = 'review-sections';

  const personalSection = buildReviewSection(
    {
      iconName: 'user', title: 'Personal Information',
      editPath: '/checkout/personal-info',
      editLabel: 'Edit personal information',
      themeClass: 'review-section--purple',
    },
    () => {
      const dl = document.createElement('dl');
      dl.className = 'review-section__details';
      const addDetail = (value) => {
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.appendChild(dd);
      };
      addDetail(personalInfo.fullName);
      addDetail(personalInfo.email);
      addDetail(personalInfo.phone);
      return dl;
    }
  );

  const addressSection = buildReviewSection(
    {
      iconName: 'map-pin', title: 'Shipping Address',
      editPath: '/checkout/address',
      editLabel: 'Edit shipping address',
      themeClass: 'review-section--blue',
    },
    () => {
      const dl = document.createElement('dl');
      dl.className = 'review-section__details';
      const addDetail = (value) => {
        if (!value) return;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.appendChild(dd);
      };
      addDetail(addressInfo.addressLine1);
      addDetail(addressInfo.addressLine2);
      addDetail(`${addressInfo.city}, ${addressInfo.postalCode}`);
      addDetail(addressInfo.country);
      return dl;
    }
  );

  const paymentSection = buildReviewSection(
    {
      iconName: 'credit-card', title: 'Payment Method',
      editPath: '/checkout/payment',
      editLabel: 'Edit payment details',
      themeClass: 'review-section--pink',
    },
    () => {
      const dl = document.createElement('dl');
      dl.className = 'review-section__details';

      const nameRow = document.createElement('dd');
      nameRow.textContent = paymentInfo.cardholderName;
      nameRow.className = 'review-section__detail--bold';

      const numberRow = document.createElement('dd');
      numberRow.textContent = maskCard(paymentInfo.cardNumber);
      numberRow.className = 'review-section__detail--mono';

      const expiryRow = document.createElement('dd');
      expiryRow.textContent = `Expires ${paymentInfo.expiryDate}`;
      expiryRow.className = 'review-section__detail--muted';

      dl.appendChild(nameRow);
      dl.appendChild(numberRow);
      dl.appendChild(expiryRow);
      return dl;
    }
  );

  leftCol.appendChild(personalSection);
  leftCol.appendChild(addressSection);
  leftCol.appendChild(paymentSection);

  grid.appendChild(leftCol);
  grid.appendChild(buildOrderSummary(state));

  // Back button at the bottom
  const footer = document.createElement('div');
  footer.className = 'form-page__footer';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn btn--secondary';
  backBtn.innerHTML = `${icon('arrow-left', 20)}<span class="btn__label">Back</span>`;
  backBtn.setAttribute('aria-label', 'Go back to payment details');
  backBtn.addEventListener('click', () => navigate('/checkout/payment'));
  footer.appendChild(backBtn);

  card.appendChild(cardHeader);
  card.appendChild(grid);
  card.appendChild(footer);
  inner.appendChild(card);
  page.appendChild(inner);
  container.appendChild(page);
}
