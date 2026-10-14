/**
 * Cloudflare Pages Function — POST /api/contact
 * -----------------------------------------------------------------------------
 * Server-side handler for the website enquiry form.
 *
 * Security properties:
 *   - Server-side validation (never trust the browser).
 *   - Honeypot field rejection.
 *   - Per-IP rate limiting (best-effort, in-memory per isolate).
 *   - All email content is HTML-escaped before being placed in the email body.
 *   - Secrets are read from environment variables only (never hard-coded).
 *   - Safe, generic error responses; no stack traces are returned.
 *
 * Required environment variables (set in the Cloudflare Pages dashboard):
 *   RESEND_API_KEY     - API key from https://resend.com
 *   CONTACT_TO_EMAIL   - inbox that receives enquiries (e.g. info@yourdomain.com)
 *   CONTACT_FROM_EMAIL - verified sender (e.g. website@yourdomain.com)
 *
 * See README.md → "Contact form" for full setup instructions.
 */

const MAX = {
  name: 120,
  email: 200,
  phone: 40,
  company: 160,
  subject: 120,
  message: 5000,
};

// Simple in-memory rate limiter (per isolate). Resets on cold start.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const record = hits.get(ip) || [];
  const recent = record.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function clean(value, max) {
  if (typeof value !== "string") return "";
  // Remove control characters, trim, and cap length.
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ message: "Invalid request." }, 400);
  }

  // Honeypot — if filled, pretend nothing happened.
  if (data.company_website) {
    return json({ ok: true });
  }

  const name = clean(data.name, MAX.name);
  const email = clean(data.email, MAX.email).toLowerCase();
  const phone = clean(data.phone, MAX.phone);
  const company = clean(data.company, MAX.company);
  const subject = clean(data.subject, MAX.subject);
  const message = clean(data.message, MAX.message);

  if (!name || name.length < 2) {
    return json({ message: "Please provide your full name." }, 422);
  }
  if (!isEmail(email)) {
    return json({ message: "Please provide a valid email address." }, 422);
  }
  if (!subject) {
    return json({ message: "Please select a subject." }, 422);
  }
  if (!message || message.length < 10) {
    return json({ message: "Please provide a little more detail." }, 422);
  }

  // Basic header-injection guard for values used in subject lines.
  if (/[\r\n]/.test(subject) || /[\r\n]/.test(email)) {
    return json({ message: "Invalid characters detected." }, 422);
  }

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  if (rateLimited(ip)) {
    return json(
      { message: "Too many enquiries. Please try again in a minute." },
      429
    );
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = env;

  // Honest failure when the owner has not finished setup.
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    return json(
      {
        message:
          "Enquiry delivery is not configured on the server yet. Please try again later or contact us directly.",
      },
      503
    );
  }

  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "—"],
    ["Company", company || "—"],
    ["Subject", subject],
    ["Page", clean(data.page, 200) || "—"],
  ];

  const htmlBody = `
    <h2>New website enquiry</h2>
    <table cellpadding="6" cellspacing="0" border="0">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(
              value
            )}</td></tr>`
        )
        .join("")}
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `[Website enquiry] ${subject}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      return json(
        {
          message:
            "We could not send your enquiry right now. Please try again shortly.",
        },
        502
      );
    }

    return json({ ok: true });
  } catch {
    return json(
      {
        message:
          "We could not send your enquiry right now. Please try again shortly.",
      },
      502
    );
  }
}

export async function onRequest() {
  return json({ message: "Method not allowed." }, 405);
}
