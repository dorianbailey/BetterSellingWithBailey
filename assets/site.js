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

/* Lead source: remember how a visitor first found the site (Google, Facebook,
   a partner's link, a QR sign...) and attach it to every form they send, so
   each inquiry shows where it came from. Stored only in this browser. */
(function () {
  var KEY = "bsb_first_touch", info = null;
  try { info = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (!info) {
    var q = {}, host = "";
    location.search.replace(/^\?/, "").split("&").forEach(function (pair) {
      var kv = pair.split("=");
      if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || "").replace(/\+/g, " "));
    });
    try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) {}
    if (host === location.hostname.replace(/^www\./, "")) host = "";
    var source = q.utm_source ? [q.utm_source, q.utm_medium, q.utm_campaign].filter(Boolean).join(" / ")
      : q.ref ? "ref: " + q.ref
      : host || "direct";
    info = { source: source, page: location.pathname + location.search, date: new Date().toISOString().slice(0, 10) };
    try { localStorage.setItem(KEY, JSON.stringify(info)); } catch (e) {}
  }
  Array.prototype.forEach.call(document.querySelectorAll("form"), function (form) {
    [["lead_source", info.source], ["first_page", info.page], ["first_visit", info.date]].forEach(function (pair) {
      if (form.querySelector('[name="' + pair[0] + '"]')) return;
      var input = document.createElement("input");
      input.type = "hidden"; input.name = pair[0]; input.value = pair[1];
      form.appendChild(input);
    });
  });
})();

/* Small forms (sale alerts, partner referrals, the checklist): each sends to
   Dorian's Gmail through FormSubmit without leaving the page. */
(function () {
  var ENDPOINT = "https://formsubmit.co/ajax/bettersellingwithbailey@gmail.com";
  var PHONE = '<a href="tel:+18143238239">(814) 323-8239</a>';
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""); };
  var KINDS = {
    alerts: {
      check: function (d) { return emailOk(d.email) || d.phone ? "" : "Please add an email address or a mobile number."; },
      done: function () { return "You're on the list. You'll hear about the next sale first."; }
    },
    referral: {
      check: function (d) {
        if (!d.partner_name) return "Please add your name.";
        if (!d.client_name) return "Please add your client's name.";
        if (!d.client_phone && !emailOk(d.client_email)) return "Please add a phone number or email for your client.";
        return "";
      },
      done: function (d) { return "Thanks for the referral, " + d.partner_name.split(" ")[0] + "! I'll reach out to " + d.client_name.split(" ")[0] + " personally, usually the same day, and keep you posted."; }
    },
    friend: {
      check: function (d) {
        if (!d.name) return "Please add your name.";
        if (!d.phone && !emailOk(d.email)) return "Please add your phone or email, so I know where to send your $100.";
        if (!d.their_name) return "Please add their name.";
        if (!d.their_phone && !emailOk(d.their_email)) return "Please add a phone number or email for them.";
        return "";
      },
      done: function (d) { return "Thanks, " + d.name.split(" ")[0] + "! I'll reach out to " + d.their_name.split(" ")[0] + " soon. If their sale goes ahead, your $100 goes out within a week after it ends."; }
    },
    apply: {
      check: function (d) {
        if (!d.name) return "Please add your name.";
        if (!d.phone) return "Please add your mobile number so I can text you.";
        if (!d.age) return "Please choose your age.";
        if (d.age === "Under 16") return "Thanks for your interest! The job is for ages 16 and up, so please apply again once you turn 16.";
        return "";
      },
      done: function (d) { return "Thanks, " + d.name.split(" ")[0] + "! Your application is in. I'll text you soon to set up a quick call."; }
    },
    checklist: {
      check: function (d) { return emailOk(d.email) ? "" : "Please add your email address so I can send it."; },
      done: function () { return "Sent! Check your inbox for the checklist. Nothing there? Look in your spam folder, or call " + PHONE + "."; }
    }
  };

  Array.prototype.forEach.call(document.querySelectorAll("form[data-form]"), function (form) {
    var kind = KINDS[form.getAttribute("data-form")];
    if (!kind) return;
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var label = button ? button.textContent : "";
    function show(cls, msg) { if (!status) return; status.className = "form-status " + cls; status.innerHTML = msg; status.hidden = false; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) return;
      var data = {};
      Array.prototype.forEach.call(form.elements, function (f) {
        if (!f.name || f.name === "_honey") return;
        if (f.type === "checkbox") { if (f.checked) data[f.name] = data[f.name] ? data[f.name] + ", " + f.value : f.value; return; }
        if (f.type === "radio" && !f.checked) return;
        data[f.name] = (f.value || "").trim();
      });
      var problem = kind.check(data);
      if (problem) { show("err", problem); return; }
      var who = data.partner_name || data.name || data.email || data.phone || "";
      data._subject = (form.getAttribute("data-subject") || "New message from the website") + (who ? ": " + who : "");
      data._template = "table";
      if (form.getAttribute("data-autoresponse") && emailOk(data.email)) data._autoresponse = form.getAttribute("data-autoresponse");
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !(res.success === true || res.success === "true")) throw new Error("not sent");
          var keep = {};
          ["lead_source", "first_page", "first_visit"].forEach(function (n) { var el = form.querySelector('[name="' + n + '"]'); if (el) keep[n] = el.value; });
          form.reset();
          Object.keys(keep).forEach(function (n) { form.querySelector('[name="' + n + '"]').value = keep[n]; });
          show("ok", kind.done(data));
        })
        .catch(function () { show("err", "Sorry, that didn't go through. Please call " + PHONE + " or email <a href=\"mailto:bettersellingwithbailey@gmail.com\">bettersellingwithbailey@gmail.com</a>."); })
        .then(function () { if (button) { button.disabled = false; button.textContent = label; } });
    });
  });
})();

/* Hero photo rotator: crossfades the sale photos, with dots to pick one.
   Pauses on hover, on keyboard focus and when the tab is hidden; no
   automatic rotation for people who prefer reduced motion. */
(function () {
  var fig = document.querySelector(".hero-rotator");
  if (!fig) return;
  var imgs = fig.querySelectorAll(".rot-frame img");
  var dots = fig.querySelectorAll(".rot-dot");
  var cap = fig.querySelector(".rot-cap");
  if (imgs.length < 2) return;
  var i = 0, timer = null, paused = false;
  var delay = parseInt(fig.getAttribute("data-rotate"), 10) || 5500;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function show(n) {
    i = (n + imgs.length) % imgs.length;
    Array.prototype.forEach.call(imgs, function (img, k) {
      var on = k === i;
      img.classList.toggle("is-active", on);
      if (on) { img.removeAttribute("aria-hidden"); if (img.loading === "lazy") img.loading = "eager"; }
      else img.setAttribute("aria-hidden", "true");
    });
    Array.prototype.forEach.call(dots, function (d, k) {
      d.classList.toggle("is-active", k === i);
      if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
    });
    if (cap) cap.textContent = imgs[i].getAttribute("data-caption") || "";
  }
  function start() { if (still || timer) return; timer = setInterval(function () { if (!paused && !document.hidden) show(i + 1); }, delay); }
  Array.prototype.forEach.call(dots, function (d, k) {
    d.addEventListener("click", function () { show(k); clearInterval(timer); timer = null; start(); });
  });
  fig.addEventListener("mouseenter", function () { paused = true; });
  fig.addEventListener("mouseleave", function () { paused = false; });
  fig.addEventListener("focusin", function () { paused = true; });
  fig.addEventListener("focusout", function () { paused = false; });
  // warm up the next photos once the page has loaded
  window.addEventListener("load", function () { Array.prototype.forEach.call(imgs, function (img) { img.loading = "eager"; }); });
  start();
})();

/* Facebook feed (latest/ page): Meta's Page Plugin, sized to its column
   (the plugin takes 180 to 500 px wide), added after load. */
(function () {
  var box = document.querySelector("[data-fb-feed]");
  if (!box) return;
  var page = box.getAttribute("data-fb-feed");
  function build() {
    var w = Math.max(280, Math.min(500, Math.floor(box.clientWidth)));
    var h = parseInt(box.getAttribute("data-height"), 10) || 1400;
    var src = "https://www.facebook.com/plugins/page.php?href=" + encodeURIComponent(page) +
      "&tabs=timeline&width=" + w + "&height=" + h +
      "&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false";
    var f = document.createElement("iframe");
    f.src = src; f.width = w; f.height = h; f.title = "Better Selling With Bailey posts on Facebook";
    f.style.border = "none"; f.style.overflow = "hidden"; f.setAttribute("scrolling", "no");
    f.setAttribute("allow", "encrypted-media; picture-in-picture; web-share"); f.setAttribute("allowfullscreen", "true");
    f.loading = "lazy";
    box.innerHTML = "";
    box.appendChild(f);
  }
  if (document.readyState === "complete") build(); else window.addEventListener("load", build);
})();
