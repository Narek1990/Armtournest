# ArmTourNest Content Studio — Standalone staff CMS

**CMS:** https://cms.armtournest.com/  
**Website:** https://armtournest.com/  
**Hosting:** Vercel project `armtournest-cms`, repo `Narek1990/Armtournest`, Root Directory `cms`.

The CMS is independent of GitHub's technical UI. A staff member signs in with a username and password, edits content in a visual dashboard, and saves. The CMS server makes repository commits using a tightly restricted credential; the public website automatically deploys.

## Owner: one-time activation

In Vercel → armtournest-cms → Settings → Environment Variables, add for **Production**:

1. `CMS_EDITOR_USERNAME` — choose a staff login, e.g. `editor`.
2. `CMS_EDITOR_PASSWORD` — choose a strong, unique password **14+ characters**. Set type **Sensitive**.
3. `CMS_GITHUB_TOKEN` — GitHub **fine-grained PAT**, select resource owner `Narek1990`, **only** repository `Armtournest`, Repository permissions → **Contents: Read and write**. Set type **Sensitive**.

Create restricted token: https://github.com/settings/personal-access-tokens/new . Choose a reasonable expiration and renew before expiry. The existing variables `CMS_BASE_URL=https://cms.armtournest.com` and `CMS_SESSION_KEY` are already present; preserve them. After saving secrets, **redeploy Production**.

**Do not send passwords or the GitHub token through chat**, and never put them in repository source or public variables. GitHub OAuth Client ID/Secret are no longer required; the old OAuth callback is disabled.

## Staff workflow

Open https://cms.armtournest.com, sign in with the username and password provided by the owner. Use the left menu for Tours, Rental cars, Transfers, Hotels, Website pages, and Site settings. Edit fields, images, prices and EN/RU/HY translations, then click Save. A production deployment is triggered automatically. No GitHub account is needed.

## Security / limitations

Password, token and session key remain in Vercel server-side environment variables. Encrypted AES-256-GCM HttpOnly, Secure, SameSite=Lax cookies expire after four hours. POST endpoints enforce origin checks and there is best-effort per-instance login throttling. **Enable a Vercel Firewall rate-limit rule on the login endpoint** before sharing widely; memory throttling is not distributed between serverless instances. Changing the password or publishing token invalidates previous sessions.

Current implementation has **one editor account**; no per-person audit trail, self-service password recovery, or separate permission roles. Use a designated editor with a unique password. For larger teams, add a managed identity provider.

Cloudflare CNAME for `cms` points to `46a5d5d45a8cd017.vercel-dns-017.com` (DNS only). The public website stays separate.
