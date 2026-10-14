/* =============================================================================
 * DYKESTRATA SERVICES LIMITED — Site behaviour
 * -----------------------------------------------------------------------------
 * Vanilla JavaScript only. No framework, no third-party runtime dependencies.
 * All user-supplied values are inserted with textContent / safe DOM APIs — no
 * innerHTML with untrusted data.
 * ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.DYKESTRATA_CONFIG || {};
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------------------------------------------------------------------
   * Small helpers
   * ------------------------------------------------------------------------ */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call(
      (scope || document).querySelectorAll(selector)
    );
  }

  function get(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  /* ---------------------------------------------------------------------------
   * 1. Bind central config values into the DOM (data-bind="a.b.c")
   * ------------------------------------------------------------------------ */
  function applyBindings() {
    $$("[data-bind]").forEach(function (el) {
      var value = get(CONFIG, el.getAttribute("data-bind"));
      if (value === undefined || value === null || value === "") return;

      var type = el.getAttribute("data-bind-type");
      if (el.tagName === "A") {
        if (type === "email") {
          el.href = "mailto:" + value;
        } else if (type === "phone") {
          el.href = "tel:" + String(value).replace(/[^\d+]/g, "");
        } else if (type === "whatsapp") {
          el.href = "https://wa.me/" + String(value).replace(/[^\d]/g, "");
        } else if (type === "url") {
          el.href = value;
        }
      }

      // Only overwrite visible text when the element is not an icon-only link.
      if (el.getAttribute("data-bind-mode") !== "attribute") {
        el.textContent = value;
      }
      el.classList.remove("is-placeholder");
      el.removeAttribute("title");
    });

    // Hide social links that have no configured URL.
    $$("[data-social]").forEach(function (el) {
      var value = get(CONFIG, "social." + el.getAttribute("data-social"));
      if (!value) {
        el.remove();
      } else {
        el.href = value;
      }
    });
  }

  /* ---------------------------------------------------------------------------
   * 2. Header shadow + mobile navigation
   * ------------------------------------------------------------------------ */
  function initHeader() {
    var header = $("#site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    var toggle = $("#navToggle");
    var nav = $("#primaryNav");
    if (!toggle || !nav) return;

    function openNav() {
      toggle.setAttribute("aria-expanded", "true");
      nav.classList.add("is-open");
      document.body.classList.add("nav-open");
    }

    function closeNav() {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    }

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    toggle.addEventListener("click", function () {
      isOpen() ? closeNav() : openNav();
    });

    // Close when a link is followed.
    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    // Close on Escape and return focus to the toggle.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        closeNav();
        toggle.focus();
      }
    });

    // Close when clicking outside the nav.
    document.addEventListener("click", function (event) {
      if (
        isOpen() &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        closeNav();
      }
    });

    // Reset menu state when resizing back to desktop.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 940 && isOpen()) closeNav();
    });
  }

  /* ---------------------------------------------------------------------------
   * 3. Mark the current page in the navigation
   * ------------------------------------------------------------------------ */
  function initActiveNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    $$("#primaryNav a").forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href) return;
      var target = href.split("#")[0];
      if (target && target === path) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------------------------------------------------------------------
   * 4. Reveal-on-scroll (respects reduced motion)
   * ------------------------------------------------------------------------ */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------------------
   * 5. Back-to-top button
   * ------------------------------------------------------------------------ */
  function initBackToTop() {
    var btn = $("#backToTop");
    if (!btn) return;

    var onScroll = function () {
      btn.classList.toggle("is-visible", window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  /* ---------------------------------------------------------------------------
   * 6. Footer year
   * ------------------------------------------------------------------------ */
  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------------------------------------------------------------------------
   * 7. Contact form
   * ------------------------------------------------------------------------ */
  function initContactForm() {
    var form = $("#contactForm");
    if (!form) return;

    var statusEl = $("#formStatus");
    var submitBtn = $("#contactSubmit");
    var submitLabel = submitBtn ? $(".btn-label", submitBtn) : null;
    var configured =
      CONFIG.contactForm && CONFIG.contactForm.configured === true;
    var endpoint =
      (CONFIG.contactForm && CONFIG.contactForm.endpoint) || "/api/contact";

    var rules = {
      name: { required: true, min: 2 },
      email: { required: true, email: true },
      phone: { required: false },
      company: { required: false },
      subject: { required: true },
      message: { required: true, min: 10 },
    };

    function setStatus(state, message) {
      if (!statusEl) return;
      statusEl.setAttribute("data-state", state);
      statusEl.textContent = message;
      statusEl.classList.add("is-visible");
    }

    function clearStatus() {
      if (!statusEl) return;
      statusEl.classList.remove("is-visible");
      statusEl.textContent = "";
    }

    function fieldError(name, message) {
      var input = form.elements[name];
      var errorEl = form.querySelector('[data-error-for="' + name + '"]');
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) {
        errorEl.textContent = message || "";
        errorEl.classList.toggle("is-visible", Boolean(message));
      }
    }

    function validateField(name) {
      var rule = rules[name];
      if (!rule) return true;
      var input = form.elements[name];
      if (!input) return true;
      var value = (input.value || "").trim();

      if (rule.required && !value) {
        fieldError(name, "This field is required.");
        return false;
      }
      if (!value) {
        fieldError(name, "");
        return true;
      }
      if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        fieldError(name, "Please enter a valid email address.");
        return false;
      }
      if (rule.min && value.length < rule.min) {
        fieldError(
          name,
          "Please use at least " + rule.min + " characters."
        );
        return false;
      }
      fieldError(name, "");
      return true;
    }

    // Validate on blur / re-validate on input once touched.
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener("blur", function () {
        validateField(name);
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") validateField(name);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearStatus();

      // Honeypot: if the hidden field is filled, silently stop (bot).
      var honey = form.elements["company_website"];
      if (honey && honey.value) {
        return;
      }

      var valid = true;
      Object.keys(rules).forEach(function (name) {
        if (!validateField(name)) valid = false;
      });

      var consent = form.elements["consent"];
      if (consent && !consent.checked) {
        valid = false;
        var consentError = form.querySelector('[data-error-for="consent"]');
        if (consentError) {
          consentError.textContent =
            "Please confirm you have read the privacy notice.";
          consentError.classList.add("is-visible");
        }
      }

      if (!valid) {
        setStatus(
          "error",
          "Please correct the highlighted fields and try again."
        );
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Honest behaviour when no delivery backend is configured yet.
      if (!configured) {
        setStatus(
          "setup",
          "Enquiry delivery is not yet configured. The website owner must connect an email service (see README → Contact form) before messages can be sent. Your details were not submitted anywhere."
        );
        return;
      }

      // Simple client-side anti-spam throttle (server also rate-limits).
      var now = Date.now();
      var last = Number(window.localStorage.getItem("dks_last_submit") || 0);
      if (now - last < 30000) {
        setStatus(
          "error",
          "Please wait a moment before submitting another enquiry."
        );
        return;
      }

      var payload = {
        name: (form.elements.name.value || "").trim(),
        email: (form.elements.email.value || "").trim(),
        phone: (form.elements.phone.value || "").trim(),
        company: (form.elements.company.value || "").trim(),
        subject: (form.elements.subject.value || "").trim(),
        message: (form.elements.message.value || "").trim(),
        consent: true,
        page: window.location.pathname,
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: response.ok, status: response.status, data: data };
            });
        })
        .then(function (result) {
          if (result.ok) {
            window.localStorage.setItem("dks_last_submit", String(Date.now()));
            form.reset();
            setStatus(
              "success",
              "Thank you. Your enquiry has been received and our team will respond using the details you provided."
            );
            statusEl.focus();
          } else {
            setStatus(
              "error",
              result.data && result.data.message
                ? result.data.message
                : "We could not send your enquiry right now. Please try again shortly or contact us directly."
            );
          }
        })
        .catch(function () {
          setStatus(
            "error",
            "A network error occurred. Please check your connection and try again."
          );
        })
        .then(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("is-loading");
          }
          if (submitLabel) submitLabel.textContent = "Send enquiry";
        });
    });
  }

  /* ---------------------------------------------------------------------------
   * 8. Optional analytics — only when explicitly configured
   * ------------------------------------------------------------------------ */
  function initAnalytics() {
    var a = CONFIG.analytics;
    if (!a || a.enabled !== true || !a.measurementId) return;

    if (a.provider === "plausible") {
      var s = document.createElement("script");
      s.defer = true;
      s.setAttribute("data-domain", a.measurementId);
      s.src = "https://plausible.io/js/script.js";
      document.head.appendChild(s);
    } else if (a.provider === "ga4") {
      var g = document.createElement("script");
      g.async = true;
      g.src =
        "https://www.googletagmanager.com/gtag/js?id=" + a.measurementId;
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", a.measurementId);
    }
  }

  /* ---------------------------------------------------------------------------
   * 9. Footer legal "requires review" notice for unreviewed templates
   * ------------------------------------------------------------------------ */
  function initTemplateNotices() {
    var pending = CONFIG.templateReviewPending !== false;
    if (!pending) {
      $$("[data-template-notice]").forEach(function (el) {
        el.remove();
      });
    }
  }

  /* ---------------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------------ */
  function init() {
    applyBindings();
    initHeader();
    initActiveNav();
    initReveal();
    initBackToTop();
    initYear();
    initContactForm();
    initAnalytics();
    initTemplateNotices();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
