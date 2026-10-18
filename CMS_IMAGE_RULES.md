# ArmTourNest CMS image rules

Pages CMS currently supports **extension restrictions** on image fields, not native upload byte/pixel limits. We restrict files to JPG, JPEG, PNG and WebP and show upload guidance in every image field. The deployment build enforces dimensions and sizes.

## Upload limits
- Allowed formats: JPG/JPEG, PNG, WebP (no GIF or uploaded SVG).
- Maximum source file: **8 MiB**.
- Maximum source image: **8192 px** on either side and **36 megapixels**.
- Use landscape vehicle/tour photos. A single detail image is shown once with `object-fit: contain`; cards are cropped using `object-fit: cover`.

## Deployed asset caps
| Image purpose | Largest output dimensions | File size cap |
|---|---|---|
| Homepage/page hero backgrounds | 1920 × 1080 | 650 KiB |
| Car, tour, hotel, transfer, gallery | 1600 × 1100 | 450 KiB |
| Custom uploaded logo | 800 × 800 | 150 KiB |

The build script transforms CMS media files into compressed WebP at `dist/media`. Original uploaded files stay in GitHub but are not sent to website visitors. Remote image URLs are not optimized; prefer Pages CMS uploads.

An invalid file results in a failed build with an explanatory error; Vercel leaves the last successful website version live. If this happens, replace the image in Pages CMS, save, and wait for the next successful deployment.
