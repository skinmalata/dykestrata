# Information required before launch

The website is built and working. The items below are **placeholders** that must
be supplied/confirmed by DYKESTRATA SERVICES LIMITED before the site is
published publicly. Nothing unverified has been presented as fact.

## Already verified (from the Certificate of Incorporation — no action needed)
- Legal name: DYKESTRATA SERVICES LIMITED
- Registration number: RC 9931890
- Company type: Private company limited by shares
- Country: Federal Republic of Nigeria
- Legislation: Companies and Allied Matters Act 2020
- Date of incorporation: 13 October 2026

## Needed from the company

### Commercial content
- [x] **Main business activities and services** — confirmed core service lines
      published on `services.html` and `index.html`: Seismic Acquisition,
      Processing and Interpretation; Field Development & Prospectivity
      Studies; Petrophysics; Pore Pressure and Geomechanics. Scope/deliverable
      wording is a first draft — ask the company to review it.
- [ ] **Target customers and industries** — required before publishing
      `industries.html`.
- [ ] **Mission, vision, and core values** — for approval on `about.html`.
- [ ] **Company overview / founding story** (only what is accurate).
- [ ] **Leadership / director profiles** — names, roles, and (optionally) short
      bios, with consent to publish. Not invented anywhere on the site.
- [ ] **Any certifications, licences, or memberships** — only if genuine and
      evidence can be provided.

### Contact details (currently placeholders in `assets/js/config.js`)
- [ ] **Business email address** (e.g. `info@…`).
- [ ] **Business telephone number**.
- [ ] **Office address** and whether it should be public.
- [ ] **Business hours**.
- [ ] **WhatsApp Business number** (optional).
- [ ] **Social media URLs** (LinkedIn, X, Facebook, Instagram) — optional.

### Brand
- [ ] **Official logo** (SVG/PNG) — replaces the temporary placeholder monogram.
- [ ] **Preferred brand colours** — updates CSS variables in `styles.css`.
- [ ] **Typography preference** if different from Inter.
- [ ] **Approved imagery** or licence to use the current abstract visuals.

### Technical
- [ ] **Preferred domain name** (e.g. `dykestrata.com`) — update everywhere the
      placeholder `www.dykestrata.example` appears.
- [ ] **Confirmation to publish** Privacy Policy and Terms of Use after review.
- [ ] **Email delivery choice** for the contact form (Resend account / API key),
      or an alternative provider.
- [ ] **Analytics decision** — whether to enable privacy-conscious analytics.

## Where to make each change
- Business/contact/brand values → `assets/js/config.js`
- Page wording → the relevant `.html` file
- Colours → `:root` variables at the top of `assets/css/styles.css`
- Domain → all HTML files + `robots.txt` + `sitemap.xml` + `config.js`
- Logo/images → `assets/images/`
