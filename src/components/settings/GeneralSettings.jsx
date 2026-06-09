import { useState, useEffect } from 'react';
import { Database, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../common/Toast';
import { useSchedule } from '../../contexts/ScheduleContext';
import { SQL_SETUP_SCRIPT } from '../../lib/sqlSnippets';
import { APP_TABS, DEFAULT_TAB_LABELS } from '../../lib/authPermissions';

export default function GeneralSettings() {
  const { addToast } = useToast();
  const { saveShockwaveSettings } = useSchedule();
  
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  
  const [swSettings, setSwSettings] = useState({ 
    id: '00000000-0000-0000-0000-000000000000',
    start_time: '09:00', 
    end_time: '18:00', 
    interval_minutes: 10,
    prescriptions: ['F1.5', 'F/Rdc', 'F/R'],
    manual_therapy_prescriptions: ['40분', '60분'],
    prescription_prices: {
      'F1.5': 50000,
      'F/Rdc': 70000,
      'F/R': 80000,
    },
    prescription_colors: {},
    incentive_percentage: 7,
    manual_therapy_incentive_percentage: 0,
    frozen_columns: 6,
    day_overrides: {},
    date_overrides: {},
    staff_schedule_block_rules: {},
    monthly_settlement_settings: {},
  });

  const handleCopySQL = async (sql) => {
    if (!navigator?.clipboard) {
      addToast('복사 실패: 브라우저가 클립보드를 지원하지 않습니다.', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(sql);
      addToast('SQL 코드가 클립보드에 복사되었습니다.', 'success');
    } catch {
      addToast('복사 실패: 클립보드 접근 권한이 필요합니다.', 'error');
    }
  };

  const updateTabLabel = (tabKey, value) => {
    setSwSettings((prev) => {
      const monthlySettings = prev.monthly_settlement_settings || {};
      const currentLabels = monthlySettings.tab_labels || {};
      const nextLabels = { ...currentLabels };
      const trimmed = value.trim();
      if (trimmed) nextLabels[tabKey] = value;
      else delete nextLabels[tabKey];
      return {
        ...prev,
        monthly_settlement_settings: {
          ...monthlySettings,
          tab_labels: nextLabels,
        },
      };
    });
  };

  const resetTabLabels = () => {
    setSwSettings((prev) => {
      const monthlySettings = prev.monthly_settlement_settings || {};
      const { tab_labels: _tabLabels, ...rest } = monthlySettings;
      return {
        ...prev,
        monthly_settlement_settings: rest,
      };
    });
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('shockwave_settings').select('*').order('updated_at', { ascending: false }).limit(1).single();
      if (!error && data) {
        setSwSettings({
          id: data.id || '00000000-0000-0000-0000-000000000000',
          start_time: data.start_time.substring(0, 5),
          end_time: data.end_time.substring(0, 5),
          interval_minutes: data.interval_minutes,
          prescriptions: data.prescriptions || ['F1.5', 'F/Rdc', 'F/R'],
          manual_therapy_prescriptions: data.manual_therapy_prescriptions || ['40분', '60분'],
          prescription_prices: data.prescription_prices || {
            'F1.5': 50000,
            'F/Rdc': 70000,
            'F/R': 80000,
          },
          prescription_colors: data.prescription_colors || {},
          incentive_percentage: data.incentive_percentage ?? 7,
          manual_therapy_incentive_percentage: data.manual_therapy_incentive_percentage ?? 0,
          frozen_columns: data.frozen_columns || 6,
          day_overrides: data.day_overrides || {},
          date_overrides: data.date_overrides || {},
          staff_schedule_block_rules: data.staff_schedule_block_rules || {},
          monthly_settlement_settings: data.monthly_settlement_settings || {},
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    const success = await saveShockwaveSettings({
      id: swSettings.id,
      start_time: swSettings.start_time + ':00',
      end_time: swSettings.end_time + ':00',
      interval_minutes: Number(swSettings.interval_minutes),
      day_overrides: swSettings.day_overrides || {},
      date_overrides: swSettings.date_overrides || {},
      prescriptions: swSettings.prescriptions,
      manual_therapy_prescriptions: swSettings.manual_therapy_prescriptions,
      prescription_prices: swSettings.prescription_prices,
      prescription_colors: swSettings.prescription_colors,
      incentive_percentage: Number(swSettings.incentive_percentage) || 0,
      manual_therapy_incentive_percentage: Number(swSettings.manual_therapy_incentive_percentage) || 0,
      frozen_columns: Number(swSettings.frozen_columns),
      staff_schedule_block_rules: swSettings.staff_schedule_block_rules || {},
      monthly_settlement_settings: swSettings.monthly_settlement_settings || {},
    });
    if (success) addToast('시간표 설정이 저장되었습니다.', 'success');
  };

  const loadHolidays = async () => {
    const { data } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: false });
    setHolidays(data || []);
  };

  useEffect(() => {
    loadHolidays();
    loadSettings();
  }, []);

  const addHoliday = async () => {
    if (!newHoliday.date) return;
    const { error } = await supabase.from('holidays').insert({
      date: newHoliday.date,
      name: newHoliday.name.trim() || null
    });
    if (error) { addToast('추가 실패: ' + error.message, 'error'); return; }
    addToast('공휴일이 추가되었습니다', 'success');
    setNewHoliday({ date: '', name: '' });
    loadHolidays();
  };

  const removeHoliday = async (id) => {
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (!error) { addToast('삭제되었습니다', 'success'); loadHolidays(); }
  };

  return (
    <div className="settings-grid">
      {/* 충격파 시간표 관리 */}
      <div className="settings-card settings-card--wide">
        <div className="card-header settings-card-header-split">
          <span className="card-title">스케줄 시간표 기본 설정</span>
          <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>저장</button>
        </div>
        <div className="card-body">
          <div className="settings-control-grid">
            <label className="settings-field">
              <span className="settings-row-label">시작 시간</span>
              <input type="time" className="form-input" value={swSettings.start_time} onChange={e => setSwSettings(p => ({ ...p, start_time: e.target.value }))} />
            </label>
            <label className="settings-field">
              <span className="settings-row-label">종료 시간</span>
              <input type="time" className="form-input" value={swSettings.end_time} onChange={e => setSwSettings(p => ({ ...p, end_time: e.target.value }))} />
            </label>
            <label className="settings-field">
              <span className="settings-row-label">시간 단위</span>
              <select className="form-input" value={swSettings.interval_minutes} onChange={e => setSwSettings(p => ({ ...p, interval_minutes: Number(e.target.value) }))}>
                <option value={10}>10분</option>
                <option value={15}>15분</option>
                <option value={20}>20분</option>
                <option value={30}>30분</option>
                <option value={60}>60분(1시간)</option>
              </select>
            </label>
          </div>
          <div className="settings-row settings-row--compact">
            <div>
              <div className="settings-row-label">고정 컬럼 개수</div>
              <div className="settings-row-desc">가로 스크롤 시 왼쪽에 고정할 열의 개수를 지정합니다. (기본 6: #, 날짜, 이름, 차트번호, 회차, 부위)</div>
            </div>
            <input 
              type="number" 
              className="form-input" 
              min={0} max={10} 
              value={swSettings.frozen_columns} 
              onChange={e => setSwSettings(p => ({ ...p, frozen_columns: parseInt(e.target.value) || 0 }))} 
            />
          </div>
        </div>
      </div>

      {/* 탭 이름 설정 */}
      <div className="settings-card settings-card--wide">
        <div className="card-header settings-card-header-split">
          <span className="card-title">탭 이름 설정</span>
          <button className="btn btn-secondary btn-sm" type="button" onClick={resetTabLabels}>
            기본값으로
          </button>
        </div>
        <div className="card-body">
          <div className="settings-tab-label-grid">
            {APP_TABS.map((tab) => {
              const value = swSettings.monthly_settlement_settings?.tab_labels?.[tab.key] ?? '';
              return (
                <label key={tab.key} className="settings-field">
                  <span className="settings-row-label">{DEFAULT_TAB_LABELS[tab.key]}</span>
                  <input
                    className="form-input"
                    value={value}
                    placeholder={DEFAULT_TAB_LABELS[tab.key]}
                    onChange={(e) => updateTabLabel(tab.key, e.target.value)}
                  />
                </label>
              );
            })}
          </div>
          <div className="settings-help-text">
            비워두면 기본 탭 이름을 사용합니다. 변경 후 환경설정 저장을 누르면 전체 화면에 적용됩니다.
          </div>
        </div>
      </div>

      {/* 공휴일 관리 */}
      <div className="settings-card">
        <div className="card-header">
          <span className="card-title"><Database size={18} /> 공휴일 관리</span>
        </div>
        <div className="card-body">
          <div className="settings-inline-form">
            <input
              className="form-input"
              type="date"
              value={newHoliday.date}
              onChange={e => setNewHoliday(p => ({ ...p, date: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="공휴일 이름 (선택)"
              value={newHoliday.name}
              onChange={e => setNewHoliday(p => ({ ...p, name: e.target.value }))}
            />
            <button className="btn btn-primary btn-sm" onClick={addHoliday}>추가</button>
          </div>

          <div className={`settings-list ${holidays.length > 5 ? 'settings-list--scroll' : ''}`}>
            {holidays.map(h => (
              <div key={h.id} className="settings-row">
                <div>
                  <div className="settings-row-label">{h.date}</div>
                  <div className="settings-row-desc">{h.name || '(이름 없음)'}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeHoliday(h.id)}>삭제</button>
              </div>
            ))}
          </div>

          {holidays.length === 0 && (
            <p className="settings-empty-text">
              등록된 공휴일이 없습니다
            </p>
          )}
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header settings-card-header-split">
          <span className="card-title"><Copy size={18} /> 전체 SQL 스크립트</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleCopySQL(SQL_SETUP_SCRIPT)}
          >
            <Copy size={14} />
            전체 복사
          </button>
        </div>
        <div className="card-body">
          <textarea
            readOnly
            value={SQL_SETUP_SCRIPT}
            className="settings-sql-textarea"
          />
          <p className="settings-help-text">
            위 전체 SQL을 복사하면 필요한 테이블과 기본 데이터를 한 번에 생성할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
