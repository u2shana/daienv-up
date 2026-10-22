import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const httpServer = http.createServer(app);

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Daidai Panel CORS & Mixed Content Proxy endpoint
app.post('/api/daidai-proxy', async (req, res) => {
  try {
    const { targetUrl, method = 'GET', headers = {}, body } = req.body;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ code: 400, message: 'Missing targetUrl' });
    }

    const fetchHeaders: Record<string, string> = { ...headers };
    delete fetchHeaders['host'];

    const response = await fetch(targetUrl, {
      method,
      headers: fetchHeaders,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '网络连接超时或目标地址不可达';
    return res.status(502).json({
      code: 502,
      message: `代理请求失败: ${errorMessage}`,
    });
  }
});

// Mount Vite in development or serve static build in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: false, // HMR is disabled in AI Studio dev environment to prevent WebSocket errors
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
