import crypto from 'node:crypto';
import { OWNER, REPO, BASE_URL, ready, cookie, cookieHeader, encrypt, session, github, reply, csrf } from '../lib/server.mjs';

export default async function handler(req, res) {
  const action = String(req.query.action || 'session');
  if (req.method === 'GET' && action === 'session') {
    const s = session(req);
    return reply(res, 200, { configured: ready(), authenticated: Boolean(s), user: s ? s.user : null, loginUrl: '/api/auth?action=login' });
  }
  if (req.method === 'GET' && action === 'login') {
    if (!ready()) return res.redirect('/?setup=required');
    const state = crypto.randomBytes(32).toString('base64url');
    res.setHeader('Set-Cookie', cookieHeader('__Host-armtournest_oauth', state, 600));
    const u = new URL('https://github.com/login/oauth/authorize');
    u.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
    u.searchParams.set('redirect_uri', BASE_URL + '/api/auth?action=callback');
    u.searchParams.set('scope', 'public_repo');
    u.searchParams.set('state', state);
    return res.redirect(u.toString());
  }
  if (req.method === 'GET' && action === 'callback') {
    const state = String(req.query.state || '');
    const stored = cookie(req, '__Host-armtournest_oauth');
    res.setHeader('Set-Cookie', cookieHeader('__Host-armtournest_oauth', '', 0));
    if (!ready() || !state || !stored || state.length !== stored.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(stored))) return res.redirect('/?error=invalid-state');
    if (!req.query.code || req.query.error) return res.redirect('/?error=github-consent');
    try {
      const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: String(req.query.code),
          redirect_uri: BASE_URL + '/api/auth?action=callback'
        }),
        signal: AbortSignal.timeout(18000)
      });
      const data = await tokenResp.json();
      if (!tokenResp.ok || !data.access_token) throw new Error('GitHub authorization failed');
      const user = await github(data.access_token, '/user');
      if (String(user.login).toLowerCase() !== OWNER.toLowerCase()) throw new Error('Only the ArmTourNest repository owner can sign in');
      const repo = await github(data.access_token, '/repos/' + OWNER + '/' + REPO);
      if (!repo.permissions?.push) throw new Error('No write access to the ArmTourNest repository');
      const payload = { user: OWNER, token: data.access_token, exp: Date.now() + 4*3600*1000 };
      res.setHeader('Set-Cookie', [
        cookieHeader('__Host-armtournest_oauth', '', 0),
        cookieHeader('__Host-armtournest_session', encrypt(payload), 4*3600)
      ]);
      return res.redirect('/');
    } catch (e) {
      console.error('CMS OAuth:', e.message);
      return res.redirect('/?error=access-denied');
    }
  }
  if (req.method === 'POST' && action === 'logout') {
    if (!csrf(req)) return reply(res, 403, { error: 'Invalid origin' });
    res.setHeader('Set-Cookie', cookieHeader('__Host-armtournest_session', '', 0));
    return reply(res, 200, { ok: true });
  }
  return reply(res, 404, { error: 'Unknown action' });
}
