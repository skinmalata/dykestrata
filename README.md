# DYKESTRATA SERVICES LIMITED — Corporate Website

A modern, responsive, static corporate website for **DYKESTRATA SERVICES LIMITED**
(RC 9931890), a private company limited by shares incorporated in the Federal
Republic of Nigeria.

Built with semantic HTML5, modern CSS3, and vanilla JavaScript — no framework.
Deployable to Cloudflare Pages (recommended) or any static host. A Cloudflare
Pages Function provides a secure contact-form endpoint.

---

## 1. What is included

| Deliverable | Status |
| --- | --- |
| Homepage (`index.html`) | Implemented |
| About Us (`about.html`) | Implemented |
| Services (`services.html`) | Implemented (content = clearly-marked placeholders) |
| Industries (`industries.html`) | Built but **deactivated** (`noindex`, excluded from nav & sitemap) |
| Contact (`contact.html`) with enquiry form | Implemented (delivery requires credentials — see §4) |
| Privacy Policy (`privacy.html`) | Template — **requires legal review** |
| Terms of Use (`terms.html`) | Template — **requires legal review** |
| 404 (`404.html`) | Implemented |
| Shared header/footer | Implemented on every page |
| Responsive stylesheet | `assets/css/styles.css` |
| Central config | `assets/js/config.js` |
| Site behaviour | `assets/js/main.js` |
| SEO files | `robots.txt`, `sitemap.xml`, `site.webmanifest`, per-page meta + Open Graph, `og-image.png`, JSON-LD `Organization` |
| Security headers | `_headers` (Cloudflare Pages) |
| Contact backend | `functions/api/contact.js` (Cloudflare Pages Function) |
| Security checklist | `SECURITY.md` |
| Outstanding info | `COMPANY-INFO-REQUIRED.md` |

---

## 2. Project structure

```
dykestrata/
├── index.html                # Homepage
├── about.html                # About Us
├── services.html             # Services
├── industries.html           # Industries (inactive template)
├── contact.html              # Contact + enquiry form
├── privacy.html              # Privacy Policy (template)
├── terms.html                # Terms of Use (template)
├── 404.html                  # Not found
│
├── assets/
│   ├── css/
│   │   └── styles.css        # Design system + all styles
│   ├── js/
│   │   ├── config.js         # ★ SINGLE SOURCE OF TRUTH for business details
│   │   └── main.js           # Navigation, form, bindings, integrations
│   └── images/
│       ├── logo.svg          # Wordmark mark (placeholder monogram)
│       ├── hero.svg
│       ├── about.svg
│       └── og-image.png      # 1200×630 social share image
│
├── functions/
│   └── api/
│       └── contact.js        # Cloudflare Pages Function: POST /api/contact
│
├── favicon.svg
├── site.webmanifest
├── robots.txt
├── sitemap.xml
├── _headers                # Security + cache headers (Cloudflare Pages)
├── .env.example
├── .gitignore
├── README.md
├── SECURITY.md
└── COMPANY-INFO-REQUIRED.md
```

---

## 3. Local development

No build step is required. Serve the folder over HTTP (opening `index.html`
directly with `file://` works for styling, but the form and clean paths are
best tested over HTTP).

Pick any static server, for example:

```powershell
# Option A — Python (usually already installed)
python -m http.server 8080

# Option B — Node (npx, no global install)
npx serve .
```

Then open <http://localhost:8080>.

To exercise the contact endpoint locally you can run it with Wrangler:

```powershell
npm install -g wrangler
wrangler pages dev . --binding RESEND_API_KEY=xxx --binding CONTACT_TO_EMAIL=you@example.com --binding CONTACT_FROM_EMAIL=website@example.com
```

---

## 4. Contact form setup (required before launch)

Out of the box the form is **safe but inactive**: it validates input and tells
the visitor honestly that delivery is not configured. Nothing is sent.

To activate delivery:

1. Create a free [Resend](https://resend.com) account and verify a sending
   domain (or use their test sender while evaluating).
2. Create an API key.
3. In Cloudflare Pages → **Settings → Environment variables**, add:
   - `RESEND_API_KEY` (encrypted)
   - `CONTACT_TO_EMAIL` — where enquiries should arrive
   - `CONTACT_FROM_EMAIL` — a verified sender address
4. In `assets/js/config.js`, set:
   ```js
   contactForm: { endpoint: "/api/contact", configured: true },
   ```
5. Submit a real test enquiry end-to-end and confirm receipt **before** launch.

The function (`functions/api/contact.js`) performs server-side validation,
honeypot rejection, per-IP rate limiting, HTML-escaping of all fields, and
returns generic error messages. Secrets are read from environment variables only.

Swap providers (Formspree, Web3Forms, your own SMTP relay) by pointing
`contactForm.endpoint` at the new URL and adapting the handler — do **not** put
provider secrets in frontend JavaScript.

---

## 5. Editing content

**Business details** (company name, RC number, email, phone, address, social
links, brand/feature flags, analytics) live in `assets/js/config.js`. Elements
across all pages are bound to these values via `data-bind="path.to.value"`, so
most edits happen in one file.

**Page copy** (headings, paragraphs, cards) is edited directly in the relevant
`.html` file. Search for the visible text you want to change.

**Services** — replace the placeholder `<article>` blocks in `services.html`
(and the cards in `index.html`) with approved titles and descriptions.

**Images** — drop replacements into `assets/images/` and update the `src`
attributes. Keep the `width`/`height` attributes set to avoid layout shift.

**Brand colours** — edit the CSS custom properties at the top of
`assets/css/styles.css` (`:root { --navy-800: …; --teal-600: … }`).

**Logo** — replace `assets/images/logo.svg` and `favicon.svg`. The current mark
is a **temporary placeholder monogram**, not a registered logo.

After editing, update `<lastmod>` dates in `sitemap.xml` and (optionally) bump a
version marker.

### Publishing the Industries page

When sectors are confirmed:
1. Replace placeholder content in `industries.html`.
2. Remove the `<meta name="robots" content="noindex,nofollow">` line.
3. Uncomment the Industries `<li>` in the navigation on every page.
4. Add the URL to `sitemap.xml`.
5. Set `features.industriesPage: true` in `config.js`.

---

## 6. Deployment — Cloudflare Pages (recommended)

1. Push this repository to GitHub (private is fine).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to
   Git**, and select the repository.
3. Build settings (static site, no build step):
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (the repository root)
4. Add the environment variables from §4.
5. Deploy. Cloudflare serves `_headers` and the `functions/` directory
   automatically.
6. Connect your custom domain under **Custom domains**, and enforce HTTPS.

### Alternative: GitHub Pages

Push to a `main` branch and enable Pages (serve from root). Note that GitHub
Pages **does not** run `_headers` or Pages Functions, so the contact form will
remain inactive there unless you add an external form provider. This is a valid
interim option: the site works, and the form clearly states it is not configured.

---

## 7. Post-launch configuration checklist

- [ ] Replace `https://www.dykestrata.example` with the real domain in
      `index.html`, `about.html`, `services.html`, `contact.html`,
      `privacy.html`, `terms.html` (canonical + Open Graph), `robots.txt`,
      `sitemap.xml`, and `config.js`.
- [ ] Fill in `assets/js/config.js` contact details and re-check every page.
- [ ] Complete the contact-form setup (§4) and test delivery.
- [ ] Have Privacy Policy and Terms of Use reviewed; then remove `noindex` from
      those pages and add them to `sitemap.xml` if desired.
- [ ] Submit `sitemap.xml` to Google Search Console / Bing Webmaster Tools.
- [ ] Confirm `og-image.png` renders correctly when sharing a link.
- [ ] Work through `SECURITY.md`.

---

## 8. Future enhancements (intentionally not built yet)

Keep the initial release lean. When the business needs them, consider adding:

- A lightweight CMS (e.g. Decap/Netlify CMS or a headless option) so
  non-technical staff can edit articles and service pages.
- CRM / quotation workflow integration via the form endpoint.
- WhatsApp Business link (once an official number exists) — add to
  `config.js` `contact.whatsapp`.
- Privacy-conscious analytics (Plausible/GA4) — enable in `config.js` **and**
  update `_headers` CSP.
- A newsletter system or client portal only if justified by real demand.

**Do not** add user accounts, payment processing, or dashboards before there is
a genuine business requirement.

---

## 9. Support & maintenance

- Keep dependencies minimal (there are none at runtime beyond Google Fonts).
- Review Cloudflare/Resend free-tier limits periodically; nothing is guaranteed
  to remain free.
- Back up the repository (and any future data store) regularly; see the recovery
  notes in `SECURITY.md`.
- Never commit secrets. `.env` is git-ignored; only `.env.example` is tracked.
