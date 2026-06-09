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
  baseTimeSlots = [],
  shouldHideCompactTimeLabel,
  viewRef,
}) {
  useEffect(() => {
    let activeWeek = null;
    let activeRow = null;

    if (hoverCell) {
      activeWeek = hoverCell.weekIdx;
      activeRow = hoverCell.rowIdx;
    } else if (editingCell) {
      const parts = editingCell.split('-').map(Number);
      if (parts.length >= 3) {
        activeWeek = parts[0];
        activeRow = parts[2];
      }
    } else if (selectedCell) {
      activeWeek = selectedCell.w;
      activeRow = selectedCell.r;
    }

    const container = viewRef.current;
    if (!container) return;

    // 이전 활성화된 스타일 모두 제거
    const prevActive = container.querySelectorAll('.sw-time-label.active-row');
    prevActive.forEach((el) => {
      el.classList.remove('active-row');
      el.removeAttribute('data-active-time-label');
    });

    if (activeWeek !== null && activeRow !== null && activeRow !== undefined) {
      // 행 높이에 따라 숨겨진 시간 셀인 경우, 부모 병합 셀을 찾아서 표시
      let visibleRowIdx = activeRow;
      while (visibleRowIdx > 0 && shouldHideCompactTimeLabel(visibleRowIdx, rowHeight)) {
        visibleRowIdx--;
      }

      const timeCell = container.querySelector(`[data-time-row="${activeWeek}-${visibleRowIdx}"]`);
      if (timeCell) {
        timeCell.classList.add('active-row');
        // 호버된 행의 실제 시간 레이블을 구합니다.
        const exactTimeLabel = hoverCell?.slotInfo?.label || baseTimeSlots[activeRow]?.label || '';
        if (exactTimeLabel) {
          timeCell.setAttribute('data-active-time-label', exactTimeLabel);
        }
      }
    }
  }, [hoverCell, selectedCell, editingCell, rowHeight, baseTimeSlots, shouldHideCompactTimeLabel, viewRef]);
}
