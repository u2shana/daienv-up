import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { WorkspaceView } from './components/WorkspaceView';
import { EnvsListView } from './components/EnvsListView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AndroidGuideModal } from './components/AndroidGuideModal';
import { useClipboard } from './hooks/useClipboard';
import { loadConfig, saveConfig, loadHistory, addHistoryRecord, clearHistory } from './services/storage';
import { PanelConfig, SyncRecord } from './types';

export default function App() {
  const [config, setConfig] = useState<PanelConfig>(() => loadConfig());
  const [history, setHistory] = useState<SyncRecord[]>(() => loadHistory());
  const [currentTab, setCurrentTab] = useState<NavTab>('workspace');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Sync status bar height seamlessly from native Android
  React.useEffect(() => {
    const bridge = (window as unknown as { AndroidBridge?: { getStatusBarHeight?: () => number } })?.AndroidBridge;
    if (typeof bridge?.getStatusBarHeight === 'function') {
      try {
        const height = bridge.getStatusBarHeight();
        if (height && height > 0) {
          document.documentElement.style.setProperty('--status-bar-height', `${height}px`);
        }
      } catch (e) {
        console.warn('Failed to read status bar height from AndroidBridge:', e);
      }
    }
  }, []);

  const {
    clipboardText,
    setClipboardText,
    readFromClipboard,
    clearText,
    isReading: isReadingClipboard,
    readError: clipboardError,
  } = useClipboard(config.autoReadOnLaunch);

  const isConfigured = Boolean(config.apiUrl && config.appKey && config.appSecret);

  const handleSaveConfig = (newConfig: PanelConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const handleUpdateTargetEnv = (newName: string) => {
    const updated = { ...config, targetEnvName: newName };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleRecordAdded = (record: SyncRecord) => {
    const updated = addHistoryRecord(record);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleRestoreRecord = (record: SyncRecord) => {
    setClipboardText(record.fullContent);
    if (record.envName) {
      handleUpdateTargetEnv(record.envName);
    }
    setCurrentTab('workspace');
  };

  const handleSelectTargetEnv = (envName: string) => {
    handleUpdateTargetEnv(envName);
    setCurrentTab('workspace');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        isConfigured={isConfigured}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setCurrentTab('settings')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'workspace' && (
          <WorkspaceView
            config={config}
            clipboardText={clipboardText}
            onSetClipboardText={setClipboardText}
            onReadClipboard={readFromClipboard}
            isReadingClipboard={isReadingClipboard}
            clipboardError={clipboardError}
            onClearText={clearText}
            onOpenSettings={() => setCurrentTab('settings')}
            onRecordAdded={handleRecordAdded}
            onUpdateTargetEnv={handleUpdateTargetEnv}
          />
        )}

        {currentTab === 'envs' && (
          <EnvsListView
            config={config}
            onSelectTargetEnv={handleSelectTargetEnv}
            onOpenSettings={() => setCurrentTab('settings')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            history={history}
            onClearHistory={handleClearHistory}
            onRestoreRecord={handleRestoreRecord}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            config={config}
            onSaveConfig={handleSaveConfig}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}
      </main>

      {/* Mobile-First Bottom Nav */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        historyCount={history.length}
      />

      {/* Android Help & Installation Guide Modal */}
      <AndroidGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
