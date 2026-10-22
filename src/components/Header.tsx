import React from 'react';
import { Download, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  isConfigured: boolean;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isConfigured, onOpenGuide, onOpenSettings }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  return (
    <header
      style={{
        paddingTop: 'calc(var(--status-bar-height, env(safe-area-inset-top, 0px)) + 0.75rem)',
      }}
      className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 pb-3"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-md shadow-blue-500/10 flex items-center justify-center">
            <AppLogo className="w-full h-full rounded-[10px]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-base tracking-tight leading-none">呆呆同步</span>
              {isInstalled && (
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded px-1.5 py-0.2">
                  PWA
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">剪贴板环境变量助手</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button for Chromium/Android */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm shadow-blue-600/30 transition-all active:scale-[0.98] min-h-[36px]"
              title="安装到手机桌面"
            >
              <Download className="w-3.5 h-3.5" />
              <span>安装应用</span>
            </button>
          )}

          {/* iOS Safari Install Button */}
          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>安装到桌面</span>
            </button>
          )}

          {/* Connection Status Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors min-h-[36px] ${
              isConfigured
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-slate-100'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
            }`}
            title={isConfigured ? '配置已就绪' : '请前往设置配置呆呆面板'}
          >
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">已配置</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>未配置</span>
              </>
            )}
          </button>

          {/* Android / Help Guide Button */}
          <button
            onClick={onOpenGuide}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Android 使用与安装指引"
            aria-label="查看指引"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100">安装至 iPhone / iPad 桌面</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>1. 点击 Safari 底部工具栏的【分享】按钮（带有向上箭头的方框）。</p>
              <p>2. 在操作菜单中向下滚动，选择【添加到主屏幕】。</p>
              <p>3. 点击右上角【添加】，即可像原生 App 一样直接从桌面启动！</p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium transition"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
