document.addEventListener('DOMContentLoaded', function () {
  const progressBar  = document.getElementById('progress-bar');
  const progressWrap = progressBar.parentElement;
  const dotsEl       = document.getElementById('dots');

  // Animate dots (., .., ...)
  let dotCount = 0;
  const dotsTimer = setInterval(function () {
    dotCount = (dotCount % 3) + 1;
    dotsEl.textContent = '.'.repeat(dotCount);
  }, 500);

  // Animate progress bar to 100 over 3400ms
  let start    = null;
  const DURATION = 3400;

  function step(ts) {
    if (!start) start = ts;
    const pct = Math.min(((ts - start) / DURATION) * 100, 100);
    progressBar.style.width = pct.toFixed(1) + '%';
    progressWrap.setAttribute('aria-valuenow', Math.round(pct));
    if (pct < 100) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);

  // Redirect after DURATION + small buffer
  setTimeout(function () {
    clearInterval(dotsTimer);
    const state  = CheckoutState.get();
    const expiry = (state.paymentInfo && state.paymentInfo.expiryDate) || '';
    const parts  = expiry.match(/^(\d{2})\/(\d{2})$/);
    let expired  = false;
    if (parts) {
      const mm = parseInt(parts[1], 10), yy = parseInt(parts[2], 10);
      const now = new Date(), curMM = now.getMonth() + 1, curYY = now.getFullYear() % 100;
      expired = yy < curYY || (yy === curYY && mm < curMM);
    }
    CheckoutState.set({ step: 5 });
    window.location.href = expired ? 'failure.html' : 'success.html';
  }, DURATION + 200);

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
