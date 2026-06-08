/**
 * @module main
 * @description Application entry point.
 * Registers all routes with the router, then initialises it on the #app element.
 * This is the only file that imports from every page module — keeping pages
 * decoupled from each other.
 *
 * Route table:
 *   /                          → redirect to /checkout
 *   /checkout                  → CheckoutSummary
 *   /checkout/personal-info    → PersonalInformation
 *   /checkout/address          → AddressInformation
 *   /checkout/payment          → PaymentDetails
 *   /checkout/confirmation     → Confirmation
 *   /checkout/processing       → Processing
 *   /checkout/success          → Success
 *   /checkout/failure          → Failure
 */

import { router, navigate } from './router.js';
import { mount as mountSummary        } from './pages/CheckoutSummary.js';
import { mount as mountPersonal       } from './pages/PersonalInformation.js';
import { mount as mountAddress        } from './pages/AddressInformation.js';
import { mount as mountPayment        } from './pages/PaymentDetails.js';
import { mount as mountConfirmation   } from './pages/Confirmation.js';
import { mount as mountProcessing     } from './pages/Processing.js';
import { mount as mountSuccess        } from './pages/Success.js';
import { mount as mountFailure        } from './pages/Failure.js';

/**
 * Wraps a page mount function so that any cleanup registered by the previous
 * page (e.g. Processing timers) is called before the new page renders.
 * @param {(container: HTMLElement) => void} mountFn
 * @returns {(container: HTMLElement) => void}
 */
function withCleanup(mountFn) {
  return (container) => {
    if (typeof container._cleanup === 'function') {
      container._cleanup();
      container._cleanup = null;
    }
    mountFn(container);
  };
}

// Register routes
router.register('/',                         (c) => navigate('/checkout'));
router.register('/checkout',                 withCleanup(mountSummary));
router.register('/checkout/personal-info',   withCleanup(mountPersonal));
router.register('/checkout/address',         withCleanup(mountAddress));
router.register('/checkout/payment',         withCleanup(mountPayment));
router.register('/checkout/confirmation',    withCleanup(mountConfirmation));
router.register('/checkout/processing',      withCleanup(mountProcessing));
router.register('/checkout/success',         withCleanup(mountSuccess));
router.register('/checkout/failure',         withCleanup(mountFailure));

// 404 handler
router.onNotFound((container) => {
  container.innerHTML = '';
  const msg = document.createElement('p');
  msg.style.textAlign = 'center';
  msg.style.padding = '4rem';
  msg.textContent = 'Page not found.';
  container.appendChild(msg);

  const link = document.createElement('button');
  link.className = 'btn btn--primary';
  link.style.display = 'block';
  link.style.margin = '0 auto';
  link.textContent = 'Return to Cart';
  link.addEventListener('click', () => navigate('/checkout'));
  container.appendChild(link);
});

// Boot
const app = document.getElementById('app');
if (!app) throw new Error('Root element #app not found in index.html');
router.init(app);
