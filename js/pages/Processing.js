/**
 * @module Processing
 * @description Renders the /checkout/processing payment animation page.
 * Simulates payment processing with an animated progress bar and
 * a list of security steps. Randomly navigates to /checkout/success
 * (70% probability) or /checkout/failure after ~3.5 seconds.
 * All timers are cleared on unmount via a cleanup function stored on the container.
 *
 * ─── SOLID ───────────────────────────────────────────────────────────────────
 * S – mount() creates DOM and manages its own timer lifecycle; timer teardown
 *     is exposed via container._cleanup (single agreed interface with router).
 * O – New processing steps can be added to the steps array without touching
 *     any other logic.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─── SEO / Semantic HTML ─────────────────────────────────────────────────────
 * • <main>         — page landmark
 * • role="status"  — politely notifies screen readers of state changes
 * • role="progressbar" + aria-valuenow — correctly exposes bar to AT
 * • <aside role="note"> — the "do not close" warning (supplementary content)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * BEM blocks used: processing
 */

import { navigate } from '../router.js';
import { icon } from '../components/icons.js';

/**
 * Mounts the Processing page into the given container.
 * @param {HTMLElement} container
 */
export function mount(container) {
  const page = document.createElement('main');
  page.className = 'page page--centered';

  const card = document.createElement('div');
  card.className = 'processing';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-label', 'Processing your payment');

  // Spinner icon section
  const iconSection = document.createElement('div');
  iconSection.className = 'processing__icon-wrap';
  iconSection.setAttribute('aria-hidden', 'true');

  const ping = document.createElement('div');
  ping.className = 'processing__ping';

  const spinnerCircle = document.createElement('div');
  spinnerCircle.className = 'processing__spinner';
  spinnerCircle.innerHTML = icon('loader', 36);

  iconSection.appendChild(ping);
  iconSection.appendChild(spinnerCircle);

  // Title with animated dots
  const h1 = document.createElement('h1');
  h1.className = 'processing__title';
  h1.id = 'processing-title';

  const titleText = document.createTextNode('Processing Payment');
  const dots = document.createElement('span');
  dots.className = 'processing__dots';
  dots.setAttribute('aria-hidden', 'true');

  h1.appendChild(titleText);
  h1.appendChild(dots);

  const subtitle = document.createElement('p');
  subtitle.className = 'processing__subtitle';
  subtitle.textContent = 'Please wait while we securely process your payment';

  // Progress bar
  const progressWrap = document.createElement('div');
  progressWrap.className = 'processing__progress';
  progressWrap.setAttribute('role', 'progressbar');
  progressWrap.setAttribute('aria-valuemin', '0');
  progressWrap.setAttribute('aria-valuemax', '100');
  progressWrap.setAttribute('aria-valuenow', '0');
  progressWrap.setAttribute('aria-labelledby', 'processing-title');

  const progressBar = document.createElement('div');
  progressBar.className = 'processing__progress-bar';
  progressBar.style.width = '0%';
  progressWrap.appendChild(progressBar);

  // Step list
  const steps = [
    { iconName: 'check-circle', text: 'Verifying card details',   color: 'green' },
    { iconName: 'shield',       text: 'Securing transaction',     color: 'blue' },
    { iconName: 'lock',         text: 'Finalizing payment',       color: 'purple' },
  ];

  const stepList = document.createElement('ul');
  stepList.className = 'processing__steps';

  for (const step of steps) {
    const li = document.createElement('li');
    li.className = `processing__step`;

    const stepIcon = document.createElement('span');
    stepIcon.className = `processing__step-icon processing__step-icon--${step.color}`;
    stepIcon.setAttribute('aria-hidden', 'true');
    stepIcon.innerHTML = icon(step.iconName, 20);

    const stepText = document.createElement('span');
    stepText.textContent = step.text;

    li.appendChild(stepIcon);
    li.appendChild(stepText);
    stepList.appendChild(li);
  }

  // Warning
  const warning = document.createElement('aside');
  warning.className = 'processing__warning';
  warning.setAttribute('role', 'note');

  const warningText = document.createElement('p');
  warningText.textContent = 'Do not close this window or press the back button';
  warning.appendChild(warningText);

  card.appendChild(iconSection);
  card.appendChild(h1);
  card.appendChild(subtitle);
  card.appendChild(progressWrap);
  card.appendChild(stepList);
  card.appendChild(warning);
  page.appendChild(card);
  container.appendChild(page);

  // --- Timers ---
  let progress = 0;
  let dotCount = 0;

  const dotTimer = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    dots.textContent = '.'.repeat(dotCount);
  }, 500);

  const progressTimer = setInterval(() => {
    progress = Math.min(progress + Math.random() * 15, 100);
    progressBar.style.width = `${progress}%`;
    progressWrap.setAttribute('aria-valuenow', String(Math.round(progress)));
  }, 300);

  const redirectTimer = setTimeout(() => {
    const success = Math.random() > 0.3;
    navigate(success ? '/checkout/success' : '/checkout/failure');
  }, 3500);

  // Store cleanup so the router can call it when navigating away
  container._cleanup = () => {
    clearInterval(dotTimer);
    clearInterval(progressTimer);
    clearTimeout(redirectTimer);
  };
}
