export function getMonthValue(year, month) {
  return (Number(year) * 12) + Number(month);
}

export function inheritMonthlyTherapistsFromPreviousRows(previousRows, year, month, type) {
  const rows = Array.isArray(previousRows) ? previousRows.filter(Boolean) : [];
  const currentValue = getMonthValue(year, month);
  const previousMonths = rows.filter((item) => getMonthValue(item.year, item.month) < currentValue);
  const inheritedValue = previousMonths.reduce((max, item) => (
    Math.max(max, getMonthValue(item.year, item.month))
  ), -Infinity);

  if (!Number.isFinite(inheritedValue)) return [];

  const prevData = previousMonths.filter((item) => getMonthValue(item.year, item.month) === inheritedValue);
  const slotMap = new Map();
  prevData.forEach((item) => {
    const slotIndex = Number(item?.slot_index);
    const name = String(item?.therapist_name || '').trim();
    if (!Number.isInteger(slotIndex) || !name) return;
    const startDay = Number(item?.start_day) || 1;
    const endDay = Number(item?.end_day) || 31;
    const existing = slotMap.get(slotIndex);
    if (!existing || endDay > existing.endDay || (endDay === existing.endDay && startDay > existing.startDay)) {
      slotMap.set(slotIndex, {
        slotIndex,
        therapistName: name,
        startDay,
        endDay,
      });
    }
  });

  const lastDay = new Date(year, month, 0).getDate();
  return Array.from(slotMap.values())
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map((item) => ({
      slot_index: item.slotIndex,
      therapist_name: item.therapistName,
      start_day: 1,
      end_day: lastDay,
      year,
      month,
      type,
    }));
}

export function resolveMonthlyTherapistName({
  slotIndex,
  day,
  year,
  month,
  monthlyTherapists,
  fallbackName = '',
}) {
  const rows = Array.isArray(monthlyTherapists)
    ? monthlyTherapists.filter((item) => Number(item?.slot_index) === Number(slotIndex))
    : [];
  if (rows.length === 0) return fallbackName;

  const targetYear = Number(year);
  const targetMonth = Number(month);
  const targetMonthValue = getMonthValue(targetYear, targetMonth);
  const hasDatedRows = rows.some((item) => (
    Number.isFinite(Number(item?.year)) && Number.isFinite(Number(item?.month))
  ));

  const isDayInRange = (item) => {
    const startDay = Number(item?.start_day) || 1;
    const endDay = Number(item?.end_day) || 31;
    return Number(day) >= startDay && Number(day) <= endDay;
  };

  const exactRows = hasDatedRows
    ? rows.filter((item) => Number(item?.year) === targetYear && Number(item?.month) === targetMonth)
    : rows;
  const exactMatch = exactRows.find(isDayInRange);
  if (exactMatch !== undefined) return exactMatch.therapist_name || '';

  if (!hasDatedRows) return fallbackName;

  const nearestMonthValue = rows.reduce((best, item) => {
    const rowYear = Number(item?.year);
    const rowMonth = Number(item?.month);
    if (!Number.isFinite(rowYear) || !Number.isFinite(rowMonth)) return best;
    const value = getMonthValue(rowYear, rowMonth);
    const distance = Math.abs(value - targetMonthValue);
    if (!best || distance < best.distance || (distance === best.distance && value > best.value)) {
      return { value, distance };
    }
    return best;
  }, null);

  if (!nearestMonthValue) return fallbackName;

  const nearestRows = rows.filter((item) => (
    getMonthValue(item?.year, item?.month) === nearestMonthValue.value
  ));
  const nearestMatch = nearestRows.find(isDayInRange);
  if (nearestMatch !== undefined) return nearestMatch.therapist_name || '';

  return fallbackName;
}
