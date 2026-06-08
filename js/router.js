/**
 * @module router
 * @description Client-side router using history.pushState.
 * Matches the current URL pathname to a registered route handler and calls it,
 * passing the app container element. Listens to browser back/forward via popstate.
 *
 * Usage:
 *   import { router, navigate } from './router.js';
 *   router.register('/checkout', CheckoutSummary.mount);
 *   router.init(document.getElementById('app'));
 *
 * NOTE: pushState requires the page to be served over HTTP (not file://).
 * Run with: npx serve . or python -m http.server
 */

/**
 * @typedef {(container: HTMLElement) => void} RouteHandler
 */

/** @type {Map<string, RouteHandler>} */
const routes = new Map();

/** @type {HTMLElement | null} */
let appContainer = null;

/** @type {RouteHandler | null} */
let notFoundHandler = null;

/**
 * Registers a route.
 * @param {string} path - Exact pathname to match (e.g. '/checkout').
 * @param {RouteHandler} handler - Function called with the app container when route is active.
 */
function register(path, handler) {
  routes.set(path, handler);
}

/**
 * Sets the handler for unmatched routes.
 * @param {RouteHandler} handler
 */
function onNotFound(handler) {
  notFoundHandler = handler;
}

/**
 * Resolves the current pathname and renders the matching route.
 * Clears the container before each render.
 */
function resolve() {
  if (!appContainer) return;

  const path = window.location.pathname;
  appContainer.innerHTML = '';

  const handler = routes.get(path);
  if (handler) {
    handler(appContainer);
  } else if (notFoundHandler) {
    notFoundHandler(appContainer);
  }
}

/**
 * Navigates to a new path using pushState and triggers route resolution.
 * @param {string} path - Target pathname.
 */
export function navigate(path) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
  }
  resolve();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Initialises the router: attaches the popstate listener and resolves the
 * current route. Call once after all routes are registered.
 * @param {HTMLElement} container - Root element where pages are rendered.
 */
function init(container) {
  appContainer = container;
  window.addEventListener('popstate', resolve);
  resolve();
}

export const router = { register, onNotFound, init };
