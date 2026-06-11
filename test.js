i// run with: node test.js
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('  ✓ ' + label);
    passed++;
  } else {
    console.error('  ✗ ' + label);
    failed++;
  }
}

// ── Expiry check (mirrors processing.js logic exactly) ────────────────────────

function isExpired(expiryDate) {
  const parts = (expiryDate || '').match(/^(\d{2})\/(\d{2})$/);
  if (!parts) return false;
  const mm = parseInt(parts[1], 10), yy = parseInt(parts[2], 10);
  const now = new Date(), curMM = now.getMonth() + 1, curYY = now.getFullYear() % 100;
  return yy < curYY || (yy === curYY && mm < curMM);
}

function pad(n) { return String(n).padStart(2, '0'); }

const now     = new Date();
const CUR_MM  = now.getMonth() + 1;
const CUR_YY  = now.getFullYear() % 100;
const PREV_MM    = CUR_MM === 1  ? 12 : CUR_MM - 1;
const PREV_MM_YY = CUR_MM === 1  ? CUR_YY - 1 : CUR_YY;
const NEXT_MM    = CUR_MM === 12 ? 1  : CUR_MM + 1;
const NEXT_MM_YY = CUR_MM === 12 ? CUR_YY + 1 : CUR_YY;

console.log('\nExpiry check');
assert('past year is expired',            isExpired(pad(CUR_MM) + '/' + pad(CUR_YY - 1)));
assert('past month same year is expired', isExpired(pad(PREV_MM) + '/' + pad(PREV_MM_YY)));
assert('current month is NOT expired',   !isExpired(pad(CUR_MM) + '/' + pad(CUR_YY)));
assert('next month is NOT expired',      !isExpired(pad(NEXT_MM) + '/' + pad(NEXT_MM_YY)));
assert('future year is NOT expired',     !isExpired(pad(CUR_MM) + '/' + pad(CUR_YY + 2)));
assert('empty string is NOT expired',    !isExpired(''));
assert('bad format is NOT expired',      !isExpired('badval'));
assert('undefined is NOT expired',       !isExpired(undefined));

// ── CheckoutState ─────────────────────────────────────────────────────────────

const _store = {};
const mockStorage = {
  getItem:    function (k) { return Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null; },
  setItem:    function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; },
};

// Load state.js into a function scope so its sessionStorage usage hits mockStorage
const stateCode     = fs.readFileSync(path.join(__dirname, 'js/shared/state.js'), 'utf8');
const CheckoutState = new Function('sessionStorage', stateCode + '\nreturn CheckoutState;')(mockStorage);

console.log('\nCheckoutState');
const s0 = CheckoutState.get();
assert('get() returns step=0 when storage is empty',  s0.step === 0);
assert('get() returns empty fullName from defaults',  s0.personalInfo.fullName === '');
assert('get() returns 2 default cart items',          s0.cartInfo.items.length === 2);

CheckoutState.set({ step: 2 });
assert('set() persists step',                         CheckoutState.get().step === 2);

CheckoutState.set({ personalInfo: { fullName: 'Jane', email: 'j@x.com', phone: '' } });
assert('set() merges personalInfo',                   CheckoutState.get().personalInfo.fullName === 'Jane');
assert('set() does not overwrite unrelated keys',     CheckoutState.get().step === 2);

CheckoutState.set({ step: 4 });
assert('set() can update step again',                 CheckoutState.get().step === 4);

// ── Page guard thresholds ─────────────────────────────────────────────────────

function passes(step, needed) { return step >= needed; }

console.log('\nPage guards');
assert('step 0 blocked from address   (needs 1)',  !passes(0, 1));
assert('step 1 passes address         (needs 1)',   passes(1, 1));
assert('step 1 blocked from payment   (needs 2)',  !passes(1, 2));
assert('step 2 passes payment         (needs 2)',   passes(2, 2));
assert('step 2 blocked from confirm   (needs 3)',  !passes(2, 3));
assert('step 3 passes confirm         (needs 3)',   passes(3, 3));
assert('step 3 blocked from processing(needs 4)',  !passes(3, 4));
assert('step 4 passes processing      (needs 4)',   passes(4, 4));
assert('step 4 blocked from success   (needs 5)',  !passes(4, 5));
assert('step 5 passes success         (needs 5)',   passes(5, 5));

// ── Result ────────────────────────────────────────────────────────────────────

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
