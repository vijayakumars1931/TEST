/* ==========================================================================
   SPADEEVENTZZ — interactions
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Header state
     --------------------------------------------------------------------- */
  const header = $(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------------------- */
  const navToggle = $(".nav-toggle");
  const mobileMenu = $("#mobile-menu");

  function setMenu(open) {
    document.body.classList.toggle("nav-open", open);
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (mobileMenu) mobileMenu.setAttribute("aria-hidden", String(!open));
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      setMenu(!document.body.classList.contains("nav-open"));
    });
    $$("a", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------------------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------------------------------------------------------------------
     Animated counters
     --------------------------------------------------------------------- */
  const counters = $$("[data-count]");
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function runCounter(el) {
    const target = parseFloat(el.dataset.count) || 0;
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reducedMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = target * easeOut(progress);
      el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toString();
    };
    requestAnimationFrame(tick);
  }

  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const counterIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              counterIO.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => counterIO.observe(el));
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------------------------------------------------------------------
     Hero pointer glow
     --------------------------------------------------------------------- */
  const hero = $(".hero");
  const heroBg = $(".hero-bg");
  if (hero && heroBg && window.matchMedia("(pointer: fine)").matches && !reducedMotion) {
    let raf = null;
    hero.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        heroBg.style.setProperty("--mx", x + "%");
        heroBg.style.setProperty("--my", y + "%");
        raf = null;
      });
    });
  }

  /* ---------------------------------------------------------------------
     Gallery filter
     --------------------------------------------------------------------- */
  const filterButtons = $$("[data-filter]");
  const gallery = $("#gallery");
  const works = $$(".work", gallery || document);
  const galleryEmpty = document.createElement("p");
  galleryEmpty.className = "gallery-empty";
  galleryEmpty.textContent = "Nothing here yet — check back soon.";
  galleryEmpty.hidden = true;
  if (gallery) gallery.after(galleryEmpty);

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filterButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      let visible = 0;
      works.forEach((work) => {
        const show = filter === "all" || work.dataset.cat === filter;
        work.hidden = !show;
        if (show) visible++;
      });

      if (gallery) {
        gallery.classList.toggle("is-filtered", filter !== "all");
        gallery.dataset.count = String(visible);
      }
      galleryEmpty.hidden = visible !== 0;
      galleryEmpty.textContent = "Nothing here yet — check back soon.";
    });
  });

  /* ---------------------------------------------------------------------
     FAQ accordion
     --------------------------------------------------------------------- */
  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => {
    const btn = $(".faq-q", item);
    const panel = $(".faq-a", item);
    if (!btn || !panel) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      faqItems.forEach((other) => {
        other.classList.remove("is-open");
        const otherBtn = $(".faq-q", other);
        const otherPanel = $(".faq-a", other);
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        if (otherPanel) otherPanel.setAttribute("inert", "");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        panel.removeAttribute("inert");
      }
    });
  });

  /* ---------------------------------------------------------------------
     Dialogs
     --------------------------------------------------------------------- */
  const leadDialog = $("#lead-dialog");
  const leadForm = $("#lead-form");
  const leadSuccess = $("#lead-success");
  const leadReset = $("#lead-reset");
  const typeSelect = $("#lead-type");
  const messageField = $("#lead-message");
  let lastTrigger = null;

  function openLeadModal(trigger) {
    if (!leadDialog) return;
    lastTrigger = trigger || null;

    if (leadForm && leadSuccess) {
      leadForm.hidden = false;
      leadSuccess.hidden = true;
    }

    if (trigger) {
      const eventType = trigger.dataset.event;
      const pkg = trigger.dataset.package;
      if (eventType && typeSelect) typeSelect.value = eventType;
      if (pkg && messageField && !messageField.value) {
        messageField.value = "Interested in " + pkg + ".";
      }
    }

    if (document.body.classList.contains("nav-open")) setMenu(false);

    if (typeof leadDialog.showModal === "function") {
      leadDialog.showModal();
      document.body.classList.add("modal-open");
      const firstField = $("#lead-name");
      if (firstField && window.matchMedia("(pointer: fine)").matches) {
        setTimeout(() => firstField.focus(), 80);
      }
    }
  }

  function closeLeadModal() {
    if (leadDialog && leadDialog.open) leadDialog.close();
  }

  $$(".js-open-modal").forEach((btn) => {
    btn.addEventListener("click", () => openLeadModal(btn));
  });

  if (leadDialog) {
    $$("[data-close-modal]", leadDialog).forEach((btn) => {
      btn.addEventListener("click", closeLeadModal);
    });
    leadDialog.addEventListener("click", (e) => {
      if (e.target === leadDialog) closeLeadModal();
    });
    leadDialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
  }

  if (leadReset) {
    leadReset.addEventListener("click", () => {
      if (leadForm) {
        leadForm.reset();
        leadForm.hidden = false;
        $$(".field.has-error", leadForm).forEach((f) => f.classList.remove("has-error"));
        const submit = $(".submit-btn", leadForm);
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = 'Send enquiry <span class="arrow" aria-hidden="true">↗</span>';
        }
      }
      if (leadSuccess) leadSuccess.hidden = true;
      const firstField = $("#lead-name");
      if (firstField) firstField.focus();
    });
  }

  /* ---------------------------------------------------------------------
     Lead form validation
     --------------------------------------------------------------------- */
  if (leadForm) {
    const fields = {
      name: { el: $("#lead-name"), test: (v) => v.trim().length >= 2 },
      phone: { el: $("#lead-phone"), test: (v) => /^\+?[\d\s()-]{8,18}$/.test(v.trim()) && v.replace(/\D/g, "").length >= 8 },
      eventType: { el: $("#lead-type"), test: (v) => v !== "" },
    };

    // Event date cannot be in the past
    const dateInput = $("#lead-date");
    if (dateInput) {
      const today = new Date();
      const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      dateInput.min = iso;
    }

    Object.values(fields).forEach(({ el }) => {
      if (!el) return;
      el.addEventListener("input", () => {
        const wrap = el.closest(".field");
        if (wrap) wrap.classList.remove("has-error");
        el.removeAttribute("aria-invalid");
      });
      el.addEventListener("change", () => {
        const wrap = el.closest(".field");
        if (wrap) wrap.classList.remove("has-error");
        el.removeAttribute("aria-invalid");
      });
    });

    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;

      Object.values(fields).forEach(({ el, test }) => {
        if (!el) return;
        const wrap = el.closest(".field");
        const ok = test(el.value);
        if (!ok) {
          valid = false;
          if (wrap) wrap.classList.add("has-error");
          el.setAttribute("aria-invalid", "true");
          if (!firstInvalid) firstInvalid = el;
        }
      });

      // honeypot
      const hp = $("#lead-company");
      if (hp && hp.value) return;

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const submit = $(".submit-btn", leadForm);
      const formData = new FormData(leadForm);
      const endpoint = leadForm.getAttribute("data-endpoint");

      if (submit) {
        submit.disabled = true;
        submit.textContent = "Sending…";
      }

      const showSuccess = () => {
        leadForm.hidden = true;
        if (leadSuccess) {
          leadSuccess.hidden = false;
          const heading = $("h3", leadSuccess);
          if (heading) heading.focus?.();
        }
        leadForm.reset();
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = 'Send enquiry <span class="arrow" aria-hidden="true">↗</span>';
        }
      };

      try {
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: formData,
          });
          if (!res.ok) throw new Error("Request failed");
        } else {
          await new Promise((resolve) => setTimeout(resolve, 850));
        }
        showSuccess();
      } catch (err) {
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = 'Try again <span class="arrow" aria-hidden="true">↗</span>';
        }
        alert("Something went wrong sending your enquiry. Please call or email us instead.");
      }
    });
  }

  /* ---------------------------------------------------------------------
     Lightbox
     --------------------------------------------------------------------- */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightbox-img");
  const lightboxCap = $("#lightbox-cap");

  function openLightbox(btn) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = btn.dataset.full || "";
    lightboxImg.alt = btn.getAttribute("aria-label") || "";
    if (lightboxCap) lightboxCap.textContent = btn.dataset.caption || "";
    lightbox.showModal();
    document.body.classList.add("modal-open");
  }

  $$(".js-lightbox").forEach((btn) => {
    btn.addEventListener("click", () => openLightbox(btn));
  });

  if (lightbox) {
    $$("[data-close-lightbox]", lightbox).forEach((btn) => {
      btn.addEventListener("click", () => lightbox.close());
    });
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      if (lightboxImg) lightboxImg.src = "";
    });
  }

  // Keep body lock consistent if dialogs close via Escape
  if (leadDialog) {
    leadDialog.addEventListener("close", () => {
      if (!document.body.classList.contains("nav-open")) document.body.style.overflow = "";
    });
  }

  /* ---------------------------------------------------------------------
     Newsletter
     --------------------------------------------------------------------- */
  const newsForm = $("#news-form");
  const newsMsg = $("#news-msg");
  if (newsForm && newsMsg) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#news-email", newsForm);
      const value = input ? input.value.trim() : "";
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      if (!valid) {
        newsMsg.textContent = "Please enter a valid email address.";
        newsMsg.style.color = "#ff8a6b";
        if (input) input.focus();
        return;
      }
      newsMsg.style.color = "";
      newsMsg.textContent = "You're on the list. Look out for the next Lookbook. ♠";
      newsForm.reset();
    });
  }

  /* ---------------------------------------------------------------------
     Scroll spy for primary nav
     --------------------------------------------------------------------- */
  const spyLinks = $$(".nav-links a");
  const spySections = spyLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id && id.startsWith("#") ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if (spySections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          spyLinks.forEach((link) => {
            const active = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    spySections.forEach((section) => spy.observe(section));
  }

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
