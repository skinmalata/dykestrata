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
   * 4b. Hero service slider — autoplay, pause on hover/focus, reduced-motion
   *     aware, keyboard + swipe support.
   * ------------------------------------------------------------------------ */
  function initHeroSlider() {
    var root = $("#heroSlider");
    if (!root) return;

    var slides = $$(".hero-slide", root);
    var visuals = $$(".hero-slide-visual", root);
    var dots = $$("[data-hero-dot]", root);
    var prevBtn = $("[data-hero-prev]", root);
    var nextBtn = $("[data-hero-next]", root);
    var toggleBtn = $("[data-hero-toggle]", root);
    var status = $("#heroStatus");
    var total = slides.length;
    var interval = parseInt(root.getAttribute("data-interval"), 10) || 6500;
    var labels = [
      "Seismic acquisition, processing and interpretation",
      "Field development and prospectivity studies",
      "Petrophysics",
      "Pore pressure and geomechanics",
    ];

    var index = 0;
    var timer = null;
    var userPaused = false;
    var focusPaused = false;
    var hoverPaused = false;

    root.style.setProperty("--hero-interval", interval + "ms");

    if (reduceMotion) {
      root.classList.add("is-off");
      if (toggleBtn) toggleBtn.hidden = true;
    }

    function canRotate() {
      return total > 1 && !reduceMotion && !userPaused;
    }

    function restartProgress(dot) {
      var bar = dot.querySelector(".hero-dot__bar");
      if (!bar) return;
      bar.style.animation = "none";
      /* force reflow so the animation restarts from zero */
      void bar.offsetWidth;
      bar.style.animation = "";
    }

    function render(announce) {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      visuals.forEach(function (visual, i) {
        visual.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle("is-active", active);
        if (active) {
          dot.setAttribute("aria-current", "true");
          restartProgress(dot);
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      if (announce && status) {
        status.textContent =
          "Slide " + (index + 1) + " of " + total + ": " + labels[index] + ".";
      }
    }

    function goTo(nextIndex, announce) {
      index = ((nextIndex % total) + total) % total;
      render(announce !== false);
      syncPauseState();
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startTimer() {
      stopTimer();
      if (!canRotate() || document.hidden) return;
      timer = window.setInterval(function () {
        goTo(index + 1, false);
      }, interval);
    }

    function syncPauseState() {
      var paused = userPaused || focusPaused || hoverPaused;
      root.classList.toggle("is-paused", paused && !reduceMotion);
      if (paused) {
        stopTimer();
      } else {
        startTimer();
      }
    }

    function setPaused(paused) {
      userPaused = paused;
      if (toggleBtn) {
        toggleBtn.classList.toggle("is-paused", paused);
        toggleBtn.setAttribute("aria-pressed", paused ? "true" : "false");
        toggleBtn.setAttribute(
          "aria-label",
          paused ? "Play slideshow" : "Pause slideshow"
        );
      }
      syncPauseState();
    }

    if (total > 1) {
      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          goTo(index - 1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          goTo(index + 1);
        });
      }

      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          goTo(parseInt(dot.getAttribute("data-hero-dot"), 10) || 0);
        });
      });

      if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
          setPaused(!userPaused);
        });
      }

      root.addEventListener("pointerenter", function (event) {
        /* Only real hovering pointers pause — a tap on touch should not. */
        if (event.pointerType && event.pointerType !== "mouse") return;
        hoverPaused = true;
        syncPauseState();
      });
      root.addEventListener("pointerleave", function () {
        hoverPaused = false;
        syncPauseState();
      });
      root.addEventListener("focusin", function () {
        focusPaused = true;
        syncPauseState();
      });
      root.addEventListener("focusout", function (event) {
        if (!root.contains(event.relatedTarget)) {
          focusPaused = false;
          syncPauseState();
        }
      });

      document.addEventListener("visibilitychange", function () {
        syncPauseState();
      });

      root.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(index - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(index + 1);
        }
      });

      /* Basic horizontal swipe on the content area only. */
      var swipeArea = $(".hero-grid", root);
      var startX = null;
      var startY = null;

      if (swipeArea && window.PointerEvent) {
        swipeArea.addEventListener(
          "pointerdown",
          function (event) {
            /* Mouse drags are left alone so text can still be selected. */
            if (event.pointerType === "mouse") return;
            startX = event.clientX;
            startY = event.clientY;
          },
          { passive: true }
        );

        swipeArea.addEventListener(
          "pointerup",
          function (event) {
            if (startX === null || startY === null) return;
            var dx = event.clientX - startX;
            var dy = event.clientY - startY;
            startX = null;
            startY = null;
            if (Math.abs(dx) > 60 && Math.abs(dy) < 45) {
              goTo(dx < 0 ? index + 1 : index - 1);
            }
          },
          { passive: true }
        );
      }
    } else if (toggleBtn) {
      toggleBtn.hidden = true;
    }

    render(false);
    syncPauseState();
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
    initHeroSlider();
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
