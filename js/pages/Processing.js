document.addEventListener('DOMContentLoaded', function () {
  var progressBar  = document.getElementById('progress-bar');
  var progressWrap = progressBar.parentElement;
  var dotsEl       = document.getElementById('dots');

  // Animate dots (., .., ...)
  var dotCount = 0;
  var dotsTimer = setInterval(function () {
    dotCount = (dotCount % 3) + 1;
    dotsEl.textContent = '.'.repeat(dotCount);
  }, 500);

  // Animate progress bar to 100 over 3400ms
  var start    = null;
  var DURATION = 3400;

  function step(ts) {
    if (!start) start = ts;
    var pct = Math.min(((ts - start) / DURATION) * 100, 100);
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
    var success = Math.random() < 0.7;
    window.location.href = success ? 'success.html' : 'failure.html';
  }, DURATION + 200);
});
