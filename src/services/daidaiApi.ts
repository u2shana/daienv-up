import { EnvItem, PanelConfig } from '../types';

interface CachedToken {
  token: string;
  expiresAt: number;
  appKey: string;
}

let memoryTokenCache: CachedToken | null = null;

export function normalizeApiUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  url = url.replace(/\/+$/, '');
  // Automatically strip trailing /api/v1 or /api if user pasted full API endpoint
  url = url.replace(/\/api\/v1\/?$/i, '').replace(/\/api\/?$/i, '');
  return url.replace(/\/+$/, '');
}

/**
 * Executes a network request to Daidai Panel, supporting direct browser calls
 * and automatic server proxy fallback for CORS / Mixed-Content resilience.
 */
async function callPanelApi<T = unknown>(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  bodyData: unknown,
  proxyMode: 'auto' | 'direct' | 'proxy' = 'auto'
): Promise<{ status: number; data: T }> {
  const serializedBody = bodyData ? JSON.stringify(bodyData) : undefined;
  const mergedHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(serializedBody ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  // If user forced proxy mode
  if (proxyMode === 'proxy') {
    return callViaBackendProxy<T>(targetUrl, method, mergedHeaders, bodyData);
  }

  // Attempt direct call first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const directRes = await fetch(targetUrl, {
      method,
      headers: mergedHeaders,
      body: serializedBody,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await directRes.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // plain text response
    }

    // If server returned a response (even 4xx/5xx), return it directly
    return { status: directRes.status, data: parsed as T };
  } catch (err: unknown) {
    // If direct failed (CORS error, Mixed Content, or network failure), and proxyMode is 'auto', fallback
    if (proxyMode === 'auto') {
      console.warn('Direct fetch failed (likely CORS or Mixed Content), trying backend proxy:', err);
      return callViaBackendProxy<T>(targetUrl, method, mergedHeaders, bodyData);
    }
    const errMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`直接连接失败 (${errMessage})。提示：若遇到跨域(CORS)或HTTPS混合内容限制，可在设置中切换为“服务端代理”模式。`);
  }
}

async function callViaBackendProxy<T>(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  bodyData: unknown
): Promise<{ status: number; data: T }> {
  const proxyRes = await fetch('/api/daidai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetUrl,
      method,
      headers,
      body: bodyData,
    }),
  });

  const text = await proxyRes.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // raw text
  }

  if (!proxyRes.ok && typeof parsed === 'object' && parsed !== null) {
    const errObj = parsed as Record<string, unknown>;
    const detail = errObj.message || errObj.msg || errObj.error;
    if (detail) {
      throw new Error(`[HTTP ${proxyRes.status}] ${detail}`);
    }
  }

  return { status: proxyRes.status, data: parsed as T };
}

/**
 * Retrieve Open API Bearer Token using appKey and appSecret.
 * Caches token for 23 hours to avoid hitting call limits.
 */
export async function getAuthToken(config: PanelConfig, forceRefresh = false): Promise<string> {
  const base = normalizeApiUrl(config.apiUrl);
  if (!base) throw new Error('请先在设置中填写呆呆面板 API 地址');
  if (!config.appKey?.trim() || !config.appSecret?.trim()) {
    throw new Error('请先在设置中填写 AppKey 与 AppSecret');
  }

  const now = Date.now();
  if (
    !forceRefresh &&
    memoryTokenCache &&
    memoryTokenCache.appKey === config.appKey &&
    memoryTokenCache.expiresAt > now + 60 * 1000
  ) {
    return memoryTokenCache.token;
  }

  const tokenUrl = `${base}/api/v1/open-api/token`;
  const cleanAppKey = config.appKey.trim();
  const cleanAppSecret = config.appSecret.trim();

  // Daidai Panel Open API standard uses snake_case (app_key, app_secret),
  // while some extensions support camelCase. We supply both to ensure 100% compatibility.
  const tokenPayload = {
    app_key: cleanAppKey,
    app_secret: cleanAppSecret,
    appKey: cleanAppKey,
    appSecret: cleanAppSecret,
  };

  const res = await callPanelApi<{
    code?: number;
    data?: string | { token?: string; access_token?: string; accessToken?: string };
    token?: string;
    access_token?: string;
    accessToken?: string;
    message?: string;
    msg?: string;
    error?: string;
  }>(
    tokenUrl,
    'POST',
    {},
    tokenPayload,
    config.proxyMode || 'auto'
  );

  const resData = res.data;
  let token = '';

  if (resData && typeof resData === 'object') {
    const d = resData as Record<string, unknown>;
    if (typeof d.data === 'string' && d.data) {
      token = d.data;
    } else if (d.data && typeof d.data === 'object' && d.data !== null) {
      const sub = d.data as Record<string, unknown>;
      token = String(sub.access_token || sub.token || sub.accessToken || '');
    }
    if (!token) {
      token = String(d.access_token || d.token || d.accessToken || '');
    }
  }

  if (!token) {
    let errorDetail = '';
    if (resData && typeof resData === 'object') {
      const d = resData as Record<string, unknown>;
      errorDetail = String(d.message || d.msg || d.error || '');
    } else if (typeof resData === 'string') {
      errorDetail = resData;
    }
    const fullMsg = errorDetail
      ? `[HTTP ${res.status}] ${errorDetail}`
      : `状态码 ${res.status}，未返回有效 Token (access_token)。请确认呆呆面板后台【应用管理】中该应用已勾选【环境变量】权限。`;
    throw new Error(`获取呆呆面板 Token 失败: ${fullMsg}`);
  }

  // Cache token for 23 hours (Daidai panel token lasts 24 hours)
  memoryTokenCache = {
    token,
    expiresAt: now + 23 * 60 * 60 * 1000,
    appKey: config.appKey,
  };

  return token;
}

/**
 * Diagnostic test connection to Daidai Panel
 */
export async function testConnection(config: PanelConfig): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
  envCount?: number;
}> {
  const startTime = Date.now();
  try {
    const token = await getAuthToken(config, true);
    const envs = await getEnvs(config, token);
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      message: `连接成功！认证通过，当前面板共包含 ${envs.length} 个环境变量。`,
      latencyMs,
      envCount: envs.length,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
      latencyMs,
    };
  }
}

/**
 * Fetch environment variables from Daidai Panel
 */
export async function getEnvs(config: PanelConfig, token?: string, searchValue?: string): Promise<EnvItem[]> {
  const authToken = token || (await getAuthToken(config));
  const base = normalizeApiUrl(config.apiUrl);
  
  let envsUrl = `${base}/api/v1/envs`;
  if (searchValue) {
    envsUrl += `?searchValue=${encodeURIComponent(searchValue.trim())}`;
  }

  const res = await callPanelApi<{
    code?: number;
    data?: EnvItem[] | { data?: EnvItem[]; envs?: EnvItem[] };
    message?: string;
  }>(
    envsUrl,
    'GET',
    {
      Authorization: `Bearer ${authToken}`,
    },
    null,
    config.proxyMode || 'auto'
  );

  let list: EnvItem[] = [];
  const raw = res.data as Record<string, unknown>;

  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.data)) {
      list = raw.data as EnvItem[];
    } else if (Array.isArray(raw.list)) {
      list = raw.list as EnvItem[];
    } else if (Array.isArray(raw.rows)) {
      list = raw.rows as EnvItem[];
    } else if (raw.data && typeof raw.data === 'object' && raw.data !== null) {
      const sub = raw.data as Record<string, unknown>;
      if (Array.isArray(sub.data)) {
        list = sub.data as EnvItem[];
      } else if (Array.isArray(sub.envs)) {
        list = sub.envs as EnvItem[];
      } else if (Array.isArray(sub.list)) {
        list = sub.list as EnvItem[];
      } else if (Array.isArray(sub.rows)) {
        list = sub.rows as EnvItem[];
      }
    }
  }

  return list;
}

/**
 * 检查环境变量在面板中是否处于禁用状态
 * 兼容呆呆面板与青龙面板的多种字段标识：
 * - enabled === false 或 enabled === 0
 * - status === 1 或 status === false 或 status === 'disabled'
 * - isDisabled === 1 或 isDisabled === true
 */
export function isEnvDisabled(item: EnvItem): boolean {
  if (item.enabled === false || (item.enabled as unknown) === 0) return true;
  if (item.isDisabled === true || item.isDisabled === 1) return true;
  if (item.status === 1 || (item.status as unknown) === false || (item.status as unknown) === 'disabled') return true;
  return false;
}

/**
 * 启用指定的呆呆面板 / 青龙面板环境变量
 * 兼容多种 API 规范：
 * 1. PUT /api/v1/envs/enable 传入 [id] (呆呆/青龙最标准的批量/单条启用规范)
 * 2. PUT /api/v1/envs/:id/enable
 * 3. PUT /open/envs/enable 传入 [id]
 * 4. PUT /api/v1/envs/:id 传入 { id, enabled: true, status: 0 }
 */
export async function enableEnv(
  config: PanelConfig,
  envId: string | number,
  token?: string
): Promise<boolean> {
  const authToken = token || (await getAuthToken(config));
  const base = normalizeApiUrl(config.apiUrl);
  const headers = { Authorization: `Bearer ${authToken}` };
  const proxyMode = config.proxyMode || 'auto';

  // 1. 尝试 PUT /api/v1/envs/enable 携带 [id] (标准批量/单条启用)
  try {
    const res = await callPanelApi<{ code?: number; message?: string }>(
      `${base}/api/v1/envs/enable`,
      'PUT',
      headers,
      [envId],
      proxyMode
    );
    if (res.status < 400) return true;
  } catch {
    // 继续尝试下一个兼容端点
  }

  // 2. 尝试 PUT /api/v1/envs/:id/enable
  try {
    const res = await callPanelApi<{ code?: number; message?: string }>(
      `${base}/api/v1/envs/${envId}/enable`,
      'PUT',
      headers,
      null,
      proxyMode
    );
    if (res.status < 400) return true;
  } catch {
    // 继续尝试下一个兼容端点
  }

  // 3. 尝试 PUT /open/envs/enable 携带 [id] (部分青龙 OpenAPI 路由)
  try {
    const res = await callPanelApi<{ code?: number; message?: string }>(
      `${base}/open/envs/enable`,
      'PUT',
      headers,
      [envId],
      proxyMode
    );
    if (res.status < 400) return true;
  } catch {
    // 继续尝试下一个兼容端点
  }

  // 4. 尝试通过单条更新设置 enabled: true, status: 0
  try {
    const res = await callPanelApi<{ code?: number; message?: string }>(
      `${base}/api/v1/envs/${envId}`,
      'PUT',
      headers,
      { id: envId, enabled: true, status: 0 },
      proxyMode
    );
    if (res.status < 400) return true;
  } catch {
    // 忽略
  }

  return false;
}

/**
 * 格式化当前时间为 YYYY-MM-DD HH:mm:ss
 */
export function formatCurrentTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 构造同步环境变量时附带的备注信息，自动附带当前时间。
 * - 如果基础备注包含 {time} 占位符，直接替换。
 * - 自动清理历史已附加的时间戳，避免多次同步产生时间戳堆叠。
 */
export function buildSyncRemarks(customRemarks?: string, existingRemarks?: string): string {
  const timeStr = formatCurrentTime();
  let base = customRemarks?.trim() || existingRemarks?.trim() || '由呆呆剪贴板助手更新';

  // 支持用户自定义 {time} 占位符
  if (base.includes('{time}')) {
    return base.replace(/{time}/g, timeStr);
  }

  // 清除旧的末尾时间戳（支持 ()、[]、{}、中文括号等包裹或直接跟随的时间戳）
  base = base
    .replace(/\s*[([（【]?\d{4}[-/.]\d{2}[-/.]\d{2}\s+\d{2}:\d{2}(?::\d{2})?[)\]）】]?\s*$/, '')
    .trim();

  if (!base) {
    base = '由呆呆剪贴板助手更新';
  }

  return `${base} (${timeStr})`;
}

/**
 * Smart Upsert Environment Variable:
 * 1. Queries panel to see if variable already exists (exact name match)
 * 2. If exists -> calls PUT /api/v1/envs/:id to update value
 *    - If target variable is disabled and auto-enable is on -> automatically enables it
 *    - Remarks automatically appended with current timestamp
 * 3. If does not exist -> calls POST /api/v1/envs to create
 */
export async function syncEnvValue(
  config: PanelConfig,
  targetName: string,
  newValue: string,
  customRemarks?: string
): Promise<{
  action: 'updated' | 'created';
  envId: string | number;
  message: string;
  remarks: string;
  previousValue?: string;
  autoEnabled?: boolean;
}> {
  const trimmedName = targetName.trim();
  if (!trimmedName) throw new Error('环境变量名不能为空');
  if (newValue === undefined || newValue === null) throw new Error('环境变量值不能为空');

  const token = await getAuthToken(config);
  const base = normalizeApiUrl(config.apiUrl);

  // Search existing envs
  const envs = await getEnvs(config, token, trimmedName);
  const existing = envs.find((item) => item.name === trimmedName);

  const remarks = buildSyncRemarks(customRemarks, existing?.remarks);

  if (existing && existing.id !== undefined) {
    const shouldAutoEnable = config.autoEnableIfDisabled !== false;
    const wasDisabled = isEnvDisabled(existing);
    let autoEnabled = false;

    // Update existing environment variable
    const updateUrl = `${base}/api/v1/envs/${existing.id}`;
    const payload: Record<string, unknown> = {
      id: existing.id,
      name: trimmedName,
      value: newValue,
      remarks,
    };

    if (shouldAutoEnable) {
      payload.enabled = true;
      payload.status = 0;
    }

    const res = await callPanelApi<{ code?: number; message?: string; msg?: string }>(
      updateUrl,
      'PUT',
      { Authorization: `Bearer ${token}` },
      payload,
      config.proxyMode || 'auto'
    );

    if (res.status >= 400) {
      // In case panel expects PUT /api/v1/envs without ID in path
      const fallbackUrl = `${base}/api/v1/envs`;
      await callPanelApi(
        fallbackUrl,
        'PUT',
        { Authorization: `Bearer ${token}` },
        payload,
        config.proxyMode || 'auto'
      );
    }

    // 若原先被禁用且开启了自动启用，调用启用接口确保激活生效
    if (shouldAutoEnable && wasDisabled) {
      try {
        await enableEnv(config, existing.id, token);
        autoEnabled = true;
      } catch (err) {
        console.warn('Failed to call enableEnv endpoint, payload may have updated it:', err);
        autoEnabled = true;
      }
    }

    const message = autoEnabled
      ? `成功更新环境变量 [${trimmedName}]（原处于禁用状态，已自动启用）`
      : `成功更新环境变量 [${trimmedName}]`;

    return {
      action: 'updated',
      envId: existing.id,
      message,
      remarks,
      previousValue: existing.value,
      autoEnabled,
    };
  } else {
    // Create new environment variable
    const createUrl = `${base}/api/v1/envs`;
    
    // Most Daidai / Qinglong panels support batch array [{ name, value, remarks, enabled: true }]
    const batchPayload = [
      {
        name: trimmedName,
        value: newValue,
        remarks,
        enabled: true,
        status: 0,
      },
    ];

    try {
      const res = await callPanelApi<{
        code?: number;
        data?: EnvItem | EnvItem[];
        message?: string;
      }>(
        createUrl,
        'POST',
        { Authorization: `Bearer ${token}` },
        batchPayload,
        config.proxyMode || 'auto'
      );

      let createdId: string | number = 'new';
      if (res.data?.data) {
        if (Array.isArray(res.data.data) && res.data.data[0]?.id) {
          createdId = res.data.data[0].id;
        } else if (typeof res.data.data === 'object' && 'id' in res.data.data) {
          createdId = (res.data.data as { id: string | number }).id;
        }
      }

      return {
        action: 'created',
        envId: createdId,
        message: `目标变量不存在，已在呆呆面板自动创建并启用 [${trimmedName}]`,
        remarks,
      };
    } catch {
      // Fallback to single object payload
      const singlePayload = {
        name: trimmedName,
        value: newValue,
        remarks,
        enabled: true,
        status: 0,
      };
      await callPanelApi(
        createUrl,
        'POST',
        { Authorization: `Bearer ${token}` },
        singlePayload,
        config.proxyMode || 'auto'
      );

      return {
        action: 'created',
        envId: 'new',
        message: `目标变量不存在，已在呆呆面板自动创建并启用 [${trimmedName}]`,
        remarks,
      };
    }
  }
}
