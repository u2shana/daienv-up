import React, { useState } from 'react';
import {
  Clipboard,
  ClipboardPaste,
  Send,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Edit2,
  FileText
} from 'lucide-react';
import { PanelConfig, SyncRecord } from '../types';
import { syncEnvValue } from '../services/daidaiApi';

interface WorkspaceViewProps {
  config: PanelConfig;
  clipboardText: string;
  onSetClipboardText: (val: string) => void;
  onReadClipboard: () => Promise<string | null>;
  isReadingClipboard: boolean;
  clipboardError: string | null;
  onClearText: () => void;
  onOpenSettings: () => void;
  onRecordAdded: (record: SyncRecord) => void;
  onUpdateTargetEnv: (newName: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  config,
  clipboardText,
  onSetClipboardText,
  onReadClipboard,
  isReadingClipboard,
  clipboardError,
  onClearText,
  onOpenSettings,
  onRecordAdded,
  onUpdateTargetEnv,
}) => {
  const [isMasked, setIsMasked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditingEnvName, setIsEditingEnvName] = useState(false);
  const [tempEnvName, setTempEnvName] = useState(config.targetEnvName);
  const [lastResult, setLastResult] = useState<{
    status: 'success' | 'failed';
    message: string;
    actionType?: 'updated' | 'created';
    autoEnabled?: boolean;
    durationMs: number;
    envName: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isConfigValid = Boolean(config.apiUrl && config.appKey && config.appSecret);

  // Quick text formatting tools
  const handleTrimWhitespace = () => {
    onSetClipboardText(clipboardText.trim());
  };

  const handleSingleLine = () => {
    onSetClipboardText(clipboardText.replace(/\r?\n+/g, ' ').trim());
  };

  // Submit sync
  const handleSync = async () => {
    if (!clipboardText) {
      showToast('请先读取或粘贴需要更新的环境变量内容');
      return;
    }
    if (!isConfigValid) {
      showToast('请先完成呆呆面板连接设置（API地址、AppKey、AppSecret）');
      onOpenSettings();
      return;
    }

    const envName = config.targetEnvName.trim() || 'JD_COOKIE';
    setIsSyncing(true);
    setLastResult(null);
    const start = Date.now();

    // Haptic vibration feedback on Android
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 40, 20]);
      } catch {
        // ignore
      }
    }

    try {
      const res = await syncEnvValue(config, envName, clipboardText, config.remarks);
      const durationMs = Date.now() - start;

      const record: SyncRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        envName,
        contentPreview: clipboardText.length > 60 ? clipboardText.substring(0, 60) + '...' : clipboardText,
        contentLength: clipboardText.length,
        status: 'success',
        actionType: res.action,
        autoEnabled: res.autoEnabled,
        durationMs,
        detailMessage: res.message,
        fullContent: clipboardText,
      };

      onRecordAdded(record);
      setLastResult({
        status: 'success',
        message: res.message,
        actionType: res.action,
        autoEnabled: res.autoEnabled,
        durationMs,
        envName,
      });

      // Android success vibration
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 80, 40]);
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);

      const record: SyncRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        envName,
        contentPreview: clipboardText.length > 60 ? clipboardText.substring(0, 60) + '...' : clipboardText,
        contentLength: clipboardText.length,
        status: 'failed',
        durationMs,
        detailMessage: msg,
        fullContent: clipboardText,
      };

      onRecordAdded(record);
      setLastResult({
        status: 'failed',
        message: msg,
        durationMs,
        envName,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveEnvName = () => {
    const trimmed = tempEnvName.trim();
    if (trimmed) {
      onUpdateTargetEnv(trimmed);
      setIsEditingEnvName(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto px-4 pt-4">
      {/* Unconfigured Alert Banner */}
      {!isConfigValid && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-semibold text-amber-100 text-sm">呆呆面板尚未完成配置</p>
            <p className="mt-1 text-amber-300/90">
              请预先填写呆呆面板的 API 路径、AppKey 与 AppSecret，否则无法提交更新。
            </p>
            <button
              onClick={onOpenSettings}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-lg text-xs transition"
            >
              <Settings className="w-3.5 h-3.5" />
              立即前往配置
            </button>
          </div>
        </div>
      )}

      {/* Target Environment Variable Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>目标环境变量</span>
          <span className="text-slate-500">
            {config.autoEnableIfDisabled !== false
              ? '不存在自动新增 · 禁用自动启用'
              : '不存在将自动新增'}
          </span>
        </div>

        {isEditingEnvName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempEnvName}
              onChange={(e) => setTempEnvName(e.target.value)}
              placeholder="如 JD_COOKIE"
              className="flex-1 bg-slate-950 border border-blue-500 text-blue-300 font-mono text-sm px-3 py-2 rounded-xl focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSaveEnvName}
              className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-500"
            >
              确定
            </button>
            <button
              onClick={() => {
                setTempEnvName(config.targetEnvName);
                setIsEditingEnvName(false);
              }}
              className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-blue-400 truncate">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">{config.targetEnvName || '未指定 (请设置)'}</span>
            </div>
            <button
              onClick={() => {
                setTempEnvName(config.targetEnvName);
                setIsEditingEnvName(true);
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition shrink-0"
              title="临时修改本次目标变量名"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>更换</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Clipboard Operation & Preview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReadClipboard()}
              disabled={isReadingClipboard}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl shadow-sm transition active:scale-[0.98] min-h-[44px]"
            >
              <Clipboard className={`w-4 h-4 ${isReadingClipboard ? 'animate-spin' : ''}`} />
              <span>{isReadingClipboard ? '正在读取...' : '从剪贴板读取'}</span>
            </button>

            <button
              onClick={async () => {
                // Focus textarea and let user paste
                const el = document.getElementById('clipboard-textarea') as HTMLTextAreaElement;
                if (el) {
                  el.focus();
                  try {
                    // Try direct paste if permitted
                    if (navigator.clipboard?.readText) {
                      const t = await navigator.clipboard.readText();
                      if (t) onSetClipboardText(t);
                    }
                  } catch {
                    // user can paste manually
                  }
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition active:scale-[0.98] min-h-[44px]"
              title="手动粘贴"
            >
              <ClipboardPaste className="w-4 h-4 text-emerald-400" />
              <span>手动粘贴</span>
            </button>
          </div>

          {/* Privacy Toggle & Clear */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMasked(!isMasked)}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
              title={isMasked ? '显示明文' : '脱敏掩码显示'}
            >
              {isMasked ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
            </button>

            {clipboardText && (
              <button
                onClick={onClearText}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="清空内容"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Clipboard Reading Error Notice */}
        {clipboardError && (
          <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{clipboardError}</span>
          </div>
        )}

        {/* Text Area Content Box */}
        <div className="relative">
          <textarea
            id="clipboard-textarea"
            value={clipboardText}
            onChange={(e) => onSetClipboardText(e.target.value)}
            placeholder="请点击【从剪贴板读取】或直接在此处长按粘贴/输入纯文本变量值..."
            rows={6}
            className={`w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs leading-relaxed focus:outline-none transition resize-y font-mono ${
              isMasked ? 'text-slate-500 select-none filter blur-[3px]' : 'text-slate-200'
            }`}
          />
        </div>

        {/* Helper Utilities & Metrics */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTrimWhitespace}
              disabled={!clipboardText}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg text-[11px] transition"
            >
              去除首尾空格
            </button>
            <button
              onClick={handleSingleLine}
              disabled={!clipboardText}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg text-[11px] transition"
            >
              合并单行
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-slate-400">
            <span>{clipboardText.length} 字符</span>
            <span>·</span>
            <span>{clipboardText ? clipboardText.split('\n').length : 0} 行</span>
          </div>
        </div>
      </div>

      {/* Sync Result Banner */}
      {lastResult && (
        <div
          className={`rounded-2xl p-4 border transition-all ${
            lastResult.status === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastResult.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between font-semibold text-sm">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span>
                    {lastResult.status === 'success'
                      ? lastResult.actionType === 'created'
                        ? '已自动新增环境变量'
                        : lastResult.autoEnabled
                        ? '已更新并自动恢复启用'
                        : '已成功更新环境变量'
                      : '同步失败'}
                  </span>
                  {lastResult.autoEnabled && (
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-700/60 text-emerald-300">
                      已自动启用
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-400 font-normal">
                  {lastResult.durationMs}ms
                </span>
              </div>
              <p className="mt-1 leading-relaxed opacity-90">{lastResult.message}</p>
              <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <span>目标: {lastResult.envName}</span>
                <span>·</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Sticky Action CTA (Android Thumb Ergonomics) */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none z-20">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <button
            onClick={handleSync}
            disabled={isSyncing || !clipboardText}
            className={`w-full h-13 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
              !clipboardText
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            {isSyncing ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin" />
                <span>正在同步至呆呆面板...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>立即更新至呆呆面板 ({config.targetEnvName || '环境变量'})</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-slate-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
