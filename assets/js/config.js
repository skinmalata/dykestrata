/* =============================================================================
 * DYKESTRATA SERVICES LIMITED — Central site configuration
 * -----------------------------------------------------------------------------
 * THIS IS THE SINGLE PLACE TO EDIT KEY BUSINESS DETAILS.
 *
 * Verified company details (from the Certificate of Incorporation) are already
 * filled in below. Anything marked  <-- TO BE PROVIDED  is a placeholder and
 * must be confirmed by the company before launch. See COMPANY-INFO-REQUIRED.md.
 *
 * How updates flow through the website:
 *   - Values here are injected into any element carrying a data-bind attribute,
 *     e.g. <span data-bind="contact.email"> ... </span>
 *   - Empty contact values fall back to the visible placeholder text already in
 *     the HTML, so nothing breaks if a detail is missing.
 * ========================================================================== */
window.DYKESTRATA_CONFIG = {
  /* ---- Verified legal / registration details (do not change) -------------- */
  company: {
    legalName: "DYKESTRATA SERVICES LIMITED",
    shortName: "DYKESTRATA",
    registrationNumber: "9931890",
    country: "Federal Republic of Nigeria",
    legislation: "Companies and Allied Matters Act 2020",
    incorporationDate: "2026-10-13", // 13 October 2026
    companyType: "Private company limited by shares",
  },

  /* ---- Contact details ----------------------------------------------------
   * Leave a value as "" until the company confirms it. The site will show a
   * clearly-marked placeholder instead of inventing information.            */
  contact: {
    email: "dykestrata@gmail.com", // confirmed by the company
    phone: "", // e.g. "+234 800 000 0000"              <-- TO BE PROVIDED
    whatsapp: "", // e.g. "2348000000000" (digits only)  <-- TO BE PROVIDED
    addressLine: "", // e.g. "12 Example Street, Lagos"   <-- TO BE PROVIDED
    city: "", // e.g. "Lagos"
    state: "", // e.g. "Lagos State"
    country: "Nigeria",
    hours: "", // e.g. "Mon–Fri, 9:00–17:00 WAT"          <-- TO BE PROVIDED
  },

  /* ---- Social media (leave blank to hide the link) ----------------------- */
  social: {
    linkedin: "",
    x: "",
    facebook: "",
    instagram: "",
  },

  /* ---- Site / SEO -------------------------------------------------------- */
  site: {
    // Production URL — used for canonical links & sitemap. Update on launch.
    url: "https://www.dykestrata.example",
    defaultTitle:
      "DYKESTRATA SERVICES LIMITED — Subsurface Services in Nigeria",
    defaultDescription:
      "DYKESTRATA SERVICES LIMITED (RC 9931890) provides subsurface, environmental and oil and gas services in Nigeria: seismic acquisition, processing and interpretation; field development and prospectivity studies; petrophysics; pore pressure and geomechanics; environmental services; and oil and gas facilities and project support.",
  },

  /* ---- Contact form ------------------------------------------------------
   * The form posts JSON to `endpoint`. In production this is handled by the
   * Cloudflare Pages Function at functions/api/contact.js.
   *
   * Set `configured: true` ONLY after email delivery has actually been tested
   * end to end. While it is false the form shows an honest "setup required"
   * message instead of pretending an enquiry was delivered.                */
  contactForm: {
    endpoint: "/api/contact",
    configured: false, // <-- set to true once RESEND_API_KEY / notify email are configured
  },

  /* ---- Optional analytics (privacy-conscious) ----------------------------
   * No tracking is loaded unless enabled AND a real measurement ID is set.  */
  analytics: {
    enabled: false,
    provider: "", // e.g. "plausible" | "ga4"
    measurementId: "", // e.g. "G-XXXXXXXXXX" / "yourdomain.com"
  },

  /* ---- Feature flags -----------------------------------------------------
   * The Industries page is intentionally OFF until the company confirms the
   * sectors it actually serves. Flip to true (and enable the nav link) when
   * industries.html content has been approved.                             */
  features: {
    industriesPage: false,
  },
};
