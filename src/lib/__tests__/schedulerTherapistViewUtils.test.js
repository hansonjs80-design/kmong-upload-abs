import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVisibleTherapistRangeKeys,
  getVisibleTherapistSlots,
} from '../schedulerTherapistViewUtils.js';

test('getVisibleTherapistSlots treats null focus as all therapists', () => {
  assert.deepEqual(getVisibleTherapistSlots(3, null), [0, 1, 2]);
});

test('getVisibleTherapistSlots shows a single focused therapist when index is valid', () => {
  assert.deepEqual(getVisibleTherapistSlots(3, 1), [1]);
});

test('buildVisibleTherapistRangeKeys spans intermediate therapist columns across days', () => {
  const weeks = [[{}, {}, {}, {}, {}, {}]];
  const keys = buildVisibleTherapistRangeKeys({
    anchor: { w: 0, d: 2, r: 4, c: 0 },
    target: { w: 0, d: 3, r: 5, c: 1 },
    weeks,
    visibleTherapistSlots: [0, 1, 2],
    cellKey: (w, d, r, c) => `${w}-${d}-${r}-${c}`,
    normalizeCell: (cell) => cell,
  });

  assert.deepEqual([...keys].sort(), [
    '0-2-4-0',
    '0-2-4-1',
    '0-2-4-2',
    '0-2-5-0',
    '0-2-5-1',
    '0-2-5-2',
    '0-3-4-0',
    '0-3-4-1',
    '0-3-5-0',
    '0-3-5-1',
  ]);
});

test('buildVisibleTherapistRangeKeys only selects the focused therapist column', () => {
  const weeks = [[{}, {}, {}, {}, {}, {}]];
  const keys = buildVisibleTherapistRangeKeys({
    anchor: { w: 0, d: 2, r: 4, c: 1 },
    target: { w: 0, d: 4, r: 4, c: 1 },
    weeks,
    visibleTherapistSlots: [1],
    cellKey: (w, d, r, c) => `${w}-${d}-${r}-${c}`,
    normalizeCell: (cell) => cell,
  });

  assert.deepEqual([...keys].sort(), [
    '0-2-4-1',
    '0-3-4-1',
    '0-4-4-1',
  ]);
});
