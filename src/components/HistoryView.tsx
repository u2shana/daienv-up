import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, ArrowUpRight, Copy, Check, Trash2, Shield } from 'lucide-react';
import { SyncRecord } from '../types';

interface HistoryViewProps {
  history: SyncRecord[];
  onClearHistory: () => void;
  onRestoreRecord: (record: SyncRecord) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onRestoreRecord,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMasked, setShowMasked] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${month}-${day} ${hours}:${mins}:${secs}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Top Bar for History */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>同步历史追溯 ({history.length})</span>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMasked(!showMasked)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>{showMasked ? '脱敏预览' : '显示明文'}</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空</span>
            </button>
          </div>
        )}
      </div>

      {/* History Items */}
      {history.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-xs text-slate-400">
          <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-slate-300 font-medium">暂无同步记录</p>
          <p className="mt-1 text-slate-500 text-[11px]">从剪贴板读取并同步环境变量后，记录将自动在此归档</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => {
            const isSuccess = record.status === 'success';
            return (
              <div
                key={record.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 transition hover:border-slate-700"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {isSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-mono font-semibold text-slate-100 text-sm">
                      {record.envName}
                    </span>
                    {record.actionType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {record.actionType === 'created' ? '自动新建' : '更新覆盖'}
                      </span>
                    )}
                    {record.autoEnabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-300 font-medium">
                        已自动启用
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] tabular-nums">
                    <span>{record.durationMs}ms</span>
                    <span>·</span>
                    <span>{formatTime(record.timestamp)}</span>
                  </div>
                </div>

                {/* Content Preview Box */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-300 break-all leading-relaxed">
                  {showMasked ? (
                    <span className="text-slate-400">
                      {record.contentPreview.slice(0, 15)}****** ({record.contentLength} 字符)
                    </span>
                  ) : (
                    <span>{record.contentPreview}</span>
                  )}
                </div>

                {/* Detail Message if Failed */}
                {record.detailMessage && !isSuccess && (
                  <p className="text-[11px] text-rose-300/90 leading-tight">
                    {record.detailMessage}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => handleCopy(record.fullContent, record.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs rounded-lg hover:bg-slate-800 transition"
                  >
                    {copiedId === record.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onRestoreRecord(record)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-medium rounded-lg transition"
                  >
                    <span>载入工作台</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100">确认清空同步历史？</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              将清除本地保存的所有同步记录日志。此操作不可恢复。
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
