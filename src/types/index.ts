export interface PanelConfig {
  apiUrl: string;
  appKey: string;
  appSecret: string;
  targetEnvName: string;
  remarks?: string;
  autoReadOnLaunch: boolean;
  autoEnableIfDisabled?: boolean;
  proxyMode: 'auto' | 'direct' | 'proxy';
}

export interface SyncRecord {
  id: string;
  timestamp: number;
  envName: string;
  contentPreview: string;
  contentLength: number;
  status: 'success' | 'failed';
  actionType?: 'updated' | 'created';
  autoEnabled?: boolean;
  durationMs: number;
  detailMessage: string;
  fullContent: string;
}

export interface EnvItem {
  id: string | number;
  name: string;
  value: string;
  remarks?: string;
  status?: number | boolean | string; // 0: enabled, 1: disabled (青龙/呆呆面板常见规范)
  enabled?: boolean | number; // 呆呆面板字段 (true: 启用, false: 禁用)
  isDisabled?: boolean | number;
  position?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  msg?: string;
  data: T;
}
