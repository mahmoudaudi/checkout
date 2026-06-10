// Cross-page checkout state persisted in sessionStorage.
// Survives navigation but cleared when the tab is closed.
const CheckoutState = (function () {
  const KEY = 'checkout';
  const DEFAULTS = {
    personalInfo: { fullName: '', email: '', phone: '' },
    addressInfo: {
      country: '', city: '', addressLine1: '', addressLine2: '', postalCode: '',
      sameAsBilling: true,
      billingCountry: '', billingCity: '',
      billingAddressLine1: '', billingAddressLine2: '', billingPostalCode: '',
    },
    paymentInfo: { cardholderName: '', cardNumber: '', expiryDate: '' }, // cvv intentionally excluded
    confirmed: false,
    step: 0,
    cartInfo: {
      items: [
        { id: '1', name: 'Premium Wireless Headphones', variant: 'Black · Default Title', img: 'assets/images/headphone.avif', unitPrice: 80.00, qty: 1 },
        { id: '2', name: 'Smart Watch',                 variant: 'White · Default Title', img: 'assets/images/wear.avif',       unitPrice: 50.00, qty: 1 }
      ],
      shipping: 12.99
    },
  };

  return {
    get: function () {
      try {
        const s = sessionStorage.getItem(KEY);
        return s ? Object.assign({}, DEFAULTS, JSON.parse(s)) : Object.assign({}, DEFAULTS);
      } catch (e) { return Object.assign({}, DEFAULTS); }
    },
    set: function (updates) {
      sessionStorage.setItem(KEY, JSON.stringify(Object.assign(this.get(), updates)));
    }
  };
})();
