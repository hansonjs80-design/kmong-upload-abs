import test from 'node:test';
import assert from 'node:assert/strict';
import { inheritMonthlyTherapistsFromPreviousRows } from '../monthlyTherapistInheritanceUtils.js';

test('inherits the last non-empty split therapist name for the next month', () => {
  const inherited = inheritMonthlyTherapistsFromPreviousRows([
    { year: 2026, month: 6, slot_index: 1, therapist_name: '차인표', start_day: 1, end_day: 15, type: 'shockwave' },
    { year: 2026, month: 6, slot_index: 1, therapist_name: '김우리', start_day: 16, end_day: 30, type: 'shockwave' },
  ], 2026, 7, 'shockwave');

  assert.deepEqual(inherited, [
    { year: 2026, month: 7, slot_index: 1, therapist_name: '김우리', start_day: 1, end_day: 31, type: 'shockwave' },
  ]);
});

test('ignores empty final split names when inheriting', () => {
  const inherited = inheritMonthlyTherapistsFromPreviousRows([
    { year: 2026, month: 6, slot_index: 1, therapist_name: '김우리', start_day: 1, end_day: 15, type: 'shockwave' },
    { year: 2026, month: 6, slot_index: 1, therapist_name: '', start_day: 16, end_day: 30, type: 'shockwave' },
  ], 2026, 7, 'shockwave');

  assert.deepEqual(inherited, [
    { year: 2026, month: 7, slot_index: 1, therapist_name: '김우리', start_day: 1, end_day: 31, type: 'shockwave' },
  ]);
});
