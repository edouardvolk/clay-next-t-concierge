/* Clay Next T LLC — interactions
   -------------------------------------------------------------------------
   1. Pointer-following cursor (dot + lagging ring, contextual states)
   2. Magnetic buttons
   3. 3D tilt on framed photographs
   4. Spotlight surfaces that track the pointer
   5. Scroll reveal + parallax + sticky header + mobile nav
   ------------------------------------------------------------------------- */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  /* ---- 1. Cursor -------------------------------------------------------- */

  function initCursor() {
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    var label = document.createElement("span");
    label.className = "label";
    ring.appendChild(label);
    document.body.append(dot, ring);

    var ringPos = { x: pointer.x, y: pointer.y };

    function frame() {
      // ease the ring toward the pointer — the "lag" that makes it feel alive
      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;
      dot.style.transform = "translate(" + pointer.x + "px," + pointer.y + "px)";
      ring.style.transform = "translate(" + ringPos.x + "px," + ringPos.y + "px)";
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    document.addEventListener("mouseleave", function () {
      dot.style.opacity = ring.style.opacity = "0";
    });
    document.addEventListener("mouseenter", function () {
      dot.style.opacity = ring.style.opacity = "1";
    });

    var hoverSel = "a, button, summary, input, textarea, select, [data-cursor]";
    document.addEventListener("pointerover", function (e) {
      var media = e.target.closest("[data-cursor-media]");
      var hot = e.target.closest(hoverSel);
      if (media) {
        document.body.classList.add("cursor-media");
        label.textContent = media.getAttribute("data-cursor-media") || "View";
      } else if (hot) {
        document.body.classList.add("cursor-hover");
      }
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest("[data-cursor-media]")) document.body.classList.remove("cursor-media");
      if (e.target.closest(hoverSel)) document.body.classList.remove("cursor-hover");
    });
  }

  /* ---- 2. Magnetic elements --------------------------------------------- */

  function initMagnets() {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 0.32;
      el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transition = "transform .12s linear";
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
      });
    });
  }

  /* ---- 3. Tilt ----------------------------------------------------------- */

  function initTilt() {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var max = parseFloat(el.getAttribute("data-tilt")) || 7;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform .15s linear";
        el.style.transform =
          "perspective(900px) rotateX(" + (-py * max) + "deg) rotateY(" + (px * max) + "deg)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform .8s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
      });
    });
  }

  /* ---- 4. Spotlight surfaces -------------------------------------------- */

  function initSpotlights() {
    var zones = document.querySelectorAll("[data-spotlight]");
    if (!zones.length) return;
    window.addEventListener("pointermove", function (e) {
      zones.forEach(function (zone) {
        var r = zone.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        zone.style.setProperty("--mx", (e.clientX - r.left) + "px");
        zone.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    }, { passive: true });
  }

  /* ---- 5. Reveal, parallax, header, nav ---------------------------------- */

  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  function initParallax() {
    var layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length || reduced) return;
    var ticking = false;
    function update() {
      var y = window.scrollY;
      layers.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.12;
        el.style.transform = "translate3d(0," + (y * speed).toFixed(2) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-stuck", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = header.querySelector(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      header.querySelectorAll(".nav a").forEach(function (a) {
        a.addEventListener("click", function () {
          document.body.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  function initCount() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        if (reduced) { el.textContent = target; return; }
        var start = performance.now(), dur = 1400;
        (function step(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  function initForm() {
    var form = document.querySelector("[data-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector("[data-form-status]");
      var btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      if (status) {
        status.textContent =
          "Thank you — your request has been noted. A concierge will reply within 24 hours.";
        status.style.color = "var(--gold-lit)";
      }
      form.reset();
    });
  }

  /* ---- boot -------------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", function () {
    document.documentElement.classList.add("js");

    if (fine) {
      window.addEventListener("pointermove", function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }, { passive: true });
      if (!reduced) { initCursor(); initMagnets(); initTilt(); }
      initSpotlights();
    }

    initReveal();
    initParallax();
    initHeader();
    initCount();
    initForm();
  });
})();
