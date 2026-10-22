export interface PanelConfig {
  apiUrl: string;
  appKey: string;
  appSecret: string;
  targetEnvName: string;
  remarks?: string;
  autoReadOnLaunch: boolean;
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
  durationMs: number;
  detailMessage: string;
  fullContent: string;
}

export interface EnvItem {
  id: string | number;
  name: string;
  value: string;
  remarks?: string;
  status?: number; // 0: enabled, 1: disabled in some panel formats
  updatedAt?: string;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  msg?: string;
  data: T;
}
