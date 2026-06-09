// Shared checkout state — persisted in sessionStorage so it survives page navigation.
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
    paymentInfo: { cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' },
  };

  return {
    get: function () {
      try {
        var s = sessionStorage.getItem(KEY);
        return s ? Object.assign({}, DEFAULTS, JSON.parse(s)) : Object.assign({}, DEFAULTS);
      } catch (e) { return Object.assign({}, DEFAULTS); }
    },
    set: function (updates) {
      sessionStorage.setItem(KEY, JSON.stringify(Object.assign(this.get(), updates)));
    }
  };
})();
