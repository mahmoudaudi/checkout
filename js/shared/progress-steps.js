// Builds the 6-step checkout progress indicator into the given container element.
// currentStep: 1 = Cart, 2 = Personal Info, 3 = Address, 4 = Payment, 5 = Review, 6 = Done
function buildProgressSteps(containerId, currentStep) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var STEPS = [
    { id: 1, short: 'Cart',    full: 'Cart' },
    { id: 2, short: 'Contact', full: 'Personal Info' },
    { id: 3, short: 'Address', full: 'Address' },
    { id: 4, short: 'Payment', full: 'Payment' },
    { id: 5, short: 'Review',  full: 'Review' },
    { id: 6, short: 'Done',    full: 'Confirmation' },
  ];

  var CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  var ol = document.createElement('ol');
  ol.className = 'progress-steps__list';

  STEPS.forEach(function (step, index) {
    var isDone   = currentStep > step.id;
    var isActive = currentStep === step.id;

    var li = document.createElement('li');
    li.className = 'progress-steps__item';

    if (isActive) {
      var pulse = document.createElement('div');
      pulse.className = 'progress-steps__pulse';
      pulse.setAttribute('aria-hidden', 'true');
      li.appendChild(pulse);
    }

    var circle = document.createElement('div');
    var circleClasses = ['progress-steps__circle'];
    if (isDone)   circleClasses.push('progress-steps__circle--done');
    if (isActive) circleClasses.push('progress-steps__circle--active');
    circle.className = circleClasses.join(' ');
    circle.setAttribute('aria-label', isDone ? step.full + ' completed' : isActive ? step.full + ' (current step)' : step.full);
    circle.innerHTML = isDone
      ? CHECK
      : '<span class="progress-steps__number" aria-hidden="true">' + step.id + '</span>';

    var label = document.createElement('span');
    label.className = 'progress-steps__label' + (currentStep >= step.id ? ' progress-steps__label--active' : '');
    label.innerHTML =
      '<span class="progress-steps__label-short">' + step.short + '</span>' +
      '<span class="progress-steps__label-full">'  + step.full  + '</span>';

    li.appendChild(circle);
    li.appendChild(label);
    ol.appendChild(li);

    if (index < STEPS.length - 1) {
      var connWrap = document.createElement('li');
      connWrap.className = 'progress-steps__connector-wrap';
      connWrap.setAttribute('aria-hidden', 'true');
      var conn = document.createElement('div');
      conn.className = 'progress-steps__connector' + (isDone ? ' progress-steps__connector--done' : '');
      connWrap.appendChild(conn);
      ol.appendChild(connWrap);
    }
  });

  container.appendChild(ol);
}
