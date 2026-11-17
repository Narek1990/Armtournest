import crypto from 'node:crypto';

export const OWNER = 'Narek1990';
export const REPO = 'Armtournest';
export const BRANCH = 'main';
export const BASE_URL = process.env.CMS_BASE_URL || 'https://cms.armtournest.com';
export const TYPES = new Set(['cars', 'tours', 'transfers', 'hotels', 'pages', 'site']);

const key = () => crypto.createHash('sha256').update(process.env.CMS_SESSION_KEY || '').digest();
export const ready = () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.CMS_SESSION_KEY && process.env.CMS_BASE_URL);
export function cookie(req, name) {
  const raw = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return raw ? decodeURIComponent(raw.slice(name.length + 1)) : '';
}
export function cookieHeader(name, value, maxAge) {
  return name + '=' + encodeURIComponent(value) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + maxAge;
}
export function encrypt(payload) {
  if (!ready()) throw new Error('CMS credentials are not configured');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
export function decrypt(ciphertext) {
  try {
    if (!ready() || !ciphertext || ciphertext.length > 10000) return null;
    const raw = Buffer.from(ciphertext, 'base64url');
    if (raw.length < 30) return null;
    const dec = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0,12));
    dec.setAuthTag(raw.subarray(12,28));
    const data = Buffer.concat([dec.update(raw.subarray(28)), dec.final()]);
    const value = JSON.parse(data.toString('utf8'));
    if (typeof value.exp !== 'number' || value.exp < Date.now() || value.user !== OWNER || typeof value.token !== 'string') return null;
    return value;
  } catch (_) { return null; }
}
export function session(req) { return decrypt(cookie(req, '__Host-armtournest_session')); }
export function headers(res) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
export function reply(res, status, data) {
  headers(res);
  res.status(status).json(data);
}
export function csrf(req) {
  const origin = req.headers.origin;
  return typeof origin === 'string' && origin === BASE_URL;
}
export async function github(token, route, options = {}) {
  const method = options.method || 'GET';
  const url = 'https://api.github.com' + route;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(18000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error((result.message || 'GitHub request failed') + ' (' + response.status + ')');
    err.status = response.status;
    throw err;
  }
  return result;
}
export async function requireAdmin(req, res) {
  const s = session(req);
  if (!s) { reply(res, 401, { error: 'Login required' }); return null; }
  return s;
}
export function safeId(id) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(id || '')) && String(id).length <= 75; }
export function pathFor(type, id) {
  if (!TYPES.has(type)) throw Object.assign(new Error('Unknown content type'), { status: 400 });
  if (type === 'site') return 'content/site.json';
  if (!safeId(id)) throw Object.assign(new Error('Invalid content identifier'), { status: 400 });
  return 'content/' + type + '/' + id + '.json';
}
export async function readFile(token, path) {
  const data = await github(token, '/repos/' + OWNER + '/' + REPO + '/contents/' + path + '?ref=' + BRANCH);
  if (!data.content || data.encoding !== 'base64') throw Object.assign(new Error('Unsupported content encoding'), { status: 422 });
  return { data: JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8')), sha: data.sha };
}
export function message(e) { return String(e.message || 'Unexpected error').slice(0, 280); }
