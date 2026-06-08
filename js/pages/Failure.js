/**
 * @module Failure
 * @description Renders the /checkout/failure terminal page.
 *
 * Shows a polished payment-failed error state with:
 *   - Animated error icon with pulsing ring
 *   - Common failure reasons list
 *   - Customer support help section
 *   - Three CTAs: Retry Payment, Change Payment Method, Return to Cart
 *
 * role="alert" on the result card — immediately announced by screen readers.
 *
 * BEM blocks used: result, result--failure
 */

import { navigate } from '../router.js';
import { icon }     from '../components/icons.js';
import { CheckoutHeader } from '../components/CheckoutHeader.js';

/** @type {string[]} */
const COMMON_ISSUES = [
  'Insufficient funds in your account',
  'Incorrect card number or security code',
  'Card has expired or been declined by issuer',
  'Daily transaction or spending limit reached',
  'Card not enabled for online or international transactions',
];

/**
 * Mounts the Failure page into the given container.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const page = document.createElement('main');
  page.className = 'page';

  const inner = document.createElement('div');
  inner.className = 'page__inner';

  inner.appendChild(CheckoutHeader());

  const card = document.createElement('div');
  card.className = 'result result--failure';
  card.setAttribute('role', 'alert');
  card.style.maxWidth = '42rem';
  card.style.marginInline = 'auto';

  // Background decorations
  const deco1 = document.createElement('div');
  deco1.className = 'result__deco result__deco--top-right result__deco--failure';
  deco1.setAttribute('aria-hidden', 'true');

  const deco2 = document.createElement('div');
  deco2.className = 'result__deco result__deco--bottom-left result__deco--orange';
  deco2.setAttribute('aria-hidden', 'true');

  // Error icon
  const iconSection = document.createElement('div');
  iconSection.className = 'result__icon-wrap';
  iconSection.setAttribute('aria-hidden', 'true');

  const pulse = document.createElement('div');
  pulse.className = 'result__pulse result__pulse--failure';

  const iconCircle = document.createElement('div');
  iconCircle.className = 'result__icon-circle result__icon-circle--failure';
  iconCircle.innerHTML = icon('x-circle', 40);

  iconSection.appendChild(pulse);
  iconSection.appendChild(iconCircle);

  const h1 = document.createElement('h1');
  h1.className   = 'result__title result__title--failure';
  h1.textContent = 'Payment Failed';

  const subtitle = document.createElement('p');
  subtitle.className   = 'result__subtitle';
  subtitle.textContent = "We couldn't process your payment. Please check your details and try again.";

  // Common issues card
  const issuesCard = document.createElement('section');
  issuesCard.className = 'failure-issues';
  issuesCard.setAttribute('aria-label', 'Common payment failure reasons');

  const issuesHeader = document.createElement('div');
  issuesHeader.className = 'failure-issues__header';

  const issuesIcon = document.createElement('span');
  issuesIcon.innerHTML = icon('alert-circle', 20);
  issuesIcon.setAttribute('aria-hidden', 'true');

  const issuesTitleGroup = document.createElement('div');

  const issuesTitle = document.createElement('h2');
  issuesTitle.className   = 'failure-issues__title';
  issuesTitle.textContent = 'Common Reasons for Failure';

  const issuesDesc = document.createElement('p');
  issuesDesc.className   = 'failure-issues__desc';
  issuesDesc.textContent = 'Your payment may have failed due to one of these reasons:';

  issuesTitleGroup.appendChild(issuesTitle);
  issuesTitleGroup.appendChild(issuesDesc);
  issuesHeader.appendChild(issuesIcon);
  issuesHeader.appendChild(issuesTitleGroup);

  const issuesList = document.createElement('ul');
  issuesList.className = 'failure-issues__list';

  for (const issue of COMMON_ISSUES) {
    const li = document.createElement('li');
    li.className = 'failure-issues__item';

    const bullet = document.createElement('span');
    bullet.className = 'failure-issues__bullet';
    bullet.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = issue;

    li.appendChild(bullet);
    li.appendChild(text);
    issuesList.appendChild(li);
  }

  issuesCard.appendChild(issuesHeader);
  issuesCard.appendChild(issuesList);

  // Help section
  const helpCard = document.createElement('section');
  helpCard.className = 'failure-help';
  helpCard.setAttribute('aria-label', 'Customer support');

  const helpTitle = document.createElement('h2');
  helpTitle.className   = 'failure-help__title';
  helpTitle.textContent = 'Still Having Trouble?';

  const helpText = document.createElement('p');
  helpText.className   = 'failure-help__body';
  helpText.textContent = 'Contact your bank or card issuer directly, or reach us at:';

  const helpLink = document.createElement('a');
  helpLink.className = 'failure-help__link';
  helpLink.href      = 'mailto:support@example.com';
  helpLink.textContent = 'support@example.com';
  helpLink.rel       = 'noopener noreferrer';

  helpCard.appendChild(helpTitle);
  helpCard.appendChild(helpText);
  helpCard.appendChild(helpLink);

  // CTA buttons
  const actions = document.createElement('div');
  actions.className = 'result__actions';

  // Primary: re-submit with existing payment details
  const retryBtn = document.createElement('button');
  retryBtn.type      = 'button';
  retryBtn.className = 'btn btn--primary btn--full btn--icon-start btn--retry';
  retryBtn.innerHTML = `${icon('refresh-cw', 20)}<span>Retry Payment</span>`;
  retryBtn.setAttribute('aria-label', 'Retry payment with current card details');
  retryBtn.addEventListener('click', () => navigate('/checkout/processing'));

  // Secondary: go back to edit payment details
  const changeBtn = document.createElement('button');
  changeBtn.type      = 'button';
  changeBtn.className = 'btn btn--outline btn--full btn--icon-start';
  changeBtn.innerHTML = `${icon('credit-card', 20)}<span>Change Payment Method</span>`;
  changeBtn.setAttribute('aria-label', 'Go back to payment details to update card information');
  changeBtn.addEventListener('click', () => navigate('/checkout/payment'));

  // Ghost: return to cart
  const cartBtn = document.createElement('button');
  cartBtn.type      = 'button';
  cartBtn.className = 'btn btn--ghost btn--full btn--icon-start';
  cartBtn.innerHTML = `${icon('arrow-left', 20)}<span>Return to Cart</span>`;
  cartBtn.addEventListener('click', () => navigate('/checkout'));

  actions.appendChild(retryBtn);
  actions.appendChild(changeBtn);
  actions.appendChild(cartBtn);

  card.appendChild(deco1);
  card.appendChild(deco2);
  card.appendChild(iconSection);
  card.appendChild(h1);
  card.appendChild(subtitle);
  card.appendChild(issuesCard);
  card.appendChild(helpCard);
  card.appendChild(actions);
  inner.appendChild(card);
  page.appendChild(inner);
  container.appendChild(page);
}
