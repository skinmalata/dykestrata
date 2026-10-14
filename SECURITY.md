# Security Checklist — DYKESTRATA SERVICES LIMITED website

A practical, honest checklist for a static website with one serverless endpoint.
It does **not** claim the site is unhackable or fully secure; no site is.

Legend: `[x]` implemented in this codebase · `[ ]` action required by the owner
(usually at deployment time).

---

## 1. Frontend

- [x] Semantic HTML5, valid heading order on every page.
- [x] No `innerHTML` with untrusted data — user values are written with
      `textContent` (see `assets/js/main.js`).
- [x] No secrets or API keys in frontend JavaScript (`config.js` holds public
      display values only).
- [x] Minimal third-party scripts (only Google Fonts CSS; no trackers unless
      explicitly enabled).
- [x] External links avoid leaking referrer via the site Referrer-Policy.
- [x] Form validation is for usability only — never trusted alone.
- [ ] Serve over HTTPS in production (enforced by Cloudflare / host).
- [x] `_headers` sets a restrictive Content-Security-Policy, `X-Content-Type-Options: nosniff`,
      `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`.

## 2. Backend endpoint (`functions/api/contact.js`)

- [x] Server-side validation of every field (required, format, length).
- [x] Input sanitisation — control characters stripped, lengths capped.
- [x] HTML-escaping of all values placed into the outbound email.
- [x] Header-injection guard (`\r`/`\n` rejected in subject/email).
- [x] Honeypot field for basic bot rejection.
- [x] Per-IP rate limiting (best-effort, per isolate — upgrade to Cloudflare KV
      or Durable Objects if abuse becomes a problem).
- [x] Generic error messages; no stack traces or internal details returned.
- [x] Secrets read from environment variables only.
- [ ] Rotate `RESEND_API_KEY` periodically and use a least-privilege API key.
- [ ] Add CAPTCHA (e.g. Turnstile) if spam volume increases.

## 3. Supabase (only if a database is ever added)

Not used in this release. If added later:

- [ ] Enable Row Level Security on every table containing application data.
- [ ] Write explicit policies for select/insert/update/delete.
- [ ] Restrict users to records/actions they are authorised for.
- [ ] Never expose the `service_role` key in the frontend.
- [ ] Test policies as an anonymous and an authenticated user.
- [ ] Store sensitive records only where necessary.

## 4. GitHub & deployment

- [x] `.gitignore` excludes `.env`, build output, and tooling caches.
- [x] Only `.env.example` (placeholders) is committed.
- [ ] Keep the repository **private** (code/business info is proprietary).
- [ ] Protect the production branch (require review before merge/deploy).
- [ ] Enable secret scanning and Dependabot (GitHub → Settings → Code security).
- [ ] Review changes before deploying; prefer preview deployments.
- [ ] Store all production secrets only in the host dashboard (encrypted).

## 5. Data handling

- [x] Contact form collects only what is needed to respond.
- [x] Privacy Policy template documents collection, purpose, storage, sharing,
      retention, rights, and Nigerian data protection context.
- [ ] Finalise the Privacy Policy against actual practices and get it reviewed.
- [ ] Define and document a concrete retention period for enquiries.
- [ ] Document all processors (host, email provider) in the Privacy Policy.

## 6. Operational

- [ ] Back up the repository (and any future data store) regularly.
- [ ] Record the recovery procedure (see below).
- [ ] Monitor the receiving inbox for spam/abuse.
- [ ] Keep Cloudflare, Resend, and any dependencies up to date.

---

## Incident / recovery procedure

1. **Contain** — if a secret is exposed, revoke/rotate it immediately
   (Resend API key, host tokens).
2. **Assess** — check Cloudflare Analytics/Logs and the GitHub audit log for
   unexpected changes.
3. **Restore** — redeploy the last known-good commit; the site is static, so
   rollback is a single redeploy. Restore any data store from its latest backup.
4. **Notify** — if personal data was affected, follow applicable legal and
   regulatory obligations (including under the Nigeria Data Protection Act).
5. **Review** — document what happened and update this checklist.
