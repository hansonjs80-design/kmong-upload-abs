import { DAY_NAMES } from './schedulerOperatingHours.js';

export function getVisibleTherapistSlots(colCount, focusedTherapistSlot) {
  const count = Math.max(1, Number(colCount) || 1);
  if (focusedTherapistSlot === null || focusedTherapistSlot === undefined || focusedTherapistSlot === '') {
    return Array.from({ length: count }, (_, index) => index);
  }
  const focused = Number(focusedTherapistSlot);
  if (Number.isInteger(focused) && focused >= 0 && focused < count) {
    return [focused];
  }
  return Array.from({ length: count }, (_, index) => index);
}

export function isSingleTherapistFocus(visibleTherapistSlots, colCount) {
  return Array.isArray(visibleTherapistSlots)
    && visibleTherapistSlots.length === 1
    && Number(colCount) > 1;
}

export function getTherapistGridTemplate(isSingleFocused, fallbackTemplate) {
  return isSingleFocused ? 'minmax(0, 1fr)' : fallbackTemplate;
}

export function getFocusedDayColumnWidth(dayColWidth, colCount, isSingleFocused, focusedDayColWidth = 0) {
  if (!isSingleFocused) return dayColWidth;
  if (focusedDayColWidth) return Math.max(97, Number(focusedDayColWidth) || 0);
  if (!dayColWidth) return null;
  return Math.max(160, Math.round(dayColWidth / Math.max(1, colCount) + 34));
}

export function getScheduleDateHeaderLabel(dayInfo, isSingleFocused) {
  const weekday = DAY_NAMES[dayInfo.dow];
  if (isSingleFocused) {
    return `${dayInfo.month}월 ${dayInfo.day}일 (${weekday})`;
  }
  return `${dayInfo.month}월 ${dayInfo.day}일 ${weekday}요일`;
}

export function buildVisibleTherapistRangeKeys({
  anchor,
  target,
  weeks,
  visibleTherapistSlots,
  cellKey,
  normalizeCell,
}) {
  if (!anchor || !target || !Array.isArray(weeks) || typeof cellKey !== 'function') return null;
  if (anchor.w !== target.w) return null;

  const slots = Array.isArray(visibleTherapistSlots) && visibleTherapistSlots.length
    ? visibleTherapistSlots
    : [anchor.c];
  const normalizedAnchor = typeof normalizeCell === 'function' ? normalizeCell(anchor) : anchor;
  const normalizedTarget = typeof normalizeCell === 'function' ? normalizeCell(target) : target;
  const anchorVisibleCol = slots.indexOf(normalizedAnchor.c);
  const targetVisibleCol = slots.indexOf(normalizedTarget.c);
  const weekDays = weeks[normalizedAnchor.w];

  if (!Array.isArray(weekDays) || anchorVisibleCol < 0 || targetVisibleCol < 0) return null;

  const visibleColCount = slots.length;
  const anchorFlatCol = normalizedAnchor.d * visibleColCount + anchorVisibleCol;
  const targetFlatCol = normalizedTarget.d * visibleColCount + targetVisibleCol;
  const minFlatCol = Math.min(anchorFlatCol, targetFlatCol);
  const maxFlatCol = Math.max(anchorFlatCol, targetFlatCol);
  const minRow = Math.min(normalizedAnchor.r, normalizedTarget.r);
  const maxRow = Math.max(normalizedAnchor.r, normalizedTarget.r);
  const keys = new Set();

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let flatCol = minFlatCol; flatCol <= maxFlatCol; flatCol += 1) {
      const dayIdx = Math.floor(flatCol / visibleColCount);
      const visibleColIdx = flatCol % visibleColCount;
      if (!weekDays[dayIdx]) continue;
      const actualCol = slots[visibleColIdx];
      const cell = { w: normalizedAnchor.w, d: dayIdx, r: row, c: actualCol };
      const normalizedCell = typeof normalizeCell === 'function' ? normalizeCell(cell) : cell;
      keys.add(cellKey(normalizedCell.w, normalizedCell.d, normalizedCell.r, normalizedCell.c));
    }
  }

  return keys;
}
