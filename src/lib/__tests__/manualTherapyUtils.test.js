import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyManualTherapySplitVisitSuffix } from '../manualTherapyVisitUtils.js';

describe('manual therapy schedule sync helpers', () => {
  it('keeps a new patient marker from a split lower visit row', () => {
    const parsed = { patientName: '주한솔', visitCount: '' };
    const result = applyManualTherapySplitVisitSuffix(parsed, '*');

    assert.equal(result.patientName, '주한솔*');
    assert.equal(result.visitCount, '1');
  });

  it('keeps a numeric visit suffix from a split lower visit row', () => {
    const parsed = { patientName: '주한솔', visitCount: '' };
    const result = applyManualTherapySplitVisitSuffix(parsed, '(3)');

    assert.equal(result.patientName, '주한솔');
    assert.equal(result.visitCount, '3');
  });
});
