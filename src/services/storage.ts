import { PanelConfig, SyncRecord } from '../types';

const CONFIG_KEY = 'daidai_panel_config_v1';
const HISTORY_KEY = 'daidai_sync_history_v1';

export const DEFAULT_CONFIG: PanelConfig = {
  apiUrl: '',
  appKey: '',
  appSecret: '',
  targetEnvName: 'JD_COOKIE',
  remarks: '由呆呆剪贴板助手更新',
  autoReadOnLaunch: true,
  autoEnableIfDisabled: true,
  proxyMode: 'auto',
};

export function loadConfig(): PanelConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse panel config:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: PanelConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save panel config:', e);
  }
}

export function loadHistory(): SyncRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse sync history:', e);
  }
  return [];
}

export function saveHistory(records: SyncRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save sync history:', e);
  }
}

export function addHistoryRecord(record: SyncRecord): SyncRecord[] {
  const current = loadHistory();
  const updated = [record, ...current].slice(0, 50);
  saveHistory(updated);
  return updated;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
}
