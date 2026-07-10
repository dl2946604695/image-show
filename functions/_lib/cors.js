// 共享 CORS / 响应辅助函数（Cloudflare Pages Functions）
// 同域部署时 CORS 非必需，但加上后可支持本地跨域开发（vite + wrangler）。

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function getKV(context) {
  return context.env.PHOTO_STORE;
}

export function getSecret(context) {
  return context.env.JWT_SECRET || 'change-me-in-production';
}
