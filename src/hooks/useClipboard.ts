import { useState, useCallback, useEffect } from 'react';

export function useClipboard(autoRead = false) {
  const [clipboardText, setClipboardText] = useState<string>('');
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<number | null>(null);

  const readFromClipboard = useCallback(async (): Promise<string | null> => {
    setIsReading(true);
    setReadError(null);

    try {
      // Check for native Android Bridge first if running in Android APK WebView
      const androidBridge = (window as unknown as { AndroidBridge?: { getClipboardText?: () => string } })?.AndroidBridge;
      if (typeof androidBridge?.getClipboardText === 'function') {
        const nativeText = androidBridge.getClipboardText() || '';
        setClipboardText(nativeText);
        setLastReadAt(Date.now());
        setIsReading(false);
        if (!nativeText) {
          setReadError('剪贴板为空，未读取到文本内容。');
        }
        return nativeText;
      }

      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('当前浏览器或WebView不支持直接读取剪贴板，请点击【手动粘贴】输入内容。');
      }

      // Attempt reading
      const text = await navigator.clipboard.readText();
      const trimmed = text || '';
      setClipboardText(trimmed);
      setLastReadAt(Date.now());
      setIsReading(false);

      if (!trimmed) {
        setReadError('剪贴板为空，未读取到文本内容。');
      }

      return trimmed;
    } catch (err: unknown) {
      setIsReading(false);
      let errMsg = '无法读取剪贴板';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errMsg = '未获得剪贴板访问权限。请在弹窗中允许访问，或直接在输入框中长按粘贴。';
        } else {
          errMsg = err.message;
        }
      }
      setReadError(errMsg);
      return null;
    }
  }, []);

  // Auto read on mount if enabled
  useEffect(() => {
    if (autoRead) {
      // Small delay to ensure document focus on mobile
      const timer = setTimeout(() => {
        readFromClipboard().catch(() => {});
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoRead, readFromClipboard]);

  const clearText = useCallback(() => {
    setClipboardText('');
    setReadError(null);
  }, []);

  return {
    clipboardText,
    setClipboardText,
    readFromClipboard,
    clearText,
    isReading,
    readError,
    lastReadAt,
  };
}
