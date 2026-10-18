# CMS architecture — ArmTourNest

## Components

```text
Authorized editor -> Pages CMS (hosted)
                         |
                         v
                GitHub repository
                .pages.yml + content/*.json + media/*
                         |
                         | Git push after editor saves
                         v
               Cloudflare Pages / Vercel CI
                npm run build (build.mjs)
                         |
                         v
                 static deployment (dist/)
                         |
                         v
             Public ArmTourNest website
```

## Why this CMS

- **Free** and hosted (Pages CMS is MIT licensed and free).
- Content and images are versioned in GitHub; no proprietary content database or vendor lock-in.
- Editors get forms for localized fields, numbers, images, repeatable itinerary steps and newly created records.
- A separate JSON file per vehicle/tour ensures item-level editing and simplifies future scale-out.
- The site remains fast and deploys static assets, so editorial updates do not require a database or a public admin API.

## Content editing contract

- `status`: `published` | `draft` | `archived`; only published appears publicly.
- `id`: permanent URL identifier, lower-case and hyphenated. Renaming may break old links.
- `name/summary/description/seo`: structured objects with `en`, `ru` and `hy` keys.
- `pricing`: tour `from` or car `dailyRate` (AMD), `isIndicative` when samples.
- `image` / `gallery` / `images`: absolute `/media/...` for uploaded media, or existing external source URL.
- `content/pages/{page}.json` has `heroImage` and `copy` translations; `home.json` also has hero, CTA and service tile configuration.
- `content/site.json` has shared phone, WhatsApp, social profiles, logo and settings.

## Workflow

1. Edit or create an item in Pages CMS.
2. Pages CMS commits the JSON or media update to the GitHub repository.
3. Hosting builds and validates records using `build.mjs`. Unpublished records are filtered.
4. The deployed version becomes the public production page; Git commit history allows rollback.

## Future enhancements

- Approval workflow + PR previews for multiple editors.
- SEO-friendly server-rendered routes `/en/tours/{slug}` etc.
- CMS-managed tour departures, schedule, available seats, booking price tiers, rental inventory and seasonality.
- Booking order database, WhatsApp/CRM notification backend and payment processing.
- Admin RBAC, activity auditing, content validation and staging/production environments.
