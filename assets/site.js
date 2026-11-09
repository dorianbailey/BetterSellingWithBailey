/* Better Selling With Bailey: shared behavior for every page (mobile menu). */
(function () {
  var toggle = document.getElementById("nav-toggle");
  var panel = document.getElementById("nav-panel");
  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setOpen(!panel.classList.contains("is-open"));
  });
  panel.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1120) setOpen(false);
  }, { passive: true });
})();

/* Motion: nav shadow on scroll, gentle reveals, and count-up numbers.
   Skipped entirely for people who prefer reduced motion. */
(function () {
  var nav = document.querySelector(".site-nav");
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm) return;

  // The hero price tag: after it swings in, a touch or hover makes it sway again.
  var tag = document.querySelector(".hero-media .tag");
  if (tag) {
    tag.addEventListener("animationend", function (e) {
      if (e.animationName === "bsb-swing") tag.classList.add("settled");
      if (e.animationName === "bsb-sway") tag.classList.remove("sway");
    });
    tag.addEventListener("pointerenter", function () {
      if (tag.classList.contains("settled")) tag.classList.add("sway");
    });
  }

  if (!("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("js-motion");

  var groups = [".section-head", ".path", ".calc-results", ".steps li", ".price-card", ".pricing-side",
    ".ledger li", ".gallery figure", ".review", ".about-photo", ".about-text", ".event", ".events-empty",
    ".partners", ".faq-aside", ".faq-list", ".form-card", ".contact-direct", ".post-card", ".cta-box", ".proof-item"];
  var items = document.querySelectorAll(groups.join(","));
  Array.prototype.forEach.call(items, function (el) {
    el.classList.add("reveal");
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(groups.join(",")); });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i, 5) * 0.08 + "s");
  });

  // Count-up numbers: read once, held at zero until they scroll into view.
  var counters = [];
  Array.prototype.forEach.call(document.querySelectorAll(".proof-num"), function (el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3 || /–/.test(node.nodeValue)) return;
    var m = node.nodeValue.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    var c = { el: el, node: node, final: node.nodeValue, prefix: m[1], target: parseFloat(m[2]), suffix: m[3],
      decimals: (m[2].split(".")[1] || "").length, done: false };
    node.nodeValue = c.prefix + (0).toFixed(c.decimals) + c.suffix;
    counters.push(c);
  });
  // Safety net: never leave a number at zero.
  setTimeout(function () { counters.forEach(function (c) { if (!c.done) { c.done = true; c.node.nodeValue = c.final; } }); }, 4000);

  function countUp(el) {
    var c = counters.filter(function (x) { return x.el === el; })[0];
    if (!c || c.done) return;
    c.done = true;
    var node = c.node, prefix = c.prefix, target = c.target, suffix = c.suffix, decimals = c.decimals;
    var start = null, dur = 1100;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - p, 3);
      node.nodeValue = p < 1 ? prefix + (target * eased).toFixed(decimals) + suffix : c.final;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.classList.contains("proof-item")) countUp(e.target.querySelector(".proof-num"));
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  Array.prototype.forEach.call(items, function (el) { io.observe(el); });
})();
