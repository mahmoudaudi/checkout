// Renders the checkout progress stepper into containerId.
// currentStep: 1=Cart 2=PersonalInfo 3=Address 4=Payment 5=Review 6=Done
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

  var CHECK = '<i data-lucide="check" width="12" height="12" stroke-width="2.5" aria-hidden="true"></i>';

  var ol = document.createElement('ol');
  ol.className = 'progress-steps__list';

  STEPS.forEach(function (step, index) {
    var isDone   = currentStep > step.id;
    var isActive = currentStep === step.id;
    var isFuture = !isDone && !isActive;

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
    if (isFuture) circleClasses.push('progress-steps__circle--future');
    circle.className = circleClasses.join(' ');
    circle.setAttribute('aria-label', isDone ? step.full + ' completed' : isActive ? step.full + ' (current step)' : step.full);
    circle.innerHTML = isDone
      ? CHECK
      : '<span class="progress-steps__number" aria-hidden="true">' + step.id + '</span>';

    var label = document.createElement('span');
    var labelClass = 'progress-steps__label';
    if (isActive) labelClass += ' progress-steps__label--active';
    else if (isDone) labelClass += ' progress-steps__label--done';
    label.className = labelClass;
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
      var connClass = 'progress-steps__connector';
      if (isDone)   connClass += ' progress-steps__connector--done';
      if (isFuture) connClass += ' progress-steps__connector--future';
      conn.className = connClass;
      connWrap.appendChild(conn);
      ol.appendChild(connWrap);
    }
  });

  container.appendChild(ol);
}
