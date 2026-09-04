(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================
     1. Animated particle-network background (canvas)
     ========================================================== */
  function initParticles() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var w, h, dpr, nodes, raf, running = true;
    var MAX_DIST = 140;

    function themeColor() {
      var v = getComputedStyle(document.documentElement).getPropertyValue("--accent-2").trim();
      return v || "#35c9b8";
    }
    function hexToRgb(hex) {
      hex = hex.replace("#", "");
      if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
      var num = parseInt(hex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(28, Math.min(80, Math.floor((w * h) / 22000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: 1.2 + Math.random() * 1.3
        });
      }
    }

    function step() {
      if (!running) return;
      var rgb = hexToRgb(themeColor());
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      for (var i2 = 0; i2 < nodes.length; i2++) {
        for (var j = i2 + 1; j < nodes.length; j++) {
          var a = nodes[i2], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            var alpha = (1 - dist / MAX_DIST) * 0.35;
            ctx.strokeStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var n2 = nodes[k];
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.75)";
        ctx.arc(n2.x, n2.y, n2.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    resize();
    if (reduceMotion) {
      step(); // paint a single static frame, no loop
      running = false;
    } else {
      step();
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden && !reduceMotion;
      if (running) { cancelAnimationFrame(raf); step(); }
    });
  }

  /* ==========================================================
     2. 3D tilt on cards
     ========================================================== */
  function initTilt() {
    if (reduceMotion) return;
    var cards = document.querySelectorAll(".card, .project-card");
    cards.forEach(function (card) {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "1";
      card.style.transformStyle = "preserve-3d";
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rotY = (px - 0.5) * 10;
        var rotX = (0.5 - py) * 10;
        card.style.transition = "transform 60ms linear";
        card.style.transform =
          "perspective(900px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) translateY(-4px) translateZ(6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1)";
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0) translateZ(0)";
      });
    });
  }

  /* ==========================================================
     3. Page transitions — fetch-based swap with 3D blend
     ========================================================== */
  function initPageTransitions() {
    var main = document.getElementById("main");
    if (!main) return;
    var KNOWN = ["index.html", "about.html", "skills.html", "projects.html", "contact.html"];
    var inFlight = false;

    function samePageTarget(url) {
      var a = document.createElement("a");
      a.href = url;
      var file = a.pathname.split("/").pop() || "index.html";
      return KNOWN.indexOf(file) !== -1 ? file : null;
    }

    function playOut() {
      return new Promise(function (resolve) {
        if (reduceMotion) { resolve(); return; }
        main.classList.add("page-exit");
        setTimeout(resolve, 260);
      });
    }
    function playIn() {
      main.classList.remove("page-exit");
      main.classList.add("page-enter");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          main.classList.add("page-enter-active");
          setTimeout(function () {
            main.classList.remove("page-enter", "page-enter-active");
          }, 420);
        });
      });
    }

    function navigate(url, push) {
      if (inFlight) return;
      inFlight = true;
      fetch(url, { credentials: "same-origin" })
        .then(function (res) {
          if (!res.ok) throw new Error("fetch failed");
          return res.text();
        })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          var newMain = doc.getElementById("main");
          if (!newMain) throw new Error("no #main in fetched page");
          return playOut().then(function () {
            main.innerHTML = newMain.innerHTML;
            document.title = doc.title;
            if (push) history.pushState({ url: url }, "", url);
            playIn();
            if (window.VE && window.VE.initMainContent) window.VE.initMainContent();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          });
        })
        .catch(function () {
          window.location.href = url; // graceful fallback: real navigation
        })
        .finally(function () {
          inFlight = false;
        });
    }

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute("href");
      if (!href || href.indexOf("#") === 0 || href.indexOf("mailto:") === 0) return;
      var page = samePageTarget(a.href);
      if (!page) return; // external or unknown link — normal navigation
      e.preventDefault();
      navigate(page, true);
    });

    window.addEventListener("popstate", function () {
      var page = samePageTarget(window.location.href) || "index.html";
      navigate(page, false);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initParticles();
    initTilt();
    initPageTransitions();
  });

  window.VE = window.VE || {};
  window.VE.initTilt = initTilt;
})();
