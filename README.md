# ArmTourNest — CMS-managed tourism and car rental website

**Stack:** static HTML/CSS/JS + JSON content + [Pages CMS](https://pagescms.org/) + GitHub + automatic static deployment to Cloudflare Pages or Vercel.

**Languages:** English, Russian, Armenian. **No database**, runtime API, or paid CMS subscription is needed for editorial content.

## What is implemented

| Manage in Pages CMS | Stored in GitHub | Site behavior |
|---|---|---|
| Each tour individually | `content/tours/{id}.json` | Add/edit/archive, localize title, summary, route, inclusion list, images and price |
| Each rental car individually | `content/cars/{id}.json` | Add/edit/archive, vehicle photo gallery, category, transmission, drive, seats, daily price, deposit |
| Homepage | `content/pages/home.json` | Hero background, multilingual headline/subtitle, service tile images, homepage copy |
| Tour catalogue page | `content/pages/tours.json` | Localized page labels and page hero image |
| Car rental page | `content/pages/cars.json` | Localized page labels and page hero image |
| Transfers / hotel services | `content/transfers/*.json`, `content/hotels/*.json` | Add or edit each service, publish or archive |
| Transfers, hotels, about, contact pages | `content/pages/{page}.json` | Localized page headings and hero images |
| Company settings | `content/site.json` | Phone, WhatsApp, future Facebook/Instagram links, logo, address |
| Shared interface labels | `content/i18n/{en,ru,hy}.json` | Navigation, buttons and common text in each language |
| Images | `media/` | Uploaded via CMS and available at `/media/{filename}` |

Content schema: `.pages.yml`. The website publishes only records with `status: "published"`.

## Administrator setup — one-time, no development necessary

1. Source repository: **[Narek1990/Armtournest](https://github.com/Narek1990/Armtournest)**, production branch `main`. All editable content and the `.pages.yml` schema are stored here.
2. Open **https://app.pagescms.org/**, sign in with the GitHub account owning `Narek1990/Armtournest`, and authorize/install **Pages CMS** for that repository. Select `main`. The editor automatically reads `.pages.yml` and displays per-page, per-tour and per-car editors.
3. In Pages CMS, open **Tours** or **Cars**, edit a record, and **Save**. You can create a new record by setting a unique slug such as `toyota-highlander-2025`, entering EN/RU/HY text, an image and a price, and selecting `published`.
4. Connect the GitHub repository to your static host for automatic redeployments: **Cloudflare Pages Free** (recommended for a commercial tourism project). Build command: `npm run build`; output folder: `dist`. Node.js 20+.
5. After deployment, new or edited content appears on the website following its normal build. GitHub provides version history and rollback.

The current `armtournest-demo.vercel.app` is an accessible *demo*, not the final Git-driven CMS deployment. Vercel Hobby is restricted to non-commercial use; don't run a commercial booking service on the free Hobby plan. Cloudflare Pages Free is a suitable next hosting candidate, subject to its terms and usage limits.

### Editor checklist

- **Add a tour:** Tours → New → enter unique id, 3-language name/summary, itinerary stops, `pricing.from`, cover and gallery → `published` → Save.
- **Edit a car:** Cars → select vehicle → adjust `pricing.dailyRate`, seats, features, images → Save.
- **Change homepage:** Page: Home → hero image and localized fields → Save.
- **Change any other page:** Page: About / Contact / Cars / Tours / Transfers / Hotels → edit hero image and per-language copy → Save.
- **Add a social link:** Website settings → contacts → social → enter complete `https://` Facebook and Instagram profile URLs → Save. The header icons become active.
- **Change WhatsApp/phone:** Website settings → contacts → edit `phone` and `whatsapp`. WhatsApp value must contain digits, e.g. `37477300037`.
- **Hide a vehicle without deleting it:** set `status` to `draft` or `archived`.

## Local development / build

```bash
node --version # 20+
npm run build
python3 -m http.server 8080 -d dist
```

Open http://localhost:8080. Files in `dist/` are build outputs. All edits should go into `content/` or `media/`, not built HTML.

## Important boundaries

- Website and CMS are built for **catalogue and enquiry management**, not live stock allocation or online payment. Booking requests are generated as copyable email/WhatsApp messages; they are not stored automatically in a CRM.
- Sample car photographs and tour prices must be replaced with confirmed fleet photos and real rates before commercialization.
- Not a full multilingual SEO system: hash routes currently share a page; clean SEO URLs, hreflang, per-tour metadata and sitemaps are a recommended later enhancement.
- CMS editing is available to people you authorize through the Pages CMS GitHub integration; do not put admin tokens in frontend code.


## Publishing workflow for editors

`Pages CMS Save` → GitHub commit to `main` → connected hosting service rebuild (`npm run build`, output `dist`) → refreshed public website. **This is not a database with instantaneous pushes**; allow for the host build/deploy queue (usually seconds to minutes).

Hosted Pages CMS needs the repository owner to approve the GitHub App once. Do not share login credentials, personal access tokens, or API secrets with site visitors.
