// 基于 Web Crypto 的 JWT 与密码哈希（兼容 Cloudflare Workers 运行时，无需 node:crypto）

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes) {
  let str = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    str += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function jsonB64url(obj) {
  return b64urlEncode(enc.encode(JSON.stringify(obj)));
}

function parseB64url(str) {
  return JSON.parse(dec.decode(b64urlDecode(str)));
}

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function generateToken(userId, secret) {
  const header = jsonB64url({ alg: 'HS256', typ: 'JWT' });
  const payload = jsonB64url({
    userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天
  });
  const sig = await hmacSign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${sig}`;
}

export async function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = await hmacSign(`${parts[0]}.${parts[1]}`, secret);
  if (!constantTimeEqual(expected, parts[2])) return null;
  let payload;
  try {
    payload = parseB64url(parts[1]);
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  const saltB64 = b64urlEncode(salt);
  const hashB64 = b64urlEncode(new Uint8Array(bits));
  return `pbkdf2$100000$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const [, iterStr, saltB64, hashB64] = stored.split('$');
  const salt = b64urlDecode(saltB64);
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: parseInt(iterStr, 10), hash: 'SHA-256' },
    key,
    256,
  );
  const newHash = b64urlEncode(new Uint8Array(bits));
  return constantTimeEqual(newHash, hashB64);
}
