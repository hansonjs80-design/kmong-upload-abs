import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisibleTherapistSlots } from '../schedulerTherapistViewUtils.js';

test('getVisibleTherapistSlots treats null focus as all therapists', () => {
  assert.deepEqual(getVisibleTherapistSlots(3, null), [0, 1, 2]);
});

test('getVisibleTherapistSlots shows a single focused therapist when index is valid', () => {
  assert.deepEqual(getVisibleTherapistSlots(3, 1), [1]);
});
