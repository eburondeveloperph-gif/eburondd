/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useSettings, useUI, useLogStore } from '@/lib/state';
import c from 'classnames';
import { DEFAULT_LIVE_API_MODEL, AVAILABLE_VOICES, SUPPORTED_LANGUAGES } from '@/lib/constants';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useState } from 'react';
import { isDutch, removeDuplicateSentences } from '@/lib/utils';

const AVAILABLE_MODELS = [
  DEFAULT_LIVE_API_MODEL
];

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const { 
    model, 
    voice, 
    staffLanguage, 
    guestLanguage, 
    setModel, 
    setVoice,
    setStaffLanguage,
    setGuestLanguage,
  } = useSettings();
  const { turns } = useLogStore();
  const { connected } = useLiveAPIContext();

  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

  return (
    <>
      <aside className={c('sidebar', { open: isSidebarOpen })}>
        <div className="sidebar-header">
          <div className="sidebar-tabs">
            <button 
              className={c('tab-button', { active: activeTab === 'settings' })}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button 
              className={c('tab-button', { active: activeTab === 'history' })}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
          <button onClick={toggleSidebar} className="close-button">
            <span className="icon">close</span>
          </button>
        </div>
        
        <div className="sidebar-content">
          {activeTab === 'settings' ? (
            <div className="sidebar-section">
              <fieldset disabled={connected}>
                <label>
                  Staff Language
                  <select value={staffLanguage} onChange={e => setStaffLanguage(e.target.value)}>
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Guest Language
                  <select value={guestLanguage} onChange={e => setGuestLanguage(e.target.value)}>
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Voice
                  <select value={voice} onChange={e => setVoice(e.target.value)}>
                    {AVAILABLE_VOICES.map(v => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            </div>
          ) : (
            <div className="sidebar-section history-section">
              {turns.length === 0 ? (
                <p className="empty-history">No conversation history yet.</p>
              ) : (
                <div className="history-list">
                  {turns.map((turn, i) => (
                    <div key={i} className={c('history-item', turn.role)}>
                      <span className="history-role">
                        {turn.role === 'user' 
                          ? (isDutch(turn.text) ? 'Staff' : 'Guest') 
                          : 'Translation'}
                      </span>
                      <p className="history-text">
                        {turn.role === 'agent' ? removeDuplicateSentences(turn.text) : turn.text}
                      </p>
                      <span className="history-time">{turn.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
