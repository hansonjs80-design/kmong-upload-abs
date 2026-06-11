export function applyManualTherapySplitVisitSuffix(parsedEntry, lastChildContent) {
  if (!parsedEntry || typeof parsedEntry !== 'object') return parsedEntry;
  const text = String(lastChildContent || '').trim();
  if (!text) return parsedEntry;

  const childVisitMatch = text.match(/^\((\d+)₩?\)$/);
  if (childVisitMatch) {
    return { ...parsedEntry, visitCount: childVisitMatch[1] };
  }
  if (text === '*') {
    const patientName = String(parsedEntry.patientName || '').trim();
    return {
      ...parsedEntry,
      patientName: patientName && !patientName.includes('*') ? `${patientName}*` : patientName,
      visitCount: '1',
    };
  }
  if (text === '(-)') {
    return { ...parsedEntry, visitCount: '-' };
  }
  return parsedEntry;
}
