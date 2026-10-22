import React from 'react';
import { X, Smartphone, KeyRound, DownloadCloud, CheckCircle2, ExternalLink } from 'lucide-react';

interface AndroidGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidGuideModal: React.FC<AndroidGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Android 使用与安装指引</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4 text-xs text-slate-300 max-h-[75vh] overflow-y-auto leading-relaxed">
          {/* Step 1 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-400 text-xs">
              <DownloadCloud className="w-4 h-4 shrink-0" />
              <span>1. 添加至 Android 手机桌面 (PWA 原生体验)</span>
            </div>
            <p className="text-slate-400">
              在手机 Chrome、Edge 或自带浏览器中打开本站：
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>点击顶部导航栏的【安装应用】按钮；</li>
              <li>或点击浏览器右上角【三点菜单】 -&gt; 选择【安装应用】或【添加到主屏幕】；</li>
              <li>安装后，手机桌面将生成独立应用图标，拥有全屏、沉浸式、极速秒开的原生体验。</li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 text-xs">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>2. 如何在呆呆面板获取 AppKey 与 AppSecret</span>
            </div>
            <p className="text-slate-400">
              呆呆面板采用 Open API 规范鉴权：
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>登录您的呆呆面板后台（通常为 <code className="text-slate-200">http://&lt;IP&gt;:5678</code>）；</li>
              <li>在左侧导航进入【应用管理】或【Open API】页面；</li>
              <li>点击【新建应用】，输入应用名称（如“剪贴板助手”）；</li>
              <li>权限列表中务必勾选【环境变量】（或 envs 相关读写权限）；</li>
              <li>创建成功后，复制对应的 <code className="text-blue-300">AppKey</code> 与 <code className="text-emerald-300">AppSecret</code> 填入本工具【设置】中保存即可。</li>
            </ol>
            <a
              href="https://github.com/linzixuanzz/daidai-panel"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline pt-1"
            >
              <span>查看呆呆面板 GitHub 官方文档</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>3. 移动端极速同步小窍门</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>
                <strong>一键读取</strong>：在微信、京东或其他应用中复制 Cookie 或文本后，直接点开桌面的呆呆助手，开启“启动自动读取”即可自动填充。
              </li>
              <li>
                <strong>变量自动创建</strong>：若面板中尚未设置该变量，应用会自动创建对应项，无需事先在面板中添加。
              </li>
              <li>
                <strong>网络跨域与局域网说明</strong>：若面板运行在内网局域网（如 192.168.x.x），手机处于同一 WiFi 下可开启【智能回退】或【全代理】模式畅通访问。
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
          >
            完成并返回
          </button>
        </div>
      </div>
    </div>
  );
};
