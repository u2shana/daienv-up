import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Check, Copy, ArrowUpRight, AlertCircle, Database } from 'lucide-react';
import { EnvItem, PanelConfig } from '../types';
import { getEnvs } from '../services/daidaiApi';

interface EnvsListViewProps {
  config: PanelConfig;
  onSelectTargetEnv: (envName: string) => void;
  onOpenSettings: () => void;
}

export const EnvsListView: React.FC<EnvsListViewProps> = ({
  config,
  onSelectTargetEnv,
  onOpenSettings,
}) => {
  const [envs, setEnvs] = useState<EnvItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const isConfigured = Boolean(config.apiUrl && config.appKey && config.appSecret);

  const fetchEnvs = async () => {
    if (!isConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getEnvs(config);
      setEnvs(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured) {
      fetchEnvs();
    }
  }, [config.apiUrl, config.appKey, config.appSecret]);

  const filtered = envs.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.remarks && e.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopyValue = (val: string, id: string | number) => {
    navigator.clipboard?.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isConfigured) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Database className="w-7 h-7 text-blue-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-100">未配置呆呆面板连接</h3>
        <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          请先在设置中填写呆呆面板的 API 地址、AppKey 和 AppSecret，即可在此浏览并快速切换目标变量。
        </p>
        <button
          onClick={onOpenSettings}
          className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition"
        >
          前往设置
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Header & Search */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索变量名或备注..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition font-mono"
          />
        </div>
        <button
          onClick={fetchEnvs}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition active:scale-[0.98] disabled:opacity-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="刷新列表"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">无法获取变量列表</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
          <button
            onClick={fetchEnvs}
            className="text-[11px] underline text-rose-300 hover:text-white shrink-0 ml-1"
          >
            重试
          </button>
        </div>
      )}

      {/* Variable Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>面板当前变量 ({filtered.length})</span>
        <span className="font-mono text-[11px]">当前目标: <strong className="text-blue-400">{config.targetEnvName}</strong></span>
      </div>

      {/* List */}
      {loading && envs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
          <span>正在连接呆呆面板并加载环境变量...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-xs text-slate-400">
          <p>未找到匹配的环境变量</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const isCurrentTarget = item.name === config.targetEnvName;
            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl p-3.5 transition-all ${
                  isCurrentTarget
                    ? 'border-blue-500/80 bg-blue-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-100 truncate">
                        {item.name}
                      </span>
                      {isCurrentTarget && (
                        <span className="text-[10px] font-medium text-blue-400 bg-blue-950 border border-blue-800/60 rounded px-1.5 py-0.5">
                          当前目标
                        </span>
                      )}
                    </div>
                    {item.remarks && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{item.remarks}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyValue(item.value, item.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                      title="复制当前值"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {!isCurrentTarget && (
                      <button
                        onClick={() => onSelectTargetEnv(item.name)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-medium rounded-lg transition"
                        title="设为同步目标变量"
                      >
                        <span>设为目标</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Masked Preview of Value */}
                <div className="mt-2.5 bg-slate-950 border border-slate-800/80 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-400 truncate">
                  {item.value ? `${item.value.slice(0, 32)}... (${item.value.length} 字符)` : '(空值)'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
