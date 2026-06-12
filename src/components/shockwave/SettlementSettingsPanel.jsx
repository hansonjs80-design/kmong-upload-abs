import React, { useEffect, useMemo, useState } from 'react';
import { setMonthlySettlementSettings } from '../../lib/settlementSettings';
import { extractDoseTagFromPrescription } from '../../lib/schedulerContentFormat';
import { getTreatmentDurationMinutes } from '../../lib/manualTherapyMergeUtils';

export default function SettlementSettingsPanel({
  type = 'shockwave',
  year,
  month,
  settings,
  effectiveSettings,
  therapistOptions = [],
  onSave,
}) {
  const isManualTherapy = type === 'manual_therapy';

  const getBaseDoseTags = () => (
    effectiveSettings?.dose_tags
    || (isManualTherapy ? settings?.manual_therapy_dose_tags : settings?.shockwave_dose_tags)
    || {}
  );

  const [draft, setDraft] = useState(() => ({
    prescriptions: effectiveSettings?.prescriptions || [],
    prescription_prices: effectiveSettings?.prescription_prices || {},
    prescription_colors: effectiveSettings?.prescription_colors || settings?.prescription_colors || {},
    incentive_percentage: effectiveSettings?.incentive_percentage ?? 0,
    dose_tags: getBaseDoseTags(),
    shortcuts: effectiveSettings?.shortcuts || (isManualTherapy ? settings?.manual_therapy_shortcuts : settings?.shortcuts) || {},
    duration_minutes: effectiveSettings?.duration_minutes || {},
    visit_on_lower_row: (isManualTherapy ? settings?.manual_therapy_visit_on_lower_row : settings?.visit_on_lower_row) || {},
    therapist_names: effectiveSettings?.therapist_names || [],
  }));

  const title = isManualTherapy ? '도수치료 결산 설정' : '충격파 결산 설정';
  const addPlaceholder = isManualTherapy ? '+ 도수 처방' : '+ 처방';
  const sourceText = useMemo(() => {
    if (!effectiveSettings?.source_month_key) return '기존 기본 설정 사용 중';
    if (effectiveSettings.source_month_key === effectiveSettings.target_month_key) return '이번 달 직접 설정 사용 중';
    return `${effectiveSettings.source_month_key} 설정을 이어받아 적용 중`;
  }, [effectiveSettings?.source_month_key, effectiveSettings?.target_month_key]);

  useEffect(() => {
    setDraft({
      prescriptions: effectiveSettings?.prescriptions || [],
      prescription_prices: effectiveSettings?.prescription_prices || {},
      prescription_colors: effectiveSettings?.prescription_colors || settings?.prescription_colors || {},
      incentive_percentage: effectiveSettings?.incentive_percentage ?? 0,
      dose_tags: getBaseDoseTags(),
      shortcuts: effectiveSettings?.shortcuts || (isManualTherapy ? settings?.manual_therapy_shortcuts : settings?.shortcuts) || {},
      duration_minutes: effectiveSettings?.duration_minutes || {},
      visit_on_lower_row: (isManualTherapy ? settings?.manual_therapy_visit_on_lower_row : settings?.visit_on_lower_row) || {},
      therapist_names: effectiveSettings?.therapist_names || [],
    });
  }, [effectiveSettings, settings?.prescription_colors, settings?.manual_therapy_dose_tags, settings?.shockwave_dose_tags, settings?.shortcuts, settings?.manual_therapy_shortcuts, settings?.visit_on_lower_row, settings?.manual_therapy_visit_on_lower_row, isManualTherapy]);

  const normalizedTherapistOptions = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(therapistOptions) ? therapistOptions : [])
      .map((item) => String(item?.name || item || '').trim())
      .filter((name) => {
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
  }, [therapistOptions]);

  const effectiveSelectedTherapistNames = useMemo(() => {
    const configured = Array.isArray(draft.therapist_names)
      ? draft.therapist_names.map((name) => String(name || '').trim()).filter(Boolean)
      : [];
    if (configured.length > 0) return configured;
    return normalizedTherapistOptions;
  }, [draft.therapist_names, normalizedTherapistOptions]);

  const selectedTherapistSet = useMemo(
    () => new Set(effectiveSelectedTherapistNames),
    [effectiveSelectedTherapistNames]
  );

  const toggleTherapistName = (name) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.therapist_names) && prev.therapist_names.length > 0
        ? prev.therapist_names.map((item) => String(item || '').trim()).filter(Boolean)
        : normalizedTherapistOptions;
      if (current.includes(name)) {
        const next = current.filter((item) => item !== name);
        return { ...prev, therapist_names: next.length > 0 ? next : current };
      }
      return { ...prev, therapist_names: [...current, name] };
    });
  };

  const moveTherapistName = (index, direction) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.therapist_names) && prev.therapist_names.length > 0
        ? prev.therapist_names.map((item) => String(item || '').trim()).filter(Boolean)
        : normalizedTherapistOptions;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return prev;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return { ...prev, therapist_names: next };
    });
  };

  /** 처방별 셀 태그 값을 반환 (사용자 지정 → 자동 추출 순) */
  const getDoseTag = (prescription) => {
    if (draft.dose_tags[prescription] !== undefined) return draft.dose_tags[prescription];
    return extractDoseTagFromPrescription(prescription);
  };

  const getDurationMinutes = (prescription) => {
    const configured = draft.duration_minutes?.[prescription];
    if (configured !== undefined && configured !== null && configured !== '') return configured;
    return getTreatmentDurationMinutes(prescription);
  };

  const updatePrescription = (index, value) => {
    const nextValue = value.trim();
    setDraft((prev) => {
      const previousName = prev.prescriptions[index];
      const nextPrescriptions = prev.prescriptions.map((item, itemIndex) => (
        itemIndex === index ? value : item
      ));
      const nextPrices = { ...prev.prescription_prices };
      const nextDoseTags = { ...prev.dose_tags };
      if (nextValue && previousName && previousName !== nextValue) {
        nextPrices[nextValue] = nextPrices[previousName] ?? 0;
        delete nextPrices[previousName];
        const nextColors = { ...(prev.prescription_colors || {}) };
        nextColors[nextValue] = nextColors[previousName] || '#000000';
        delete nextColors[previousName];
        if (nextDoseTags[previousName] !== undefined) {
          nextDoseTags[nextValue] = nextDoseTags[previousName];
          delete nextDoseTags[previousName];
        }
        const nextShortcuts = { ...prev.shortcuts };
        if (nextShortcuts[previousName] !== undefined) {
          nextShortcuts[nextValue] = nextShortcuts[previousName];
          delete nextShortcuts[previousName];
        }
        const nextDurationMinutes = { ...(prev.duration_minutes || {}) };
        const nextVisitOnLowerRow = { ...(prev.visit_on_lower_row || {}) };
        if (nextDurationMinutes[previousName] !== undefined) {
          nextDurationMinutes[nextValue] = nextDurationMinutes[previousName];
          delete nextDurationMinutes[previousName];
        }
        if (nextVisitOnLowerRow[previousName] !== undefined) {
          nextVisitOnLowerRow[nextValue] = nextVisitOnLowerRow[previousName];
          delete nextVisitOnLowerRow[previousName];
        }
        return {
          ...prev,
          prescriptions: nextPrescriptions,
          prescription_prices: nextPrices,
          prescription_colors: nextColors,
          dose_tags: nextDoseTags,
          shortcuts: nextShortcuts,
          duration_minutes: nextDurationMinutes,
          visit_on_lower_row: nextVisitOnLowerRow,
        };
      }
      return { ...prev, prescriptions: nextPrescriptions, prescription_prices: nextPrices };
    });
  };

  const removePrescription = (index) => {
    setDraft((prev) => {
      const target = prev.prescriptions[index];
      const nextPrices = { ...prev.prescription_prices };
      const nextColors = { ...(prev.prescription_colors || {}) };
      const nextDoseTags = { ...prev.dose_tags };
      const nextShortcuts = { ...prev.shortcuts };
      const nextDurationMinutes = { ...(prev.duration_minutes || {}) };
      const nextVisitOnLowerRow = { ...(prev.visit_on_lower_row || {}) };
      delete nextPrices[target];
      delete nextColors[target];
      delete nextDoseTags[target];
      delete nextShortcuts[target];
      delete nextDurationMinutes[target];
      delete nextVisitOnLowerRow[target];
      return {
        ...prev,
        prescriptions: prev.prescriptions.filter((_, itemIndex) => itemIndex !== index),
        prescription_prices: nextPrices,
        prescription_colors: nextColors,
        dose_tags: nextDoseTags,
        shortcuts: nextShortcuts,
        duration_minutes: nextDurationMinutes,
        visit_on_lower_row: nextVisitOnLowerRow,
      };
    });
  };

  const addPrescription = (value) => {
    const nextValue = value.trim();
    if (!nextValue) return false;
    setDraft((prev) => {
      if (prev.prescriptions.includes(nextValue)) return prev;
      return {
        ...prev,
        prescriptions: [...prev.prescriptions, nextValue],
        prescription_prices: {
          ...prev.prescription_prices,
          [nextValue]: prev.prescription_prices?.[nextValue] ?? 0,
        },
        prescription_colors: {
          ...(prev.prescription_colors || {}),
          [nextValue]: prev.prescription_colors?.[nextValue] || '#000000',
        },
        duration_minutes: {
          ...(prev.duration_minutes || {}),
          [nextValue]: prev.duration_minutes?.[nextValue] || getTreatmentDurationMinutes(nextValue) || 0,
        },
      };
    });
    return true;
  };

  const handleSave = async () => {
    const cleanedPrescriptions = draft.prescriptions.map((item) => String(item || '').trim()).filter(Boolean);
    const cleanedColors = cleanedPrescriptions.reduce((acc, prescription) => {
      if (draft.prescription_colors?.[prescription]) {
        acc[prescription] = draft.prescription_colors[prescription];
      }
      return acc;
    }, {});
    // 셀 태그: 자동 추출값과 같으면 저장하지 않음 (기본값 사용)
    const cleanedDoseTags = {};
    cleanedPrescriptions.forEach((prescription) => {
      const customTag = draft.dose_tags[prescription];
      const autoTag = extractDoseTagFromPrescription(prescription);
      if (customTag !== undefined && customTag !== autoTag) {
        cleanedDoseTags[prescription] = customTag;
      }
    });
    const cleanedShortcuts = {};
    cleanedPrescriptions.forEach(prescription => {
      const customShortcut = String(draft.shortcuts[prescription] || '').trim();
      if (customShortcut) {
        cleanedShortcuts[prescription] = customShortcut;
      }
    });
    const cleanedDurationMinutes = {};
    cleanedPrescriptions.forEach((prescription) => {
      const value = Number(draft.duration_minutes?.[prescription]);
      if (Number.isFinite(value) && value > 0) {
        cleanedDurationMinutes[prescription] = value;
        return;
      }
      const inferred = getTreatmentDurationMinutes(prescription);
      if (inferred > 0) cleanedDurationMinutes[prescription] = inferred;
    });

    const cleanedVisitOnLowerRow = {};
    cleanedPrescriptions.forEach((prescription) => {
      if (draft.visit_on_lower_row?.[prescription]) {
        cleanedVisitOnLowerRow[prescription] = true;
      }
    });
    const cleanedTherapistNames = effectiveSelectedTherapistNames
      .map((name) => String(name || '').trim())
      .filter(Boolean);

    const cleaned = {
      prescriptions: cleanedPrescriptions,
      prescription_prices: draft.prescription_prices,
      prescription_colors: cleanedColors,
      incentive_percentage: Number(draft.incentive_percentage) || 0,
      shortcuts: cleanedShortcuts,
      duration_minutes: cleanedDurationMinutes,
      visit_on_lower_row: cleanedVisitOnLowerRow,
      dose_tags: cleanedDoseTags,
      therapist_names: cleanedTherapistNames,
    };
    const monthly_settlement_settings = setMonthlySettlementSettings(settings, year, month, type, cleaned);
    const nextSettings = {
      ...settings,
      prescription_prices: {
        ...(settings?.prescription_prices || {}),
        ...cleaned.prescription_prices,
      },
      prescription_colors: {
        ...(settings?.prescription_colors || {}),
        ...cleaned.prescription_colors,
      },
      monthly_settlement_settings,
    };

    if (type === 'manual_therapy') {
      nextSettings.manual_therapy_prescriptions = cleaned.prescriptions;
      nextSettings.manual_therapy_incentive_percentage = cleaned.incentive_percentage;
      nextSettings.manual_therapy_dose_tags = { ...cleanedDoseTags };
      nextSettings.manual_therapy_shortcuts = { ...cleanedShortcuts };
      nextSettings.manual_therapy_duration_minutes = { ...cleanedDurationMinutes };
      nextSettings.manual_therapy_visit_on_lower_row = { ...cleanedVisitOnLowerRow };
    } else {
      nextSettings.prescriptions = cleaned.prescriptions;
      nextSettings.incentive_percentage = cleaned.incentive_percentage;
      nextSettings.shockwave_dose_tags = { ...cleanedDoseTags };
      nextSettings.shortcuts = { ...cleanedShortcuts };
      nextSettings.duration_minutes = { ...cleanedDurationMinutes };
      nextSettings.visit_on_lower_row = { ...cleanedVisitOnLowerRow };
    }

    await onSave(nextSettings);
  };

  return (
    <div className="sw-stats-body sw-stats-body--settlement">
      <div className="sw-settlement-card sw-settlement-settings-card settlement-settings-pro">
        <div className="settlement-settings-pro-header">
          <div className="settlement-settings-title-block">
            <span className="settlement-settings-kicker">
              {year}년 {String(month).padStart(2, '0')}월
            </span>
            <h2>{title}</h2>
            <p>{sourceText}</p>
          </div>
          <div className="settlement-settings-actions">
            <label className="settlement-incentive-control">
              <span>인센티브</span>
              <div>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step={0.1}
                  value={draft.incentive_percentage}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setDraft((prev) => ({
                      ...prev,
                      incentive_percentage: Number.isFinite(value) ? value : 0,
                    }));
                  }}
                />
                <em>%</em>
              </div>
            </label>
            <button type="button" className="btn btn-primary settlement-save-btn" onClick={handleSave}>
              이번 달 설정 저장
            </button>
          </div>
        </div>

        <div className="settlement-settings-pro-grid">
          <section className="settlement-settings-panel settlement-therapist-picker">
            <div className="settlement-panel-head">
              <div>
                <strong>통계 치료사</strong>
                <span>표시할 치료사와 순서</span>
              </div>
              <small>{effectiveSelectedTherapistNames.length}명 선택</small>
            </div>
            {normalizedTherapistOptions.length === 0 ? (
              <p className="settlement-empty-hint">완료된 스케줄 기록이 생기면 치료사 이름이 여기에 표시됩니다.</p>
            ) : (
              <div className="settlement-therapist-list">
                {normalizedTherapistOptions.map((name) => {
                  const isSelected = selectedTherapistSet.has(name);
                  const selectedIndex = effectiveSelectedTherapistNames.indexOf(name);
                  return (
                    <div key={name} className={`settlement-therapist-item ${isSelected ? 'is-selected' : ''}`}>
                      <label>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTherapistName(name)}
                        />
                        <span>{name}</span>
                      </label>
                      <div className="settlement-therapist-order">
                        <button
                          type="button"
                          className="settlement-icon-btn"
                          disabled={!isSelected || selectedIndex <= 0}
                          onClick={() => moveTherapistName(selectedIndex, -1)}
                          title="위로 이동"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="settlement-icon-btn"
                          disabled={!isSelected || selectedIndex < 0 || selectedIndex >= effectiveSelectedTherapistNames.length - 1}
                          onClick={() => moveTherapistName(selectedIndex, 1)}
                          title="아래로 이동"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="settlement-settings-panel settlement-prescription-panel">
            <div className="settlement-panel-head">
              <div>
                <strong>처방 설정</strong>
                <span>스케줄 입력, 병합, 단축키와 연동</span>
              </div>
              <small>{draft.prescriptions.length}개 처방</small>
            </div>
            <div className="settlement-prescription-table">
              <div className="settlement-prescription-head">
                <span>처방</span>
                <span>셀 태그</span>
                <span>시간</span>
                <span>단축키</span>
                <span>단가</span>
                <span>색</span>
                <span>회차</span>
                <span></span>
              </div>
              {draft.prescriptions.map((prescription, index) => {
                const doseTag = getDoseTag(prescription);
                const durationMinutes = getDurationMinutes(prescription);
                return (
                  <div key={`${prescription}-${index}`} className="settlement-prescription-row">
                    <input
                      className="form-input settlement-prescription-input"
                      value={prescription}
                      onChange={(event) => updatePrescription(index, event.target.value)}
                    />
                    <div className="settlement-dose-tag-group">
                      <input
                        className="form-input settlement-dose-tag-input"
                        value={doseTag}
                        placeholder="없음"
                        title={doseTag ? `스케줄 셀에 "주한솔${doseTag}" 형태로 표시` : '셀 태그 없음 (이름만 표시)'}
                        onChange={(event) => {
                          const val = event.target.value.replace(/[^\d]/g, '').slice(0, 3);
                          setDraft((prev) => ({
                            ...prev,
                            dose_tags: { ...prev.dose_tags, [prescription]: val },
                          }));
                        }}
                      />
                      <span className="settlement-dose-tag-preview" title="셀 미리보기">
                        홍길동{doseTag}
                      </span>
                    </div>
                    <div className="settlement-duration-group">
                      <input
                        type="number"
                        className="form-input settlement-duration-input"
                        min={0}
                        step={5}
                        value={durationMinutes || ''}
                        placeholder="분"
                        title="스케줄 시간 간격에 맞춰 자동 병합할 치료 시간"
                        onChange={(event) => {
                          const val = Number(event.target.value);
                          setDraft((prev) => ({
                            ...prev,
                            duration_minutes: {
                              ...(prev.duration_minutes || {}),
                              [prescription]: Number.isFinite(val) && val > 0 ? val : '',
                            },
                          }));
                        }}
                      />
                      <span>분</span>
                    </div>
                    <div className="settlement-shortcut-group">
                      <span>Cmd+</span>
                      <input
                        className="form-input settlement-shortcut-input"
                        value={draft.shortcuts?.[prescription] || ''}
                        placeholder="-"
                        title="Cmd/Ctrl + 숫자 로 처방 단축키 설정"
                        maxLength={1}
                        onChange={(event) => {
                          const val = event.target.value.replace(/[^1-9]/g, '');
                          setDraft((prev) => ({
                            ...prev,
                            shortcuts: { ...(prev.shortcuts || {}), [prescription]: val },
                          }));
                        }}
                      />
                    </div>
                    <div className="settlement-price-group">
                      <input
                        type="number"
                        className="form-input settlement-price-input"
                        min={0}
                        step={1000}
                        value={draft.prescription_prices?.[prescription] ?? 0}
                        onChange={(event) => {
                          const value = Number(event.target.value) || 0;
                          setDraft((prev) => ({
                            ...prev,
                            prescription_prices: {
                              ...prev.prescription_prices,
                              [prescription]: value,
                            },
                          }));
                        }}
                      />
                      <span>원</span>
                    </div>
                    <input
                      type="color"
                      className="settlement-color-input"
                      value={draft.prescription_colors?.[prescription] || '#000000'}
                      title={`${prescription} 스케줄러 글자색`}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          prescription_colors: {
                            ...(prev.prescription_colors || {}),
                            [prescription]: value,
                          },
                        }));
                      }}
                    />
                    <label className="settlement-visit-lower-row" title="병합 시 회차를 하단 행에 분리 입력">
                      <input
                        type="checkbox"
                        checked={!!draft.visit_on_lower_row?.[prescription]}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setDraft((prev) => ({
                            ...prev,
                            visit_on_lower_row: {
                              ...(prev.visit_on_lower_row || {}),
                              [prescription]: checked,
                            },
                          }));
                        }}
                      />
                    </label>
                    <button type="button" className="settlement-delete-btn" onClick={() => removePrescription(index)}>
                      삭제
                    </button>
                  </div>
                );
              })}
            </div>
            <input
              className="form-input settlement-add-input"
              placeholder={addPlaceholder}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                if (addPrescription(event.currentTarget.value)) event.currentTarget.value = '';
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
