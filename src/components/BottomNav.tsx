import React from 'react';
import { Send, Database, Clock, Settings } from 'lucide-react';

export type NavTab = 'workspace' | 'envs' | 'history' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  historyCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab, historyCount }) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'workspace', label: '工作台', icon: Send },
    { id: 'envs', label: '面板变量', icon: Database },
    { id: 'history', label: '同步历史', icon: Clock },
    { id: 'settings', label: '连接设置', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-4 h-16 items-center px-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.id === 'history' && historyCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] font-mono font-bold px-1 rounded-full min-w-[14px] text-center">
                    {historyCount > 9 ? '9+' : historyCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium tracking-tight mt-1 ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
