# ArmTourNest Content Studio

A separate authenticated admin application for the existing `Narek1990/Armtournest` GitHub-backed tourism site.

- **Production:** https://cms.armtournest.com
- **Public site:** https://armtournest.com
- **Hosting:** Independent Vercel project `armtournest-cms` with repository root directory `cms`
- **Authentication:** GitHub OAuth App; only GitHub owner `Narek1990` is accepted
- **Content storage:** Existing `content/*.json` files in GitHub. No separate database
- **Image uploads:** Browser-side WebP resizing plus server-side MIME/size checks, committed to `media/`
- **Publishing:** GitHub commit on branch `main` triggers the existing Vercel public website build

## Required Vercel production environment variables

```env
CMS_BASE_URL=https://cms.armtournest.com
GITHUB_CLIENT_ID=<set in Vercel>
GITHUB_CLIENT_SECRET=<set in Vercel (sensitive)>
CMS_SESSION_KEY=<generated 32+ bytes, set in Vercel (sensitive)>
```

### Create a GitHub OAuth App

Open https://github.com/settings/developers → OAuth Apps → New OAuth App:

- Application name: ArmTourNest Content Studio
- Homepage URL: `https://cms.armtournest.com`
- Authorization callback URL: `https://cms.armtournest.com/api/auth?action=callback`

Use the OAuth Client ID and Client Secret as *encrypted Vercel environment variables*; do not add them to the repository. The authorization requests `public_repo` (GitHub public repository read/write) and restricts access to the existing repository owner.

### DNS

In Cloudflare add one DNS-only CNAME record named `cms` pointing to the exact CNAME target shown in Vercel **Project → Settings → Domains**. Do not proxy the hostname until SSL is working.

### Editors

- Edit Tours, Cars, Transfers, Hotels, Website Pages, Site Settings.
- Preview current images, upload optimized photos, and edit English / Russian / Armenian.
- Save writes only to GitHub `main` with the GitHub file SHA as optimistic concurrency control.
- Image upload commits media separately; save the entry to reference the uploaded image.
- The public site includes independent image validation and build optimization.

### Security and operational notes

- No unauthenticated content access.
- AES-256-GCM encrypted short-lived HTTP-only Secure session cookie, SameSite=Lax.
- OAuth CSRF state validation; write requests enforce same-origin.
- Protect the GitHub OAuth Client Secret and CMS_SESSION_KEY.
- CMS is a bespoke independent admin UI, **not a redeployment of the upstream Pages CMS app**. The existing Pages CMS remains available as a fallback.
- If you change the domain, update `CMS_BASE_URL` and the OAuth App callback URL together.
