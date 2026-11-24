import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  EyeOff,
  Server,
  Key,
  ShieldCheck,
  Tag,
  Zap,
  Globe,
  Upload,
  Download,
  HelpCircle,
} from 'lucide-react';
import { PanelConfig } from '../types';
import { testConnection } from '../services/daidaiApi';

interface SettingsViewProps {
  config: PanelConfig;
  onSaveConfig: (newConfig: PanelConfig) => void;
  onOpenGuide: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onOpenGuide,
}) => {
  const [formData, setFormData] = useState<PanelConfig>({ ...config });
  const [showSecret, setShowSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs: number;
    envCount?: number;
  } | null>(null);
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setSaveToast({ type, message });
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSave = () => {
    onSaveConfig(formData);
    showToast('success', '配置已成功保存！');
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(formData);
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : String(err),
        latencyMs: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Demo sample fill
  const handleFillDemo = () => {
    setFormData({
      apiUrl: 'http://192.168.1.100:5678',
      appKey: 'dd_app_89f3a1e',
      appSecret: 'sec_98d7f2a1b4c3e80f',
      targetEnvName: 'JD_COOKIE',
      remarks: '呆呆剪贴板助手自动更新',
      autoReadOnLaunch: true,
      autoEnableIfDisabled: true,
      proxyMode: 'auto',
    });
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `daidai_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setFormData((prev) => ({ ...prev, ...parsed }));
        showToast('success', '配置已成功导入！请点击下方【保存当前设置】。');
      } catch {
        showToast('error', '读取配置文件失败，请确认文件格式为有效 JSON。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* Settings Top Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">呆呆面板连接参数</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              前往呆呆面板后台【应用】获取 OpenAPI 访问密钥
            </p>
          </div>
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>获取指引</span>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3.5">
          {/* API URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>呆呆面板 API 地址 (根路径)</span>
            </label>
            <input
              type="text"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              placeholder="如 http://192.168.1.100:5678 或 https://daidai.yourdomain.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              可填写内网 IP + 端口，或公网已穿透/反向代理的 HTTPS 域名。
            </p>
          </div>

          {/* AppKey */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>应用 AppKey</span>
            </label>
            <input
              type="text"
              value={formData.appKey}
              onChange={(e) => setFormData({ ...formData, appKey: e.target.value })}
              placeholder="面板后台生成的 AppKey"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none transition"
            />
          </div>

          {/* AppSecret */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>应用 AppSecret</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecret ? '隐藏' : '显示'}</span>
              </button>
            </label>
            <input
              type={showSecret ? 'text' : 'password'}
              value={formData.appSecret}
              onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
              placeholder="面板后台生成的 AppSecret"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none transition"
            />
          </div>

          {/* Default Target Env Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>默认目标环境变量名</span>
            </label>
            <input
              type="text"
              value={formData.targetEnvName}
              onChange={(e) => setFormData({ ...formData, targetEnvName: e.target.value })}
              placeholder="如 JD_COOKIE, BILI_COOKIE, TOKEN_VAL"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              每次在工作台同步时，也可临时快捷更换变量名。
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">同步备注 (可选)</label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="由呆呆剪贴板助手自动更新"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              推送时会自动在备注后附带当前时间，格式如：备注内容 (YYYY-MM-DD HH:mm:ss)
            </p>
          </div>
        </div>
      </div>

      {/* Advanced App Behavior Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-100">运行与网络策略</h3>

        {/* Auto-read toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-xs font-medium text-slate-200">启动应用时自动读取剪贴板</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              打开应用即自动读取并填入工作区（浏览器已授权前提下）
            </p>
          </div>
          <button
            onClick={() =>
              setFormData({ ...formData, autoReadOnLaunch: !formData.autoReadOnLaunch })
            }
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              formData.autoReadOnLaunch ? 'bg-blue-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                formData.autoReadOnLaunch ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto-enable toggle */}
        <div className="flex items-center justify-between py-1 border-t border-slate-800/80 pt-3">
          <div>
            <p className="text-xs font-medium text-slate-200">被禁用时自动启用</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              若目标环境变量在面板中处于禁用状态，同步时自动将其恢复启用
            </p>
          </div>
          <button
            onClick={() =>
              setFormData({
                ...formData,
                autoEnableIfDisabled: formData.autoEnableIfDisabled === false ? true : false,
              })
            }
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              formData.autoEnableIfDisabled !== false ? 'bg-blue-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                formData.autoEnableIfDisabled !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Proxy Mode */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="block text-xs font-medium text-slate-200 mb-2 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>网络中继与跨域策略</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'auto', title: '智能回退', desc: '直连失败自动走代理' },
              { id: 'direct', title: '纯直连', desc: '设备直达面板' },
              { id: 'proxy', title: '全代理', desc: '中继转发(免CORS)' },
            ].map((item) => {
              const active = formData.proxyMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setFormData({ ...formData, proxyMode: item.id as 'auto' | 'direct' | 'proxy' })
                  }
                  className={`p-2.5 rounded-xl border text-left transition ${
                    active
                      ? 'border-blue-500 bg-blue-950/20 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Test Connection Button & Result */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-slate-200">连接与权限诊断</h3>
            <p className="text-[11px] text-slate-500">验证 API 地址连通性及 AppKey 读写权限</p>
          </div>
          <button
            onClick={handleTest}
            disabled={isTesting || !formData.apiUrl || !formData.appKey}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition active:scale-[0.98] min-h-[38px]"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isTesting ? '正在诊断...' : '测试连接'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>{testResult.success ? '面板认证成功' : '连接诊断失败'}</span>
                  <span className="font-mono text-[11px] tabular-nums font-normal text-slate-400">
                    耗时 {testResult.latencyMs}ms
                  </span>
                </div>
                <p className="mt-1 leading-relaxed opacity-90">{testResult.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backup & Import Tools */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出配置</span>
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>导入配置</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>

        <button
          onClick={handleFillDemo}
          className="text-slate-500 hover:text-slate-300 underline text-[11px]"
        >
          填入演示示例
        </button>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>保存当前设置</span>
        </button>
      </div>

      {saveToast && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5 animate-bounce ${
            saveToast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {saveToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{saveToast.message}</span>
        </div>
      )}
    </div>
  );
};
