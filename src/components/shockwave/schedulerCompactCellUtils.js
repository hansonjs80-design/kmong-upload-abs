/**
 * 행 높이가 좁게 설정되어 있을 때(10px 이하), 
 * 셀에 내용은 있으나 처방이나 부위가 입력되어 있지 않은 단일 셀인 경우,
 * 아래 행 셀이 비어있다면 해당 아래 셀 영역까지 확장하여 텍스트가 잘리지 않고 보이도록 시각적 영역(rowSpan)을 연장 계산해 줍니다.
 */
export function getCompactCellVisualRowSpan({
  rowHeight,
  visualRowSpan,
  mergeSpan,
  content,
  displayCellData,
  isLastRenderedRow,
  weekIdx,
  dayIdx,
  rowIdx,
  colIdx,
  renderMemos,
  pendingDisplayValues,
  getEffectiveMergeSpan,
  cellKey,
  compactOverflowCols,
}) {
  const hasNoPrescriptionOrBodyPart = !displayCellData?.prescription && !displayCellData?.body_part;
  
  if (
    rowHeight > 0 && rowHeight <= 10 &&
    visualRowSpan === 1 &&
    mergeSpan.rowSpan <= 1 &&
    content.trim() &&
    hasNoPrescriptionOrBodyPart &&
    !isLastRenderedRow
  ) {
    // 아래 행 셀이 비어있는지 검사
    const nextRowIdx = rowIdx + 1;
    const nextKey = cellKey(weekIdx, dayIdx, nextRowIdx, colIdx);
    const nextMemo = renderMemos[nextKey];
    const nextContent = (pendingDisplayValues[nextKey] ?? nextMemo?.content ?? '').trim();
    const nextMergeSpan = getEffectiveMergeSpan(nextKey, renderMemos);
    const nextIsEmpty = !nextContent && !nextMergeSpan?.mergedInto && (nextMergeSpan?.rowSpan || 1) <= 1;
    
    if (nextIsEmpty) {
      // 아래 행의 이 열은 렌더링 시 건너뛰도록 추적 컬렉션에 추가
      compactOverflowCols.add(`${weekIdx}-${dayIdx}-${nextRowIdx}-${colIdx}`);
      return 2;
    }
  }
  
  return visualRowSpan;
}
