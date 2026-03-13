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
import { X, Settings, History } from 'lucide-react';

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
      <aside className={c('fixed inset-y-0 right-0 z-50 w-80 bg-zinc-900/90 backdrop-blur-md border-l border-zinc-800 transform transition-transform duration-300 ease-in-out', { 'translate-x-0': isSidebarOpen, 'translate-x-full': !isSidebarOpen })}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex gap-2">
            <button 
              className={c('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', { 'bg-zinc-800 text-white': activeTab === 'settings', 'text-zinc-400 hover:text-white': activeTab !== 'settings' })}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} />
              Settings
            </button>
            <button 
              className={c('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', { 'bg-zinc-800 text-white': activeTab === 'history', 'text-zinc-400 hover:text-white': activeTab !== 'history' })}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              History
            </button>
          </div>
          <button onClick={toggleSidebar} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              <fieldset disabled={connected} className="space-y-4">
                <label className="block text-sm font-medium text-zinc-400">
                  Staff Language
                  <select value={staffLanguage} onChange={e => setStaffLanguage(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-zinc-400">
                  Guest Language
                  <select value={guestLanguage} onChange={e => setGuestLanguage(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-zinc-400">
                  Voice
                  <select value={voice} onChange={e => setVoice(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white">
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
            <div className="space-y-4">
              {turns.length === 0 ? (
                <p className="text-center text-zinc-500 italic">No conversation history yet.</p>
              ) : (
                <div className="space-y-4">
                  {turns.map((turn, i) => (
                    <div key={i} className={c('p-4 rounded-xl border', { 'bg-blue-950/30 border-blue-900/50': turn.role === 'user', 'bg-zinc-900 border-zinc-800': turn.role === 'agent' })}>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {turn.role === 'user' 
                          ? (isDutch(turn.text) ? 'Staff' : 'Guest') 
                          : 'Translation'}
                      </span>
                      <p className="mt-1 text-sm text-zinc-200">
                        {turn.role === 'agent' ? removeDuplicateSentences(turn.text) : turn.text}
                      </p>
                      <span className="block mt-2 text-xs text-zinc-600 font-mono">{turn.timestamp.toLocaleTimeString()}</span>
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
