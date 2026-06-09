import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import MonthPicker from '../common/MonthPicker';
import { useSchedule } from '../../contexts/ScheduleContext';
import { APP_TABS, applyTabLabels } from '../../lib/authPermissions';

export default function Header({ onMenuToggle }) {
  const location = useLocation();
  const { shockwaveSettings } = useSchedule();
  const tabLabels = shockwaveSettings?.monthly_settlement_settings?.tab_labels || {};
  const pageLabels = APP_TABS.reduce((acc, tab) => {
    const labeledTab = applyTabLabels(tab, tabLabels);
    acc[tab.path] = tab.key === 'settings' ? `${labeledTab.label} / 관리` : labeledTab.label;
    return acc;
  }, {});

  const pageLabel = pageLabels[location.pathname] || '';

  return (
    <header className="header glass">
      <div className="header-left">
        <button className="menu-btn mobile-only" onClick={onMenuToggle} aria-label="메뉴">
          <Menu size={22} />
        </button>
        {(location.pathname === '/' || location.pathname === '/shockwave') && (
          <MonthPicker suffix={pageLabel} />
        )}
        {(location.pathname === '/shockwave-stats' || location.pathname === '/manual-therapy-stats' || location.pathname === '/settings') && (
          <div className="header-title" style={{ fontSize: '1.2rem' }}>{pageLabel}</div>
        )}
      </div>
    </header>
  );
}
