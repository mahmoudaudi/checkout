document.addEventListener('DOMContentLoaded', function () {
  // Build progress steps — Cart is step 1
  buildProgressSteps('progress-steps', 1);

  // Mobile accordion toggle
  var toggle  = document.getElementById('summary-toggle');
  var body    = document.getElementById('order-summary-body');
  var chevron = document.getElementById('summary-chevron');

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    body.classList.toggle('order-summary__body--collapsed', expanded);
    chevron.classList.toggle('order-summary__toggle-chevron--open', !expanded);
  });
});
