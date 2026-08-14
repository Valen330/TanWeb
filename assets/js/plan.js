/* ═══════════════════════════════════════════════════════════
   Plano interactivo del hero.
   Geometría real: los lotes son polígonos y la superficie se
   calcula por fórmula del agrimensor (shoelace), no se inventa.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* 1 unidad del viewBox = 0.22 m. Con esto los lotes caen en
     rangos reales de loteo argentino (≈380–700 m²).            */
  var ESCALA = 0.22;

  /* Manzanas: rectángulos con posible descuelgue del borde
     inferior (skew) para que el plano no parezca una grilla.   */
  var MANZANAS = [
    {
      id: "A", x: 70, y: 84, w: 356, h: 214, cols: 5, rows: 2, skew: 0,
      estados: [
        "vendido", "vendido", "disponible", "disponible", "reservado",
        "vendido", "disponible", "disponible", "disponible", "vendido"
      ]
    },
    {
      id: "B", x: 596, y: 84, w: 294, h: 214, cols: 3, rows: 2, skew: 0,
      estados: [
        "disponible", "reservado", "disponible",
        "vendido", "disponible", "disponible"
      ]
    },
    {
      id: "C", x: 70, y: 396, w: 820, h: 118, cols: 8, rows: 1, skew: 38,
      estados: [
        "vendido", "vendido", "reservado", "disponible",
        "disponible", "disponible", "reservado", "disponible"
      ]
    }
  ];

  var ESTADO_TXT = {
    disponible: "Disponible",
    reservado: "Reservado",
    vendido: "Vendido"
  };

  /* ── helpers ───────────────────────────────────────────── */
  function el(name, attrs) {
    var n = document.createElementNS(SVG_NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* Fórmula de Gauss / shoelace: área exacta de un polígono */
  function area(pts) {
    var a = 0;
    for (var i = 0, n = pts.length; i < n; i++) {
      var j = (i + 1) % n;
      a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
    }
    return Math.abs(a) / 2;
  }

  function dist(p, q) {
    return Math.sqrt(Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2));
  }

  function nf(v, dec) {
    return v.toLocaleString("es-AR", {
      minimumFractionDigits: dec === undefined ? 1 : dec,
      maximumFractionDigits: dec === undefined ? 1 : dec
    });
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  /* ── construcción de lotes ─────────────────────────────── */
  function construir() {
    var lotes = [];
    var uid = 0;

    MANZANAS.forEach(function (m) {
      /* y del borde inferior de la manzana en la fracción t (0..1) */
      function fondoY(t) { return m.y + m.h + m.skew * t; }
      function yEn(t, rf) { return m.y + (fondoY(t) - m.y) * rf; }

      var n = 0;
      for (var r = 0; r < m.rows; r++) {
        for (var c = 0; c < m.cols; c++) {
          var t0 = c / m.cols, t1 = (c + 1) / m.cols;
          var r0 = r / m.rows, r1 = (r + 1) / m.rows;
          var x0 = m.x + m.w * t0, x1 = m.x + m.w * t1;

          var pts = [
            [x0, yEn(t0, r0)],
            [x1, yEn(t1, r0)],
            [x1, yEn(t1, r1)],
            [x0, yEn(t0, r1)]
          ];

          var m2 = area(pts) * ESCALA * ESCALA;
          n++;
          lotes.push({
            uid: uid++,
            mz: m.id,
            num: pad(n),
            pts: pts,
            estado: m.estados[n - 1] || "disponible",
            estadoBase: m.estados[n - 1] || "disponible",
            m2: m2,
            frente: dist(pts[0], pts[1]) * ESCALA,
            fondo: dist(pts[1], pts[2]) * ESCALA,
            cx: (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4,
            cy: (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4
          });
        }
      }
    });

    return lotes;
  }

  /* ── calles y anotaciones (capa muda) ──────────────────── */
  function dibujarCalles(g) {
    // Avenida vertical entre manzana A y B
    g.appendChild(el("rect", { x: 426, y: 60, width: 170, height: 262, "class": "street" }));
    g.appendChild(el("line", { x1: 511, y1: 68, x2: 511, y2: 314, "class": "street__mid" }));

    // Calle horizontal entre A/B y C
    g.appendChild(el("rect", { x: 40, y: 322, width: 880, height: 74, "class": "street" }));
    g.appendChild(el("line", { x1: 52, y1: 359, x2: 908, y2: 359, "class": "street__mid" }));

    var t1 = el("text", { x: 88, y: 345, "class": "street__lbl" });
    t1.textContent = "Calle Los Algarrobos";
    g.appendChild(t1);

    var t2 = el("text", { x: 511, y: 78, "class": "street__lbl", "text-anchor": "middle" });
    t2.textContent = "Av. Principal";
    g.appendChild(t2);

    // Rótulos de manzana
    [["A", 248, 74], ["B", 743, 74], ["C", 480, 386]].forEach(function (m) {
      var t = el("text", { x: m[1], y: m[2], "class": "mz__lbl", "text-anchor": "middle" });
      t.textContent = "MZ. " + m[0];
      g.appendChild(t);
    });
  }

  function dibujarNotas(g) {
    /* Norte */
    var nx = 906, ny = 40;
    g.appendChild(el("path", {
      d: "M" + nx + " " + (ny + 26) + " L" + nx + " " + ny + " M" + (nx - 5) + " " + (ny + 7) + " L" + nx + " " + ny + " L" + (nx + 5) + " " + (ny + 7),
      fill: "none", stroke: "#C69749", "stroke-width": "1.1", opacity: ".7"
    }));
    var tn = el("text", { x: nx, y: ny + 38, "class": "note", "text-anchor": "middle" });
    tn.textContent = "N";
    g.appendChild(tn);

    /* Escala gráfica */
    var sx = 70, sy = 578;
    g.appendChild(el("line", { x1: sx, y1: sy, x2: sx + 130, y2: sy, "class": "rule" }));
    [0, 65, 130].forEach(function (o) {
      g.appendChild(el("line", { x1: sx + o, y1: sy - 4, x2: sx + o, y2: sy + 4, "class": "rule" }));
    });
    var ts = el("text", { x: sx, y: sy + 16, "class": "note" });
    ts.textContent = "0" + "    " + "15 m" + "    " + "30 m";
    g.appendChild(ts);

    /* Cotas laterales del conjunto */
    g.appendChild(el("line", { x1: 46, y1: 84, x2: 46, y2: 298, "class": "rule" }));
    g.appendChild(el("line", { x1: 42, y1: 84, x2: 50, y2: 84, "class": "rule" }));
    g.appendChild(el("line", { x1: 42, y1: 298, x2: 50, y2: 298, "class": "rule" }));
    var tc = el("text", { x: 40, y: 196, "class": "note note--dim", "text-anchor": "middle", transform: "rotate(-90 40 196)" });
    tc.textContent = "47.08 m";
    g.appendChild(tc);

    /* Carátula tipo plano */
    var bx = 646, by = 540, bw = 244, bh = 54;
    g.appendChild(el("rect", { x: bx, y: by, width: bw, height: bh, fill: "none", stroke: "#C69749", "stroke-width": ".8", opacity: ".28" }));
    g.appendChild(el("line", { x1: bx, y1: by + 20, x2: bx + bw, y2: by + 20, stroke: "#C69749", "stroke-width": ".8", opacity: ".2" }));
    var r1 = el("text", { x: bx + 9, y: by + 14, "class": "note" });
    r1.textContent = "LOTEO DEMOSTRATIVO · TANWEB STUDIO";
    g.appendChild(r1);
    var r2 = el("text", { x: bx + 9, y: by + 34, "class": "note note--dim" });
    r2.textContent = "ESC 1:1500  LOTES 24  REV 03";
    g.appendChild(r2);
    var r3 = el("text", { x: bx + 9, y: by + 48, "class": "note note--dim" });
    r3.textContent = "SUP. TOTAL SEGÚN MENSURA";
    g.appendChild(r3);
  }

  /* ── init ──────────────────────────────────────────────── */
  var svg = document.getElementById("planSvg");
  if (!svg) return;

  var gLots = document.getElementById("planLots");
  var gStreets = document.getElementById("planStreets");
  var gNotes = document.getElementById("planNotes");
  var canvas = document.getElementById("planCanvas");
  var tip = document.getElementById("planTip");

  var fichaIdle = document.getElementById("fichaIdle");
  var fichaData = document.getElementById("fichaData");
  var fMz = document.getElementById("fMz");
  var fNum = document.getElementById("fNum");
  var fEstado = document.getElementById("fEstado");
  var fSup = document.getElementById("fSup");
  var fFrente = document.getElementById("fFrente");
  var fFondo = document.getElementById("fFondo");
  var fPartida = document.getElementById("fPartida");
  var fichaDisc = document.getElementById("fichaDisc");
  var btnReservar = document.getElementById("btnReservar");
  var hold = document.getElementById("hold");
  var holdTime = document.getElementById("holdTime");
  var holdFill = document.getElementById("holdFill");

  var kb = document.getElementById("planKb");

  var lotes = construir();
  var nodos = {};
  var sel = null;
  var kbFoco = null;
  var holdLote = null;
  var holdT = null;
  var holdRest = 0;

  var HOLD_SEG = 15 * 60; // 15:00 — igual que el hold real

  dibujarCalles(gStreets);
  dibujarNotas(gNotes);

  lotes.forEach(function (L) {
    var g = el("g", { "class": "lot lot--" + L.estado });
    g.dataset.uid = String(L.uid);

    var d = "M" + L.pts.map(function (p) { return p[0].toFixed(2) + " " + p[1].toFixed(2); }).join(" L") + " Z";

    var shape = el("path", { d: d, "class": "lot__shape" });
    g.appendChild(shape);

    var hatch = el("path", { d: d, "class": "lot__hatch", fill: "none" });
    g.appendChild(hatch);

    var num = el("text", { x: L.cx.toFixed(1), y: (L.cy + 4).toFixed(1), "class": "lot__num" });
    num.textContent = L.num;
    g.appendChild(num);

    gLots.appendChild(g);

    /* Botón real, transparente y sin pointer-events: el mouse sigue
       yendo al polígono del SVG, pero el foco de teclado es nativo.  */
    var b = document.createElement("button");
    b.type = "button";
    b.className = "kb__btn";
    b.dataset.uid = String(L.uid);
    kb.appendChild(b);

    nodos[L.uid] = { g: g, shape: shape, hatch: hatch, btn: b, lote: L };
    aplicarEstado(L.uid);
  });

  function aplicarEstado(uid) {
    var n = nodos[uid], L = n.lote;
    n.g.setAttribute("class", "lot lot--" + L.estado +
      (sel === uid ? " is-sel" : "") + (kbFoco === uid ? " is-kb" : ""));
    n.btn.setAttribute("aria-label",
      "Lote " + L.num + ", manzana " + L.mz + ", " + nf(L.m2, 0) +
      " metros cuadrados, " + ESTADO_TXT[L.estado]);
    n.btn.setAttribute("aria-pressed", sel === uid ? "true" : "false");
    if (L.estado === "vendido") {
      n.hatch.setAttribute("fill", "url(#hatchSold)");
    } else if (L.estado === "reservado") {
      n.hatch.setAttribute("fill", "url(#hatchRes)");
    } else {
      n.hatch.setAttribute("fill", "none");
    }
  }

  function contar() {
    var c = { disponible: 0, reservado: 0, vendido: 0 };
    lotes.forEach(function (L) { c[L.estado]++; });
    Object.keys(c).forEach(function (k) {
      var n = document.querySelector('[data-count="' + k + '"]');
      if (n) n.textContent = pad(c[k]);
    });
  }
  contar();

  /* ── tooltip ───────────────────────────────────────────── */
  function mostrarTip(L, evt) {
    tip.innerHTML =
      '<p class="tip__n">MZ. ' + L.mz + " · LOTE " + L.num + "</p>" +
      '<p class="tip__m">' + nf(L.m2, 1) + " m² · " + nf(L.frente, 1) + " × " + nf(L.fondo, 1) + " m</p>" +
      '<span class="tip__e" data-e="' + L.estado + '">' + ESTADO_TXT[L.estado] + "</span>";

    var r = canvas.getBoundingClientRect();
    var x, y;
    if (evt && evt.clientX !== undefined && evt.type !== "focus") {
      x = evt.clientX - r.left;
      y = evt.clientY - r.top;
    } else {
      // Foco por teclado: anclar al centroide del lote
      var sr = svg.getBoundingClientRect();
      var vb = svg.viewBox.baseVal;
      x = (sr.left - r.left) + (L.cx / vb.width) * sr.width;
      y = (sr.top - r.top) + (L.cy / vb.height) * sr.height;
    }
    tip.style.left = Math.max(78, Math.min(x, r.width - 78)) + "px";
    tip.style.top = Math.max(56, y) + "px";
    tip.classList.add("is-on");
  }
  function ocultarTip() { tip.classList.remove("is-on"); }

  /* ── ficha ─────────────────────────────────────────────── */
  function seleccionar(uid) {
    if (sel !== null && nodos[sel]) {
      var prev = sel; sel = null; aplicarEstado(prev);
    }
    sel = uid;
    aplicarEstado(uid);

    var L = nodos[uid].lote;
    fichaIdle.hidden = true;
    fichaData.hidden = false;

    fMz.textContent = "MANZANA " + L.mz;
    fNum.textContent = L.num;
    fEstado.textContent = ESTADO_TXT[L.estado];
    fEstado.setAttribute("data-e", L.estado);
    fSup.textContent = nf(L.m2, 1) + " m²";
    fFrente.textContent = nf(L.frente, 1) + " m";
    fFondo.textContent = nf(L.fondo, 1) + " m";

    var pre = (window.TANWEB && window.TANWEB.partidaPrefijo) || "23-04";
    fPartida.textContent = pre + "-" + L.mz + pad(Number(L.num));

    actualizarAcciones(L);
  }

  function actualizarAcciones(L) {
    var esHold = holdLote !== null && nodos[holdLote].lote.uid === L.uid;
    hold.hidden = !esHold;

    if (L.estado === "vendido") {
      btnReservar.disabled = true;
      btnReservar.textContent = "Lote vendido";
      fichaDisc.textContent = "En producción, el lote se marca como vendido desde el panel y el plano queda al día al instante.";
    } else if (esHold) {
      btnReservar.disabled = false;
      btnReservar.textContent = "Liberar la reserva";
      fichaDisc.textContent = "Demo: el hold libera el lote solo si la operación no avanza.";
    } else if (L.estado === "reservado") {
      btnReservar.disabled = true;
      btnReservar.textContent = "Reservado por otro interesado";
      fichaDisc.textContent = "Mientras hay un hold activo, nadie más puede tomar el mismo lote. Se acaban las ventas duplicadas.";
    } else {
      btnReservar.disabled = false;
      btnReservar.textContent = "Reservar este lote";
      fichaDisc.textContent = "Demo: así se comporta la reserva con hold temporal en producción.";
    }
  }

  /* ── hold temporal ─────────────────────────────────────── */
  function pintarHold() {
    var m = Math.floor(holdRest / 60), s = holdRest % 60;
    holdTime.textContent = pad(m) + ":" + pad(s);
    holdFill.style.transform = "scaleX(" + (holdRest / HOLD_SEG) + ")";
  }

  function iniciarHold(uid) {
    liberarHold(true);
    holdLote = uid;
    var L = nodos[uid].lote;
    L.estado = "reservado";
    aplicarEstado(uid);
    contar();
    holdRest = HOLD_SEG;
    pintarHold();
    holdT = setInterval(function () {
      holdRest--;
      if (holdRest <= 0) { liberarHold(); return; }
      pintarHold();
    }, 1000);
    if (sel === uid) { hold.hidden = false; actualizarAcciones(L); }
  }

  function liberarHold(silencioso) {
    if (holdT) { clearInterval(holdT); holdT = null; }
    if (holdLote !== null) {
      var n = nodos[holdLote];
      n.lote.estado = n.lote.estadoBase;
      var u = holdLote;
      holdLote = null;
      aplicarEstado(u);
      contar();
      if (!silencioso && sel === u) {
        actualizarAcciones(n.lote);
        fEstado.textContent = ESTADO_TXT[n.lote.estado];
        fEstado.setAttribute("data-e", n.lote.estado);
        fichaDisc.textContent = "El hold venció y el lote volvió a estar disponible solo. Sin llamar a nadie.";
      }
    }
    hold.hidden = true;
  }

  btnReservar.addEventListener("click", function () {
    if (sel === null) return;
    var L = nodos[sel].lote;
    if (holdLote === sel) {
      liberarHold(true);
      L.estado = L.estadoBase;
      aplicarEstado(sel);
      contar();
      fEstado.textContent = ESTADO_TXT[L.estado];
      fEstado.setAttribute("data-e", L.estado);
      actualizarAcciones(L);
    } else if (L.estado === "disponible") {
      iniciarHold(sel);
      fEstado.textContent = ESTADO_TXT[L.estado];
      fEstado.setAttribute("data-e", L.estado);
    }
  });

  /* ── eventos del plano ─────────────────────────────────── */
  gLots.addEventListener("mouseover", function (e) {
    var g = e.target.closest(".lot"); if (!g) return;
    mostrarTip(nodos[g.dataset.uid].lote, e);
  });
  gLots.addEventListener("mousemove", function (e) {
    var g = e.target.closest(".lot"); if (!g) return;
    mostrarTip(nodos[g.dataset.uid].lote, e);
  });
  gLots.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(".lot")) ocultarTip();
  });
  gLots.addEventListener("click", function (e) {
    var g = e.target.closest(".lot"); if (!g) return;
    seleccionar(Number(g.dataset.uid));
  });
  svg.addEventListener("mouseleave", ocultarTip);

  /* ── capa de teclado ───────────────────────────────────── */
  function ubicarBotones() {
    var cr = canvas.getBoundingClientRect();
    var sr = svg.getBoundingClientRect();
    kb.style.left = (sr.left - cr.left) + "px";
    kb.style.top = (sr.top - cr.top) + "px";
    kb.style.width = sr.width + "px";
    kb.style.height = sr.height + "px";

    var vb = svg.viewBox.baseVal;
    lotes.forEach(function (L) {
      var xs = L.pts.map(function (p) { return p[0]; });
      var ys = L.pts.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var b = nodos[L.uid].btn.style;
      b.left = (x0 / vb.width * 100) + "%";
      b.top = (y0 / vb.height * 100) + "%";
      b.width = ((x1 - x0) / vb.width * 100) + "%";
      b.height = ((y1 - y0) / vb.height * 100) + "%";
    });
  }

  kb.addEventListener("focusin", function (e) {
    var b = e.target.closest(".kb__btn"); if (!b) return;
    var uid = Number(b.dataset.uid);
    kbFoco = uid;
    aplicarEstado(uid);
    mostrarTip(nodos[uid].lote, { type: "focus" });
  });
  kb.addEventListener("focusout", function (e) {
    var b = e.target.closest(".kb__btn"); if (!b) return;
    var uid = Number(b.dataset.uid);
    if (kbFoco === uid) { kbFoco = null; aplicarEstado(uid); }
    ocultarTip();
  });
  kb.addEventListener("click", function (e) {
    var b = e.target.closest(".kb__btn"); if (!b) return;
    seleccionar(Number(b.dataset.uid));
  });

  ubicarBotones();
  if ("ResizeObserver" in window) {
    new ResizeObserver(ubicarBotones).observe(canvas);
  } else {
    window.addEventListener("resize", ubicarBotones);
  }

  /* Selección inicial: un lote disponible, para que la ficha
     no arranque vacía en pantallas grandes. En mobile la ficha
     queda debajo del plano, así que se deja en estado idle.    */
  if (window.matchMedia("(min-width: 981px)").matches) {
    for (var k = 0; k < lotes.length; k++) {
      if (lotes[k].estado === "disponible") { seleccionar(lotes[k].uid); break; }
    }
  }
})();
