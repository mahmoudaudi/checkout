/**
 * @module Success
 * @description Renders the /checkout/success terminal page (step 6 — all complete).
 *
 * Features:
 *   - Progress stepper showing all 6 steps complete
 *   - canvas-confetti celebration (skipped with prefers-reduced-motion)
 *   - Generated order number
 *   - Confirmation email + receipt info cards
 *   - Delivery estimate
 *   - Continue Shopping + View Order CTAs
 *
 * BEM blocks used: result, result--success, info-grid
 */

import { navigate } from '../router.js';
import { icon }     from '../components/icons.js';
import { ProgressSteps } from '../components/ProgressSteps.js';
import { CheckoutHeader } from '../components/CheckoutHeader.js';

/**
 * Generates a short random alphanumeric order number.
 * @returns {string}
 */
function generateOrderNumber() {
  return Math.random().toString(36).substring(2, 11).toUpperCase();
}

/**
 * Fires confetti from both sides of the viewport for 3 seconds.
 * Respects prefers-reduced-motion.
 */
function fireConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof window.confetti !== 'function') return;

  const duration = 3000;
  const end      = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  const rand     = (min, max) => Math.random() * (max - min) + min;

  const ticker = setInterval(() => {
    const timeLeft     = end - Date.now();
    if (timeLeft <= 0) return clearInterval(ticker);
    const particleCount = 50 * (timeLeft / duration);
    window.confetti({ ...defaults, particleCount, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
    window.confetti({ ...defaults, particleCount, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

/**
 * @param {{ iconName: string, gradientClass: string, title: string, description: string }} config
 * @returns {HTMLElement}
 */
function buildInfoCard(config) {
  const { iconName, gradientClass, title, description } = config;

  const article = document.createElement('article');
  article.className = `info-card ${gradientClass}`;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'info-card__icon';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = icon(iconName, 20);

  const h3 = document.createElement('h3');
  h3.className   = 'info-card__title';
  h3.textContent = title;

  const p = document.createElement('p');
  p.className   = 'info-card__body';
  p.textContent = description;

  article.appendChild(iconWrap);
  article.appendChild(h3);
  article.appendChild(p);
  return article;
}

/**
 * Mounts the Success page into the given container.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const orderNumber = generateOrderNumber();

  const page = document.createElement('main');
  page.className = 'page';

  const inner = document.createElement('div');
  inner.className = 'page__inner';

  inner.appendChild(CheckoutHeader());
  inner.appendChild(ProgressSteps(7)); // 7 > 6 marks all steps as done

  const card = document.createElement('div');
  card.className = 'result result--success';

  // Background decorations
  const deco1 = document.createElement('div');
  deco1.className = 'result__deco result__deco--top-right result__deco--success';
  deco1.setAttribute('aria-hidden', 'true');

  const deco2 = document.createElement('div');
  deco2.className = 'result__deco result__deco--bottom-left result__deco--purple';
  deco2.setAttribute('aria-hidden', 'true');

  // Success icon
  const iconSection = document.createElement('div');
  iconSection.className = 'result__icon-wrap';
  iconSection.setAttribute('aria-hidden', 'true');

  const pulse = document.createElement('div');
  pulse.className = 'result__pulse result__pulse--success';

  const iconCircle = document.createElement('div');
  iconCircle.className = 'result__icon-circle result__icon-circle--success';
  iconCircle.innerHTML = icon('check-circle', 40);

  iconSection.appendChild(pulse);
  iconSection.appendChild(iconCircle);

  const h1 = document.createElement('h1');
  h1.className   = 'result__title result__title--success';
  h1.textContent = 'Payment Successful!';

  const subtitle = document.createElement('p');
  subtitle.className   = 'result__subtitle';
  subtitle.textContent = 'Thank you for your purchase. Your order has been confirmed and is being prepared.';

  // Order number card
  const orderCard = document.createElement('div');
  orderCard.className = 'result__order-card';

  const orderLabel = document.createElement('div');
  orderLabel.className = 'result__order-label';
  orderLabel.innerHTML = `${icon('package', 18)}<span>Order Number</span>`;

  const orderNumberEl = document.createElement('p');
  orderNumberEl.className   = 'result__order-number';
  orderNumberEl.textContent = orderNumber;

  orderCard.appendChild(orderLabel);
  orderCard.appendChild(orderNumberEl);

  // Info grid
  const infoGrid = document.createElement('div');
  infoGrid.className = 'info-grid';
  infoGrid.appendChild(buildInfoCard({
    iconName: 'mail', gradientClass: 'info-card--blue',
    title: 'Confirmation Email',
    description: 'Check your inbox for order details and real-time tracking updates',
  }));
  infoGrid.appendChild(buildInfoCard({
    iconName: 'download', gradientClass: 'info-card--purple',
    title: 'Download Receipt',
    description: 'Your itemized receipt is attached to your confirmation email',
  }));

  // Delivery estimate
  const delivery = document.createElement('div');
  delivery.className = 'result__delivery';

  const deliveryLabel = document.createElement('p');
  deliveryLabel.className   = 'result__delivery-label';
  deliveryLabel.textContent = 'Estimated Delivery';

  const deliveryValue = document.createElement('p');
  deliveryValue.className   = 'result__delivery-value';
  deliveryValue.textContent = '3–5 Business Days';

  delivery.appendChild(deliveryLabel);
  delivery.appendChild(deliveryValue);

  // CTA buttons
  const actions = document.createElement('div');
  actions.className = 'result__actions';

  const shopBtn = document.createElement('button');
  shopBtn.type      = 'button';
  shopBtn.className = 'btn btn--primary btn--full btn--icon-end';
  shopBtn.innerHTML = `<span>Continue Shopping</span>${icon('arrow-right', 20)}`;
  shopBtn.addEventListener('click', () => navigate('/checkout'));

  const viewOrderBtn = document.createElement('button');
  viewOrderBtn.type      = 'button';
  viewOrderBtn.className = 'btn btn--outline btn--full btn--icon-start';
  viewOrderBtn.innerHTML = `${icon('package', 20)}<span>View Order #${orderNumber}</span>`;
  viewOrderBtn.addEventListener('click', () =>
    alert(`Order #${orderNumber} details would appear here in a production app.`)
  );

  actions.appendChild(shopBtn);
  actions.appendChild(viewOrderBtn);

  card.appendChild(deco1);
  card.appendChild(deco2);
  card.appendChild(iconSection);
  card.appendChild(h1);
  card.appendChild(subtitle);
  card.appendChild(orderCard);
  card.appendChild(infoGrid);
  card.appendChild(delivery);
  card.appendChild(actions);

  /* Center the card within the standard layout */
  const cardWrapper = document.createElement('div');
  cardWrapper.style.maxWidth = '42rem';
  cardWrapper.style.marginInline = 'auto';
  cardWrapper.style.width = '100%';
  cardWrapper.appendChild(card);

  inner.appendChild(cardWrapper);
  page.appendChild(inner);
  container.appendChild(page);

  requestAnimationFrame(() => requestAnimationFrame(fireConfetti));
}
