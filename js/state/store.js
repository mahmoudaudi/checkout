/**
 * @module store
 * @description Central application state store.
 * Holds all checkout data (order items, personal info, address, payment).
 * Implements a lightweight pub/sub pattern: call subscribe(fn) to receive
 * the full state object on every setState() call.
 * This is the single source of truth — no state lives in components.
 */

/** @type {{ fullName: string, email: string, phone: string }} */
const DEFAULT_PERSONAL_INFO = { fullName: '', email: '', phone: '' };

/**
 * @type {{
 *   country: string, city: string, addressLine1: string,
 *   addressLine2: string, postalCode: string, sameAsBilling: boolean,
 *   billingCountry: string, billingCity: string,
 *   billingAddressLine1: string, billingAddressLine2: string, billingPostalCode: string
 * }}
 */
const DEFAULT_ADDRESS_INFO = {
  country: '',
  city: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  sameAsBilling: true,
  billingCountry: '',
  billingCity: '',
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingPostalCode: '',
};

/** @type {{ cardholderName: string, cardNumber: string, expiryDate: string, cvv: string }} */
const DEFAULT_PAYMENT_INFO = { cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' };

/**
 * @type {{
 *   orderItems: Array<{ id: string, name: string, price: number, quantity: number, image: string }>,
 *   personalInfo: typeof DEFAULT_PERSONAL_INFO,
 *   addressInfo: typeof DEFAULT_ADDRESS_INFO,
 *   paymentInfo: typeof DEFAULT_PAYMENT_INFO,
 * }}
 */
const state = {
  orderItems: [
    {
      id: '1',
      name: 'Premium Wireless Headphones',
      price: 249.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    },
    {
      id: '2',
      name: 'Leather Laptop Bag',
      price: 129.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    },
  ],
  personalInfo: { ...DEFAULT_PERSONAL_INFO },
  addressInfo: { ...DEFAULT_ADDRESS_INFO },
  paymentInfo: { ...DEFAULT_PAYMENT_INFO },
};

/** @type {Array<(state: typeof state) => void>} */
const listeners = [];

/**
 * Returns a shallow copy of the current state.
 * @returns {typeof state}
 */
export function getState() {
  return { ...state };
}

/**
 * Merges `patch` into the state and notifies all subscribers.
 * @param {Partial<typeof state>} patch
 */
export function setState(patch) {
  Object.assign(state, patch);
  const snapshot = getState();
  for (const fn of listeners) fn(snapshot);
}

/**
 * Registers a listener that is called with the full state on every update.
 * Returns an unsubscribe function.
 * @param {(state: typeof state) => void} fn
 * @returns {() => void}
 */
export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
