/* ═══════════════════════════════════════════════════════════
   TanWeb Studio — WhatsApp, visual del caso 765 y reveals
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Red de seguridad: nada que empiece invisible puede quedarse invisible.
     Si IntersectionObserver no reporta (documento en segundo plano, prerender,
     pestaña oculta al cargar), igual se muestra todo. */
  function alVer(nodo, cb, opts) {
    var hecho = false;
    function correr() { if (hecho) return; hecho = true; cb(); }
    if (!("IntersectionObserver" in window) || document.visibilityState === "hidden") {
      correr();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.disconnect();
        correr();
      });
    }, opts || { threshold: 0.15 });
    io.observe(nodo);
    setTimeout(function () { io.disconnect(); correr(); }, 2500);
  }

  /* ── 1. Links de WhatsApp ───────────────────────────────── */
  (function whatsapp() {
    var cfg = window.TANWEB || {};
    var num = String(cfg.whatsapp || "").replace(/\D/g, "");

    if (!num || /^5490{6,}$/.test(num)) {
      console.warn("[TanWeb] Falta configurar el número de WhatsApp en /assets/js/config.js");
    }

    document.querySelectorAll("[data-wa]").forEach(function (a) {
      var msg = a.getAttribute("data-wa") || "";
      if (cfg.firma) msg += "\n\n" + cfg.firma;
      a.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(msg);
      a.target = "_blank";
      a.rel = "noopener";
    });
  })();

  /* ── 2. Contador del total de lotes mapeados ────────────── */
  (function contador() {
    var n = document.getElementById("bigNum");
    if (!n || reduce) return;

    var META = 1367;                                   // total real para P&C
    var fin = META.toLocaleString("es-AR");             // "1.367"

    alVer(n, function () {
      /* Sin rAF (pestaña en segundo plano) el número quedaría clavado en 0:
         el dato más fuerte de la página no se anima, se muestra. */
      if (document.visibilityState === "hidden" || !window.requestAnimationFrame) {
        n.textContent = fin;
        return;
      }
      var t0 = null, dur = 1400;
      function paso(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        n.textContent = Math.round(META * (1 - Math.pow(1 - p, 3))).toLocaleString("es-AR");
        if (p < 1) requestAnimationFrame(paso);
        else n.textContent = fin;
      }
      n.textContent = "0";
      requestAnimationFrame(paso);
      setTimeout(function () { n.textContent = fin; }, 2600);  // red de seguridad
    }, { threshold: 0.5 });
  })();

  /* ── 3. Reveals ─────────────────────────────────────────── */
  (function reveals() {
    if (reduce || !("IntersectionObserver" in window) || document.visibilityState === "hidden") return;

    var targets = document.querySelectorAll(
      ".sec .h2, .sec .lead, .vs__card, .obra, .tier, .caso__copy, .credit, .faq__item, .cta__box, .stats"
    );
    targets.forEach(function (t) { t.classList.add("rv"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });

    targets.forEach(function (t) { io.observe(t); });

    /* Si por lo que sea el observer nunca reporta, mostrar todo igual:
       más vale perder la animación que perder media página. */
    setTimeout(function () {
      io.disconnect();
      targets.forEach(function (t) { t.classList.add("is-in"); });
    }, 2500);
  })();

  /* ── 4. WhatsApp flotante ───────────────────────────────── */
  (function flotante() {
    var wa = document.getElementById("waFloat");
    var cta = document.getElementById("contacto");
    if (!wa) return;

    var pedido = false;
    function evaluar() {
      pedido = false;
      /* Se esconde arriba de todo (el hero ya tiene su CTA) y cuando el
         bloque de contacto final entra en pantalla, para no duplicar. */
      var arriba = window.scrollY < 520;
      var sobreCta = false;
      if (cta) {
        var r = cta.getBoundingClientRect();
        sobreCta = r.top < window.innerHeight * 0.85 && r.bottom > 0;
      }
      wa.classList.toggle("is-off", arriba || sobreCta);
    }
    function alScroll() {
      if (pedido) return;
      pedido = true;
      /* rAF sólo sirve con la pestaña visible; si no, el throttle nunca
         se destraba y el botón queda congelado en el último estado. */
      if (window.requestAnimationFrame && document.visibilityState === "visible") {
        window.requestAnimationFrame(evaluar);
      } else {
        evaluar();
      }
    }

    evaluar();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
  })();

  /* ── 5. Año del footer ──────────────────────────────────── */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
