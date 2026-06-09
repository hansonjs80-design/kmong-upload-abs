import { useEffect } from 'react';

/**
 * 활성 행(hover, selected, editing 상태)에 맞춰 좌측 시간 열의 배경색을 하늘색으로 변경하고,
 * 시간 셀이 행 높이 축소로 병합된 상태일 경우 마우스 호버 시 병합된 시간의 텍스트를 원래 시간으로 동적으로 전환해 주는 사이드 이펙트 훅입니다.
 */
export default function useScheduleHoverHighlight({
  hoverCell,
  selectedCell,
  editingCell,
  rowHeight,
  intervalMinutes,
  weeks,
  getTimeSlotsForDay,
  shouldHideCompactTimeLabel,
  viewRef,
}) {
  useEffect(() => {
    let activeWeek = null;
    let activeDay = null;
    let activeRow = null;
    if (hoverCell) {
      activeWeek = hoverCell.weekIdx;
      activeDay = hoverCell.dayIdx;
      activeRow = hoverCell.rowIdx;
    } else if (editingCell) {
      const parts = editingCell.split('-').map(Number);
      if (parts.length >= 3) {
        activeWeek = parts[0];
        activeDay = parts[1];
        activeRow = parts[2];
      }
    } else if (selectedCell) {
      activeWeek = selectedCell.w;
      activeDay = selectedCell.d;
      activeRow = selectedCell.r;
    }

    const container = viewRef.current;
    if (!container) return;

    const prevActive = container.querySelectorAll('.sw-time-label.active-row');
    prevActive.forEach((el) => {
      el.classList.remove('active-row');
      el.removeAttribute('data-active-time-label');
    });

    if (activeWeek !== null && activeRow !== null) {
      const targetDay = activeDay !== null && activeDay !== undefined ? activeDay : 0;
      const dayInfo = weeks?.[activeWeek]?.[targetDay];
      const daySlots = dayInfo ? getTimeSlotsForDay(dayInfo) : [];

      if (daySlots.length > 0) {
        const slotRenderIndex = daySlots.findIndex((s) => s.idx === activeRow);
        if (slotRenderIndex !== -1) {
          // 화면에 렌더링된 실제 (병합된) 시간 셀의 인덱스를 위로 거슬러 올라가며 찾습니다.
          let visibleSlotRenderIndex = slotRenderIndex;
          while (visibleSlotRenderIndex > 0 && shouldHideCompactTimeLabel(visibleSlotRenderIndex, rowHeight)) {
            visibleSlotRenderIndex--;
          }
          const visibleRowIdx = daySlots[visibleSlotRenderIndex]?.idx;
          
          if (visibleRowIdx !== undefined) {
            const timeCell = container.querySelector(`[data-time-row="${activeWeek}-${visibleRowIdx}"]`);
            if (timeCell) {
              timeCell.classList.add('active-row');
              const exactTimeLabel = daySlots[slotRenderIndex]?.label || '';
              if (exactTimeLabel) {
                timeCell.setAttribute('data-active-time-label', exactTimeLabel);
              }
            }
          }
        }
      }
    }
  }, [hoverCell, selectedCell, editingCell, rowHeight, intervalMinutes, weeks, getTimeSlotsForDay, shouldHideCompactTimeLabel, viewRef]);
}
