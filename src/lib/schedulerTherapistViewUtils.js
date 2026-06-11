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
  return isSingleFocused ? 'minmax(138px, 1fr)' : fallbackTemplate;
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
