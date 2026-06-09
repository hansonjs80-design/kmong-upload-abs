import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';
import { isAdminUser } from '../lib/authPermissions';
import GeneralSettings from '../components/settings/GeneralSettings';
import LoginSettings from '../components/settings/LoginSettings';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const canManageLogin = isAdminUser(user);
  const [settingsSection, setSettingsSection] = useState('general');
  
  return (
    <div className="settings-page animate-fade-in">
      <div className="settings-page-header">
        <div>
          <h1 className="settings-page-title">설정</h1>
          <p className="settings-page-subtitle">앱 표시, 스케줄 기본값, 계정 정보를 관리합니다.</p>
        </div>
      </div>

      <div className="settings-section-tabs">
        <button
          type="button"
          className={`settings-section-tab ${settingsSection === 'general' ? 'active' : ''}`}
          onClick={() => setSettingsSection('general')}
        >
          환경 설정
        </button>
        {canManageLogin && (
          <button
            type="button"
            className={`settings-section-tab ${settingsSection === 'login' ? 'active' : ''}`}
            onClick={() => setSettingsSection('login')}
          >
            로그인 관리
          </button>
        )}
      </div>

      {settingsSection === 'general' && (
        <>
          <GeneralSettings />
          
          {/* 계정 */}
          <div className="settings-card">
            <div className="card-header">
              <span className="card-title"><Shield size={18} /> 계정</span>
            </div>
            <div className="card-body">
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">{user?.email}</div>
                  <div className="settings-row-desc">현재 로그인된 계정</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={signOut}>로그아웃</button>
              </div>
            </div>
          </div>
        </>
      )}

      {settingsSection === 'login' && <LoginSettings canManageLogin={canManageLogin} />}
    </div>
  );
}
