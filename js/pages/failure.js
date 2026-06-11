document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('try-again-btn').addEventListener('click', function () {
    window.location.href = 'processing.html';
  });

  document.getElementById('change-payment-btn').addEventListener('click', function () {
    window.location.href = 'payment.html';
  });

  document.getElementById('back-to-cart-btn').addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
