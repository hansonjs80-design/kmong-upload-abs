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
