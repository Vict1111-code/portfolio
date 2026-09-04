(function () {
  "use strict";

  /* ---------- Theme (bound once, persists across client-side page swaps) ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("ve-theme"); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var currentTheme = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", currentTheme);

  function updateToggleLabel(btn) {
    if (!btn) return;
    btn.textContent = currentTheme === "dark" ? "☀️" : "🌙";
    btn.setAttribute("aria-label", currentTheme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }

  /* ---------- Per-page behaviors: re-run after every content swap ---------- */
  function initMainContent() {
    /* Typewriter (hero role line — home page only) */
    var typeEl = document.querySelector("[data-typewriter]");
    if (typeEl && !typeEl.dataset.bound) {
      typeEl.dataset.bound = "1";
      var roles = JSON.parse(typeEl.getAttribute("data-roles") || "[]");
      var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion || roles.length === 0) {
        typeEl.textContent = roles[0] || "";
      } else {
        var textSpan = document.createElement("span");
        var cursor = document.createElement("span");
        cursor.className = "type-cursor";
        cursor.setAttribute("aria-hidden", "true");
        typeEl.textContent = "";
        typeEl.appendChild(textSpan);
        typeEl.appendChild(cursor);

        var roleIndex = 0, charIndex = 0, deleting = false;
        var typeSpeed = 55, deleteSpeed = 32, holdTime = 1400, gapTime = 350;

        (function tick() {
          var current = roles[roleIndex];
          if (!deleting) {
            charIndex++;
            textSpan.textContent = current.slice(0, charIndex);
            if (charIndex === current.length) {
              deleting = true;
              setTimeout(tick, holdTime);
              return;
            }
            setTimeout(tick, typeSpeed);
          } else {
            charIndex--;
            textSpan.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
              deleting = false;
              roleIndex = (roleIndex + 1) % roles.length;
              setTimeout(tick, gapTime);
              return;
            }
            setTimeout(tick, deleteSpeed);
          }
        })();
      }
    }

    /* Scroll reveal */
    var revealEls = document.querySelectorAll(".reveal:not(.is-visible)");
    if ("IntersectionObserver" in window && revealEls.length) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el, i) {
        el.style.setProperty("--i", i % 6);
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }

    /* Commit-log timeline (about page) */
    var tl = document.querySelector("[data-timeline]");
    if (tl) {
      if ("IntersectionObserver" in window) {
        var tio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { tl.classList.add("is-visible"); tio.unobserve(entry.target); }
          });
        }, { threshold: 0.2 });
        tio.observe(tl);
      } else {
        tl.classList.add("is-visible");
      }
    }

    /* Contact form */
    var form = document.querySelector("[data-contact-form]");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "1";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var status = form.querySelector("[data-form-status]");
        var email = "v68410811@gmail.com";
        var name = form.querySelector("#name").value || "there";
        var subject = encodeURIComponent("Portfolio contact from " + name);
        var body = encodeURIComponent(
          (form.querySelector("#message").value || "") +
            "\n\n— " + name + " (" + (form.querySelector("#email").value || "") + ")"
        );
        window.location.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;
        if (status) {
          status.textContent = "Opening your email client…";
          status.classList.add("ok");
        }
      });
    }

    /* Active nav link */
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav-links] a").forEach(function (a) {
      var href = a.getAttribute("href").split("/").pop();
      if (href === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    if (window.VE && window.VE.initTilt) window.VE.initTilt();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector("[data-theme-toggle]");
    updateToggleLabel(toggle);
    if (toggle) {
      toggle.addEventListener("click", function () {
        currentTheme = currentTheme === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", currentTheme);
        try { localStorage.setItem("ve-theme", currentTheme); } catch (e) {}
        updateToggleLabel(toggle);
      });
    }

    var navToggle = document.querySelector("[data-nav-toggle]");
    var navLinks = document.querySelector("[data-nav-links]");
    if (navToggle && navLinks) {
      navToggle.addEventListener("click", function () {
        var open = navLinks.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      navLinks.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          navLinks.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    initMainContent();
  });

  window.VE = window.VE || {};
  window.VE.initMainContent = initMainContent;
})();
