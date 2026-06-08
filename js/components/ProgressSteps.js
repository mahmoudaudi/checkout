/**
 * @module ProgressSteps
 * @description Renders the 6-step checkout progress indicator.
 * Accepts the current step number (1–6) and returns a DOM node.
 *
 * Steps:
 *   1 Cart → 2 Personal Info → 3 Address → 4 Payment → 5 Review → 6 Confirmation
 *
 * BEM block: progress-steps
 */

import { icon } from './icons.js';

/** @type {Array<{ id: number, shortName: string, fullName: string }>} */
const STEPS = [
  { id: 1, shortName: 'Cart',     fullName: 'Cart' },
  { id: 2, shortName: 'Contact',  fullName: 'Personal Info' },
  { id: 3, shortName: 'Address',  fullName: 'Address' },
  { id: 4, shortName: 'Payment',  fullName: 'Payment' },
  { id: 5, shortName: 'Review',   fullName: 'Review' },
  { id: 6, shortName: 'Done',     fullName: 'Confirmation' },
];

/**
 * Builds and returns the progress steps DOM node.
 * @param {number} currentStep - Active step index (1-based).
 * @returns {HTMLElement}
 */
export function ProgressSteps(currentStep) {
  const nav = document.createElement('nav');
  nav.className = 'progress-steps';
  nav.setAttribute('aria-label', 'Checkout progress');

  const ol = document.createElement('ol');
  ol.className = 'progress-steps__list';

  STEPS.forEach((step, index) => {
    const isDone   = currentStep > step.id;
    const isActive = currentStep === step.id;

    const li = document.createElement('li');
    li.className = 'progress-steps__item';

    // Circle
    const circle = document.createElement('div');
    circle.className = [
      'progress-steps__circle',
      isDone   ? 'progress-steps__circle--done'   : '',
      isActive ? 'progress-steps__circle--active' : '',
    ].filter(Boolean).join(' ');

    if (isDone) {
      circle.innerHTML = icon('check', 12);
      circle.setAttribute('aria-label', `${step.fullName} completed`);
    } else {
      const num = document.createElement('span');
      num.className = 'progress-steps__number';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = String(step.id);
      circle.appendChild(num);
      circle.setAttribute(
        'aria-label',
        isActive ? `${step.fullName} (current step)` : step.fullName
      );
    }

    // Label
    const label = document.createElement('span');
    label.className = [
      'progress-steps__label',
      currentStep >= step.id ? 'progress-steps__label--active' : '',
    ].filter(Boolean).join(' ');

    // Short name on mobile, full name on wider screens via CSS
    const shortSpan = document.createElement('span');
    shortSpan.className = 'progress-steps__label-short';
    shortSpan.textContent = step.shortName;

    const fullSpan = document.createElement('span');
    fullSpan.className = 'progress-steps__label-full';
    fullSpan.textContent = step.fullName;

    label.appendChild(shortSpan);
    label.appendChild(fullSpan);

    // Active pulse dot
    if (isActive) {
      const pulse = document.createElement('div');
      pulse.className = 'progress-steps__pulse';
      pulse.setAttribute('aria-hidden', 'true');
      li.appendChild(pulse);
    }

    li.appendChild(circle);
    li.appendChild(label);
    ol.appendChild(li);

    // Connector between steps
    if (index < STEPS.length - 1) {
      const connectorWrap = document.createElement('li');
      connectorWrap.className = 'progress-steps__connector-wrap';
      connectorWrap.setAttribute('aria-hidden', 'true');

      const connector = document.createElement('div');
      connector.className = [
        'progress-steps__connector',
        isDone ? 'progress-steps__connector--done' : '',
      ].filter(Boolean).join(' ');

      connectorWrap.appendChild(connector);
      ol.appendChild(connectorWrap);
    }
  });

  nav.appendChild(ol);
  return nav;
}
