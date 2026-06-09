import { buildManualTherapyMergePayload, getManualTherapyRowSpan } from './manualTherapyMergeUtils.js';
import { get4060PrescriptionFromContent } from './schedulerContentFormat.js';

export function resolveManualTherapyAutoPrescription({
  content = '',
  prescription = '',
  intervalMinutes,
  durationMinutesByPrescription = {},
} = {}) {
  const rowSpanOptions = { intervalMinutes, durationMinutesByPrescription };
  const explicitPrescription = String(prescription || '').trim();
  if (getManualTherapyRowSpan(explicitPrescription, rowSpanOptions) > 1) return explicitPrescription;

  const contentPrescription = get4060PrescriptionFromContent(content);
  if (getManualTherapyRowSpan(contentPrescription, rowSpanOptions) > 1) return contentPrescription;

  return '';
}

export function buildManualTherapyAutoMergePayload({
  content = '',
  prescription = '',
  intervalMinutes,
  durationMinutesByPrescription = {},
  ...rest
}) {
  const resolvedPrescription = resolveManualTherapyAutoPrescription({
    content,
    prescription,
    intervalMinutes,
    durationMinutesByPrescription,
  });
  if (!resolvedPrescription) {
    return {
      ok: false,
      reason: 'not-treatment-duration',
      payload: [],
      affectedKeys: [],
      resolvedPrescription: '',
    };
  }

  const result = buildManualTherapyMergePayload({
    ...rest,
    content,
    prescription: resolvedPrescription,
    intervalMinutes,
    durationMinutesByPrescription,
  });

  return {
    ...result,
    resolvedPrescription,
  };
}
