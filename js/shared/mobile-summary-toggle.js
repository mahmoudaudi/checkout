document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('mst-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    const body  = document.getElementById('mst-body');
    const open  = this.getAttribute('aria-expanded') === 'true';

    this.setAttribute('aria-expanded', String(!open));
    body.hidden = open;
    this.querySelector('.mst-chevron').style.transform = open ? '' : 'rotate(180deg)';

    const label = this.querySelector('.mst-left span:not(.mst-chevron)');
    if (label) label.textContent = open ? 'Show order summary' : 'Hide order summary';
  });
});
