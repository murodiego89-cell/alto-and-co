/* Alto & Co. — tienda (SPA sin dependencias, rutas con #hash). */
(() => {
  const cfg = window.ALTO_CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $("#app");

  /* ---------- utilidades ---------- */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
    },
  };

  const LOCALES = { en: "en-CA", fr: "fr-CA", es: "es-MX" };

  const state = {
    lang: LOCALES[store.get("alto-lang", cfg.defaultLang)] ? store.get("alto-lang", cfg.defaultLang) : "en",
    products: [],
    loaded: false,
    error: false,
    cart: store.get("alto-cart", []),
    wish: store.get("alto-wish", []),
  };

  function t(key, vars = {}) {
    let s = I18N[state.lang][key] ?? I18N.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  }
  const money = (n) =>
    new Intl.NumberFormat(LOCALES[state.lang], { style: "currency", currency: "CAD" }).format(n);
  const catLabel = (c) => (I18N[state.lang][`cat.${c}`] ? t(`cat.${c}`) : c);
  const optLabel = (o) => (I18N[state.lang][`opt.${o}`] ? t(`opt.${o}`) : o);

  /* ---------- imágenes / placeholders ---------- */
  const SHAPES = {
    coat: "M32 14 L44 10 L50 30 L56 10 L68 14 L86 40 L84 96 L76 96 L72 52 L72 110 L28 110 L28 52 L24 96 L16 96 L14 40 Z",
    knit: "M30 18 L42 12 Q50 20 58 12 L70 18 L86 70 L76 74 L68 42 L68 100 L32 100 L32 42 L24 74 L14 70 Z",
    tee: "M30 20 L42 14 Q50 22 58 14 L70 20 L84 34 L74 44 L68 38 L68 100 L32 100 L32 38 L26 44 L16 34 Z",
    pants: "M30 14 L70 14 L74 110 L56 110 L50 44 L44 110 L26 110 Z",
    dress: "M40 12 L46 12 Q50 18 54 12 L60 12 L62 34 L80 108 L20 108 L38 34 Z",
    bag: "M24 44 L76 44 L80 104 L20 104 Z M38 44 Q38 20 50 20 Q62 20 62 44 L58 44 Q58 25 50 25 Q42 25 42 44 Z",
    hat: "M22 80 Q22 30 50 30 Q78 30 78 80 Z M18 80 L82 80 L82 94 L18 94 Z",
    boot: "M36 10 L62 10 L62 66 Q64 76 76 80 L90 86 Q94 90 92 100 L60 100 L56 108 L38 108 L36 100 L30 100 Q28 80 34 66 Z",
    fedora: "M30 70 L33 42 Q36 30 50 34 Q64 30 67 42 L70 70 Z M8 76 Q50 62 92 76 Q50 88 8 76 Z",
    belt: "M8 52 L72 52 L72 68 L8 68 Z M72 46 L92 46 L92 74 L72 74 Z M77 51 L87 51 L87 69 L77 69 Z",
    blanket: "M18 24 L82 24 L82 96 L18 96 Z M18 96 L18 104 M26 96 L26 104 M34 96 L34 104 M42 96 L42 104 M50 96 L50 104 M58 96 L58 104 M66 96 L66 104 M74 96 L74 104 M82 96 L82 104",
  };

  function media(p, color, idx = 0) {
    if (p.images.length) {
      const img = p.images[idx] || p.images[0];
      // Las imágenes de Shopify (CDN) aceptan ?width= para servir una versión optimizada
      const src = /^https?:/.test(img.url) ? img.url + (img.url.includes("?") ? "&" : "?") + "width=900" : img.url;
      return `<img src="${esc(src)}" alt="${esc(img.alt)}" loading="lazy">`;
    }
    const swatch = (p.swatches && (p.swatches[color] || Object.values(p.swatches)[0])) || "#d8d2c8";
    return `<div class="ph" style="--c:${esc(swatch)}" role="img" aria-label="${esc(p.title)}">
      <svg viewBox="0 0 100 120" aria-hidden="true"><path d="${SHAPES[p.shape] || SHAPES.tee}"/></svg></div>`;
  }

  /* ---------- carrito ---------- */
  const saveCart = () => { store.set("alto-cart", state.cart); renderCartCount(); };
  const cartQty = () => state.cart.reduce((n, l) => n + l.qty, 0);
  const cartTotal = () => state.cart.reduce((n, l) => n + l.qty * l.price, 0);

  function addToCart(p, v, qty = 1) {
    const line = state.cart.find((l) => l.variantId === v.id);
    if (line) line.qty += qty;
    else
      state.cart.push({
        variantId: v.id, handle: p.handle, title: p.title, variantTitle: v.title,
        price: v.price, qty, color: v.options.Color || v.options.Colour || null,
      });
    saveCart();
    renderDrawer();
    openDrawer();
  }

  /* ---------- wishlist (se guarda en el navegador) ---------- */
  const HEART = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.6-9.2C1 8 2.8 4.8 6.2 4.6c2.2-.1 4.4 1 5.8 3 1.4-2 3.6-3.1 5.8-3 3.4.2 5.2 3.4 3.8 6.7-2.1 4.6-9.6 9.2-9.6 9.2z" stroke="currentColor" stroke-width="1.6"/></svg>`;
  const inWish = (handle) => state.wish.includes(handle);
  const wishLabel = (handle) => t(inWish(handle) ? "wish.remove" : "wish.add");
  const wishButton = (p) => `<button type="button" class="wish-toggle ${inWish(p.handle) ? "on" : ""}" data-wish="${esc(p.handle)}"
    aria-pressed="${inWish(p.handle)}" aria-label="${wishLabel(p.handle)}">${HEART}</button>`;

  function renderWishCount() {
    const el = $("#wishCount");
    el.textContent = state.wish.length;
    el.hidden = !state.wish.length;
  }

  function toggleWish(handle) {
    const adding = !inWish(handle);
    state.wish = adding ? [...state.wish, handle] : state.wish.filter((h) => h !== handle);
    store.set("alto-wish", state.wish);
    renderWishCount();
    toast(t(adding ? "wish.added" : "wish.removed"));
    if (location.hash.startsWith("#/wishlist")) return route();
    document.querySelectorAll(`[data-wish="${CSS.escape(handle)}"]`).forEach((b) => {
      b.classList.toggle("on", adding);
      b.setAttribute("aria-pressed", String(adding));
      b.setAttribute("aria-label", wishLabel(handle));
      const text = $("span", b);
      if (text) text.textContent = wishLabel(handle);
    });
  }

  function renderCartCount() {
    const el = $("#cartCount");
    const n = cartQty();
    el.textContent = n;
    el.hidden = n === 0;
  }

  function renderDrawer() {
    const d = $("#drawer");
    const total = cartTotal();
    const left = cfg.freeShippingThreshold - total;
    const pct = Math.min(100, (total / cfg.freeShippingThreshold) * 100);
    const lines = state.cart.map((l, i) => {
      const p = state.products.find((x) => x.handle === l.handle);
      return `<li class="line">
        <a href="#/product/${esc(l.handle)}" class="line-media">${p ? media(p, l.color) : ""}</a>
        <div class="line-info">
          <a href="#/product/${esc(l.handle)}" class="line-title">${esc(p ? p.title : l.title)}</a>
          <div class="muted small">${esc(l.variantTitle)}</div>
          <div class="qty">
            <button data-qty="${i}" data-d="-1" aria-label="−">−</button>
            <span>${l.qty}</span>
            <button data-qty="${i}" data-d="1" aria-label="+">+</button>
          </div>
        </div>
        <div class="line-end">
          <div>${money(l.price * l.qty)}</div>
          <button class="line-remove" data-remove="${i}" aria-label="${t("cart.remove")}" title="${t("cart.remove")}">
            <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </li>`;
    }).join("");

    d.innerHTML = `
      <div class="drawer-head">
        <h2>${t("cart.title")}</h2>
        <button class="icon-btn" data-close aria-label="Close">✕</button>
      </div>
      ${state.cart.length ? `
        <div class="ship-progress">
          <p class="small">${left > 0 ? t("cart.freeLeft", { amount: money(left) }) : t("cart.freeYes")}</p>
          <div class="bar"><span style="width:${pct}%"></span></div>
        </div>
        <ul class="lines">${lines}</ul>
        <div class="drawer-foot">
          <div class="row"><span>${t("cart.subtotal")}</span><strong>${money(total)}</strong></div>
          <p class="muted small">${t("cart.note")}</p>
          <button class="btn btn-block" id="checkoutBtn">${t("cart.checkout")}</button>
          ${payIcons()}
        </div>` : `
        <div class="drawer-empty">
          <p>${t("cart.empty")}</p>
          <a href="#/shop" class="btn" data-close>${t("cart.continue")}</a>
        </div>`}
    `;
  }

  function payIcons() {
    const cards = ["Visa", "Mastercard", "Amex", "Discover", "JCB", "Apple Pay", "Google Pay", "Shop Pay"];
    return `<div class="pay"><span class="muted small">${t("pay.cards")}</span>
      <ul class="pay-list">${cards.map((c) => `<li>${c}</li>`).join("")}</ul></div>`;
  }

  function openDrawer() {
    $("#drawer").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
    document.body.classList.add("locked");
  }
  function closeDrawer() {
    $("#drawer").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
    document.body.classList.remove("locked");
  }

  async function checkout(btn) {
    if (!Shopify.enabled) return toast(t("demo.checkout"));
    btn.disabled = true;
    btn.textContent = "…";
    try {
      const url = await Shopify.createCheckout(state.cart, state.lang);
      window.location.href = url;
    } catch (e) {
      console.error(e);
      toast(t("err.checkout"));
      btn.disabled = false;
      btn.textContent = t("cart.checkout");
    }
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ---------- piezas de UI ---------- */
  const isNew = (p) => p.tags.map((x) => x.toLowerCase()).includes("new");
  const onSale = (p) => p.variants.some((v) => v.compareAt && v.compareAt > v.price);
  const soldOut = (p) => !p.variants.some((v) => v.available);
  const hasTag = (p, tag) => p.tags.some((x) => x.toLowerCase() === tag);
  const isHandmade = (p) => hasTag(p, "handmade");
  // Secciones de Accesorios: cada una se llena con la etiqueta del mismo nombre
  const ACCESSORY_TYPES = ["caps", "hats", "bags", "belts"];
  const isAccessory = (p) => p.category === "Accessories" || ACCESSORY_TYPES.some((k) => hasTag(p, k));
  const edition = (p) => {
    const tag = p.tags.find((x) => /^edition-\d+$/i.test(x));
    return tag ? tag.split("-")[1] : null;
  };

  function card(p) {
    const compare = onSale(p) ? Math.max(...p.variants.map((v) => v.compareAt || 0)) : null;
    const badge = soldOut(p) ? t("badge.soldout") : isHandmade(p) ? t("badge.handmade") : onSale(p) ? t("badge.sale") : isNew(p) ? t("badge.new") : "";
    const ed = edition(p);
    const dots = Object.values(p.swatches || {});
    return `<div class="card-wrap">${wishButton(p)}<a class="card" href="#/product/${esc(p.handle)}">
      <div class="card-media">${media(p)}${p.images[1] ? `<div class="card-alt">${media(p, null, 1)}</div>` : ""}${badge ? `<span class="badge ${isHandmade(p) && !soldOut(p) ? "badge-hm" : ""}">${badge}</span>` : ""}</div>
      <div class="card-info">
        <h3>${esc(p.title)}</h3>
        ${ed ? `<p class="muted small">${t("hm.edition", { n: ed })}</p>` : ""}
        <p>${compare ? `<s class="muted">${money(compare)}</s> ` : ""}${money(p.price)}</p>
        ${dots.length > 1 ? `<div class="card-dots" aria-hidden="true">${dots.map((c) => `<span style="--sw:${esc(c)}"></span>`).join("")}</div>` : ""}
      </div>
    </a></div>`;
  }

  const categories = () => [...new Set(["Women", "Men", "Accessories", "Handmade", ...state.products.map((p) => p.category)])];

  const SOCIALS = [
    ["instagram", "Instagram", `<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/>`],
    ["tiktok", "TikTok", `<path fill="currentColor" d="M16.6 2h-3.3v13.6a2.9 2.9 0 1 1-2.1-2.8V9.4a6.3 6.3 0 1 0 5.4 6.2V8.7a8 8 0 0 0 4.4 1.4V6.8a4.6 4.6 0 0 1-4.4-4.8z"/>`],
    ["facebook", "Facebook", `<path fill="currentColor" transform="translate(.9 -1.5)" d="M14.2 8.6h2.6V5.2c-.5-.1-1.9-.2-3.3-.2-3.2 0-5.2 1.9-5.2 5.3v2.5H5.4v3.7h2.9V22H12v-5.5h3l.5-3.7H12v-2.2c0-1.2.4-2 2.2-2z"/>`],
  ];
  const socialLinks = () => SOCIALS.map(([key, name, icon]) => {
    const url = (cfg.social || {})[key];
    const svg = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${icon}</svg>`;
    return url
      ? `<a class="social-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${name}">${svg}</a>`
      : `<button type="button" class="social-btn" data-social-soon="${name}" aria-label="${name}">${svg}</button>`;
  }).join("");

  function renderChrome() {
    document.documentElement.lang = LOCALES[state.lang];
    const wholeDollars = new Intl.NumberFormat(LOCALES[state.lang],
      { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(cfg.freeShippingThreshold);
    $("#announce").textContent = t("announce");
    $("#announce2").textContent = t("announce2", { amount: wholeDollars });
    const demo = $("#demoBanner");
    demo.hidden = Shopify.enabled;
    demo.textContent = t("demo.banner");
    $("#langSel").value = state.lang;
    $("#langSel").setAttribute("aria-label", t("lang.label"));
    $("#cartBtn").setAttribute("aria-label", t("cart"));
    $("#wishBtn").setAttribute("aria-label", t("wish.title"));
    $("#searchBtn").setAttribute("aria-label", t("search.label"));
    $("#searchLabel").textContent = t("search.label");
    $("#searchInput").placeholder = t("search.placeholder");
    $("#searchClose").setAttribute("aria-label", t("search.close"));
    const mega = (links, img, label, href) => `<div class="mega"><div class="mega-inner">
      <div class="mega-links">${links.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</div>
      <a class="mega-photo" href="${href}"><img src="${img}" alt="" loading="lazy"><span>${label}</span></a>
    </div></div>`;
    const item = (href, label, panel = "") => `<div class="nav-item"><a href="${href}">${label}</a>${panel}</div>`;
    $("#nav").innerHTML =
      item("#/shop?sort=new", t("nav.new")) +
      item("#/shop/Women", t("nav.women"), mega([
        ["#/shop/Women", t("home.viewAll")], ["#/shop/Unisex", t("nav.tees")], ["#/shop/Accessories?type=caps", t("nav.caps")],
        ["#/shop/Accessories?type=hats", t("nav.hats")],
      ], "assets/img/cap-rider.jpg", t("nav.caps"), "#/shop/Accessories?type=caps")) +
      item("#/shop/Men", t("nav.men"), mega([
        ["#/shop/Men", t("home.viewAll")], ["#/shop/Unisex", t("nav.tees")], ["#/shop/Accessories?type=caps", t("nav.caps")],
        ["#/handmade?type=belts", t("nav.belts")],
      ], "assets/img/tee-rancher-lifestyle.jpg", t("nav.tees"), "#/shop/Unisex")) +
      item("#/shop/Accessories", t("nav.accessories"), mega([
        ["#/shop/Accessories", t("home.viewAll")], ["#/shop/Accessories?type=caps", t("nav.caps")],
        ["#/shop/Accessories?type=hats", t("nav.hats")], ["#/shop/Accessories?type=bags", t("nav.bags")],
        ["#/shop/Accessories?type=belts", t("nav.belts")],
      ], "assets/img/cap-rider.jpg", t("nav.caps"), "#/shop/Accessories?type=caps")) +
      item("#/handmade", t("nav.handmade"), mega([
        ["#/handmade", t("home.viewAll")], ["#/handmade?type=boots", t("nav.boots")],
        ["#/handmade?type=belts", t("nav.belts")],
      ], "assets/img/handmade-boot-artisan.jpg", t("nav.boots"), "#/handmade?type=boots")) +
      item("#/about", t("nav.story"));
    $("#footer").innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">
          <a class="logo" href="#/" aria-label="Alto & Co."><img src="assets/logo-light.png" alt="Alto & Co." width="800" height="158"></a>
          <p class="social-title">${t("footer.follow")}</p>
          <div class="social">${socialLinks()}</div>
          ${cfg.signupEndpoint ? `<p class="small">${t("footer.news")}</p>
          <form class="news" id="newsForm">
            <label class="sr-only" for="newsEmail">${t("footer.email")}</label>
            <input id="newsEmail" name="email" type="email" required placeholder="${t("footer.email")}">
            <button class="btn btn-light">${t("footer.join")}</button>
          </form>` : ""}
        </div>
        <div class="footer-col">
          <h2>${t("nav.shop")}</h2>
          <a href="#/shop?sort=new">${t("nav.new")}</a>
          <a href="#/shop/Women">${t("nav.women")}</a>
          <a href="#/shop/Men">${t("nav.men")}</a>
          <a href="#/shop/Accessories">${t("nav.accessories")}</a>
          <a href="#/handmade">${t("nav.handmade")}</a>
        </div>
        <div class="footer-col">
          <h2>${t("footer.help")}</h2>
          <a href="#/help">${t("nav.help")}</a>
          <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>
        </div>
        <div class="footer-col">
          <h2>${t("nav.about")}</h2>
          <a href="#/about">${t("nav.story")}</a>
        </div>
      </div>
      <div class="footer-bottom small">
        <span>© ${new Date().getFullYear()} Alto & Co. ${t("footer.rights")} · 🇨🇦 ${t("footer.country")} · CAD</span>
        ${payIcons()}
      </div>`;
    renderCartCount();
    renderWishCount();
    renderDrawer();
    if (!$("#promo").hidden) renderPromo();
  }

  /* ---------- ventana de código promocional ---------- */
  let promoTimer;
  function promoCountdown() {
    const ms = new Date(cfg.promo.opensAt).getTime() - Date.now();
    if (!(ms > 0)) return "";
    const box = (n, label) => `<div><strong>${String(n).padStart(2, "0")}</strong><span>${label}</span></div>`;
    return box(Math.floor(ms / 864e5), t("promo.days")) +
      box(Math.floor(ms / 36e5) % 24, t("promo.hours")) +
      box(Math.floor(ms / 6e4) % 60, t("promo.mins"));
  }
  function renderPromo() {
    const count = promoCountdown();
    $("#promo").innerHTML = `
      <div class="promo-card" role="dialog" aria-modal="true" aria-labelledby="promoTitle">
        <button class="promo-close" data-promo-close aria-label="${t("promo.close")}">✕</button>
        <div class="promo-photo"><img src="${esc(cfg.promo.image)}" alt=""></div>
        <div class="promo-body">
          <p class="promo-eyebrow">${t("promo.eyebrow")}</p>
          <h2 id="promoTitle"><span class="promo-big">${t("promo.big")}</span><span class="promo-sub">${t("promo.sub")}</span></h2>
          <div class="promo-rule"></div>
          <p class="promo-text">${t("promo.text")}</p>
          ${count ? `<p class="promo-label">${t("promo.opens")}</p><div class="promo-count" id="promoCount">${count}</div>` : ""}
          <p class="promo-code">${esc(cfg.promo.code)}</p>
          <button class="promo-copy" data-promo-copy>${t("promo.copy")}</button>
          <p class="promo-trust">${t("promo.trust")}</p>
        </div>
      </div>`;
  }
  function closePromo() {
    $("#promo").hidden = true;
    document.body.classList.remove("locked");
    clearInterval(promoTimer);
  }
  function schedulePromo() {
    if (!cfg.promo || !cfg.promo.code) return;
    setTimeout(() => {
      renderPromo();
      $("#promo").hidden = false;
      document.body.classList.add("locked");
      $("#promo .promo-copy").focus();
      promoTimer = setInterval(() => {
        const el = $("#promoCount");
        if (el) el.innerHTML = promoCountdown();
      }, 60000);
    }, cfg.promo.delayMs);
  }

  /* ---------- vistas ---------- */
  function heroMedia() {
    const hv = cfg.heroVideo;
    const tall = matchMedia("(max-width: 760px)").matches;
    const poster = tall ? hv.posterTall : hv.posterWide;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return `<img class="hero-media" src="${esc(poster)}" alt="">`;
    return `<video class="hero-media" id="heroVideo" src="${esc(tall ? hv.tall : hv.wide)}" poster="${esc(poster)}"
        autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>
      <button class="hero-toggle" id="heroToggle" aria-label="${t("hero.pause")}">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path class="i-pause" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/><path class="i-play" d="M8 5l11 7-11 7z"/></svg>
      </button>`;
  }

  function mountHero() {
    const v = $("#heroVideo");
    if (!v) return;
    const btn = $("#heroToggle");
    const sync = () => {
      btn.classList.toggle("paused", v.paused);
      btn.setAttribute("aria-label", t(v.paused ? "hero.play" : "hero.pause"));
    };
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    btn.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
    v.muted = true;
    v.play().catch(sync); // modo ahorro de batería: se queda el poster y el botón ofrece reproducir
  }

  /* Our Story: entradas suaves y parallax ligero. Sin JS o con movimiento reducido, todo se ve desde el inicio */
  const parallax = { els: [], ticking: false };
  function runParallax() {
    parallax.ticking = false;
    const vh = window.innerHeight;
    parallax.els.forEach((el) => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      const p = (box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2);
      el.style.transform = `translate3d(0, ${(p * box.height * -0.06).toFixed(1)}px, 0)`;
    });
  }
  function queueParallax() {
    if (!parallax.els.length || parallax.ticking) return;
    parallax.ticking = true;
    requestAnimationFrame(runParallax);
  }
  window.addEventListener("scroll", queueParallax, { passive: true });
  window.addEventListener("resize", queueParallax, { passive: true });

  function mountStory() {
    parallax.els = [];
    const root = $(".about");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("animate");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    root.querySelectorAll(".rv, .rv-clip, .ab-line").forEach((el) => io.observe(el));
    if (matchMedia("(min-width: 761px)").matches) {
      parallax.els = [...root.querySelectorAll("[data-parallax]")];
      runParallax();
    }
  }

  function mountRails() {
    document.querySelectorAll("[data-rail]").forEach((wrap) => {
      const rail = $(".rail", wrap);
      const nav = $(".rail-nav", wrap);
      nav.hidden = rail.scrollWidth <= rail.clientWidth + 4;
      nav.addEventListener("click", (e) => {
        const b = e.target.closest("[data-dir]");
        if (b) rail.scrollBy({ left: +b.dataset.dir * rail.clientWidth * 0.8, behavior: "smooth" });
      });
    });
  }

  function viewHome() {
    // La portada solo muestra productos con foto real; los dibujos de ejemplo se quedan en la tienda
    const photos = state.products.filter((p) => p.images.length);
    const pool = photos.length ? photos : state.products;
    const featured = pool.filter((p) => hasTag(p, "featured"));
    const list = [...featured, ...pool.filter((p) => !featured.includes(p))].slice(0, 12);
    const split = [
      { href: "#/shop/Unisex", img: "assets/img/tee-heritage-back.jpg", label: t("nav.tees"), pos: "center 40%" },
      { href: "#/shop/Accessories?type=caps", img: "assets/img/cap-rider.jpg", label: t("nav.caps"), pos: "center 45%" },
    ];
    return `
      <section class="hero">
        ${heroMedia()}
        <div class="hero-copy">
          <span class="soon-pill"><span class="soon-dot" aria-hidden="true"></span>${t("hero.soon")}</span>
          <h1 class="hero-title">${(() => {
            // "A little wild. A little western." → cada frase en su propia línea
            const [first, ...rest] = t("hero.title").split(/(?<=\.)\s+/);
            return rest.length ? `${first} <em>${rest.join(" ")}</em>` : first;
          })()}</h1>
          <p class="hero-statement">${t("hero.statement")}</p>
          ${cfg.signupEndpoint ? `<form class="news hero-news">
            <label class="sr-only" for="heroEmail">${t("footer.email")}</label>
            <input id="heroEmail" name="email" type="email" required placeholder="${t("footer.email")}">
            <button class="btn btn-light">${t("hero.notify")}</button>
          </form>` : ""}
          <div class="hero-cta">
            <a class="btn btn-light" href="#/shop">${t("hero.cta")}</a>
            <a class="btn btn-line" href="#/handmade">${t("hero.cta2")}</a>
          </div>
        </div>
      </section>

      <section class="split">
        ${split.map((c) => `<a class="split-tile" href="${c.href}">
          <img src="${c.img}" alt="" loading="lazy" style="object-position:${c.pos}">
          <div><h2>${c.label}</h2><span>${t("home.shop")}</span></div>
        </a>`).join("")}
      </section>

      <section class="rail-wrap" data-rail>
        <div class="section-head">
          <h2 class="section-title">${t("nav.new")}</h2>
          <div class="rail-head-end">
            <div class="rail-nav" hidden>
              <button data-dir="-1" aria-label="${t("home.prev")}">←</button>
              <button data-dir="1" aria-label="${t("home.next")}">→</button>
            </div>
            <a href="#/shop" class="link">${t("home.viewAll")}</a>
          </div>
        </div>
        <div class="rail">${list.map(card).join("")}</div>
      </section>

      <a class="banner" href="#/handmade">
        <img src="assets/img/handmade-boot-artisan.jpg" alt="" loading="lazy">
        <div class="banner-copy">
          <p class="eyebrow">${t("hm.eyebrow")}</p>
          <h2>${t("hm.title")}</h2>
          <p>${t("hm.teaser")}</p>
          <span class="btn btn-light">${t("hm.cta")}</span>
        </div>
      </a>

      <section class="home-story">
        <div class="home-story-photo"><img src="assets/img/founders.jpg" alt="${t("about.foundersAlt")}" loading="lazy"></div>
        <div class="home-story-copy">
          <p class="eyebrow">${t("about.eyebrow")}</p>
          <h2>${t("home.story.title")}</h2>
          <p>${t("home.story.text")}</p>
          <a class="btn btn-line" href="#/about">${t("home.story.cta")}</a>
        </div>
      </section>

      <section class="values">
        <div><h3>${t("vp.ship.t")}</h3><p>${t("vp.ship.d")}</p></div>
        <div><h3>${t("vp.pay.t")}</h3><p>${t("vp.pay.d")}</p></div>
        <div><h3>${t("vp.ret.t")}</h3><p>${t("vp.ret.d")}</p></div>
      </section>`;
  }

  function viewShop(category, params) {
    const sort = params.get("sort") || "new";
    const q = (params.get("q") || "").trim();
    const needle = q.toLowerCase();
    // Las prendas unisex también aparecen en Women y Men
    let list = state.products.filter((p) => !category || p.category === category ||
      (p.category === "Unisex" && (category === "Women" || category === "Men")) ||
      (category === "Accessories" && isAccessory(p)));
    const type = category === "Accessories" && ACCESSORY_TYPES.includes(params.get("type")) ? params.get("type") : null;
    if (type) list = list.filter((p) => hasTag(p, type));
    if (q) list = list.filter((p) => `${p.title} ${p.description} ${p.category}`.toLowerCase().includes(needle));
    list = [...list].sort((a, b) =>
      sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price
        : (b.images.length > 0) - (a.images.length > 0) || String(b.createdAt).localeCompare(String(a.createdAt))
    );
    const chip = (c, label) =>
      `<a class="chip ${c === category || (!c && !category) ? "active" : ""}" href="#/shop${c ? "/" + encodeURIComponent(c) : ""}${sort !== "new" ? "?sort=" + sort : ""}">${esc(label)}</a>`;
    return `
      <section class="section">
        <h1 class="page-title">${q ? t("shop.results", { q: esc(q) }) : type ? t(`nav.${type}`) : category ? esc(catLabel(category)) : t("shop.title")}</h1>
        <div class="toolbar">
          <div class="chips">${chip("", t("shop.all"))}${categories().map((c) => chip(c, catLabel(c))).join("")}</div>
          <label class="sort"><span class="muted small">${t("shop.sort")}</span>
            <select id="sortSel">
              ${["new", "low", "high"].map((s) => `<option value="${s}" ${s === sort ? "selected" : ""}>${t("sort." + s)}</option>`).join("")}
            </select>
          </label>
        </div>
        ${category === "Accessories" ? `<div class="chips chips-sub">
          ${["", ...ACCESSORY_TYPES].map((k) => {
            const query = [k && `type=${k}`, sort !== "new" && `sort=${sort}`].filter(Boolean).join("&");
            return `<a class="chip ${(k || null) === type ? "active" : ""}" href="#/shop/Accessories${query ? "?" + query : ""}">${k ? t(`nav.${k}`) : t("shop.all")}</a>`;
          }).join("")}
        </div>` : ""}
        ${list.length ? `<p class="muted small">${t("shop.count", { n: list.length })}</p>
        <div class="grid">${list.map(card).join("")}</div>` : `<p class="shop-empty">${t(type ? "shop.soon" : "shop.none")}</p>`}
      </section>`;
  }

  function viewProduct(handle) {
    const p = state.products.find((x) => x.handle === handle);
    if (!p) return viewNotFound();

    const optionNames = [...new Set(p.variants.flatMap((v) => Object.keys(v.options)))]
      .filter((n) => !(n === "Title" && p.variants.length === 1));
    const firstAvail = p.variants.find((v) => v.available) || p.variants[0];
    const sel = { ...firstAvail.options };
    // Si hay talla, que el cliente la elija explícitamente
    const sizeKey = optionNames.find((n) => /^(size|taille)$/i.test(n));
    if (sizeKey && new Set(p.variants.map((v) => v.options[sizeKey])).size > 1) delete sel[sizeKey];

    const related = state.products.filter((x) => x.category === p.category && x.handle !== p.handle).slice(0, 4);

    setTimeout(() => mountProduct(p, optionNames, sel), 0);
    return `
      <section class="section pdp">
        <a href="#/shop" class="link small back">← ${t("pdp.back")}</a>
        <div class="pdp-grid">
          <div class="pdp-media" id="pdpMedia"></div>
          <div class="pdp-info">
            <p class="eyebrow">${esc(catLabel(p.category))}</p>
            <h1>${esc(p.title)}</h1>
            <p class="pdp-price" id="pdpPrice"></p>
            <div id="pdpOptions"></div>
            ${isHandmade(p) ? `<ul class="hm-facts">
              <li>✦ ${t("hm.fact.hand")}</li>
              ${edition(p) ? `<li>✦ ${t("hm.edition", { n: edition(p) })} — ${t("hm.fact.numbered")}</li>` : ""}
              <li>✦ ${hasTag(p, "made-to-order") ? t("hm.fact.mto") : t("hm.fact.ready")}</li>
            </ul>` : ""}
            <button class="btn btn-block" id="addBtn"></button>
            <button type="button" class="btn btn-ghost btn-block wish-pdp ${inWish(p.handle) ? "on" : ""}" data-wish="${esc(p.handle)}" aria-pressed="${inWish(p.handle)}">${HEART}<span>${wishLabel(p.handle)}</span></button>
            <p class="muted small">${t("pdp.shipping", { amount: money(cfg.freeShippingThreshold) })}</p>
            <details open><summary>${t("pdp.details")}</summary><p>${esc(p.description)}</p></details>
            ${payIcons()}
          </div>
        </div>
      </section>
      ${related.length ? `<section class="section"><h2 class="section-title">${t("pdp.related")}</h2>
        <div class="grid">${related.map(card).join("")}</div></section>` : ""}`;
  }

  /* Lupa de la foto de producto: un recuadro sigue al cursor y muestra esa zona ampliada. Solo con mouse en computadora */
  function mountZoom(mediaEl) {
    if (!matchMedia("(hover: hover) and (pointer: fine) and (min-width: 761px)").matches) return;
    const ZOOM = 2.4;
    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
    let frame = null;
    let lens = null;
    const hide = () => { lens?.remove(); lens = frame = null; };
    mediaEl.addEventListener("mousemove", (e) => {
      const box = e.target.closest(".pdp-img");
      const img = box && box.querySelector("img");
      if (!img || !img.naturalWidth) return hide();
      if (box !== frame) {
        hide();
        frame = box;
        lens = document.createElement("div");
        lens.className = "pdp-lens";
        lens.setAttribute("aria-hidden", "true");
        // En Shopify pide una versión más grande de la foto para que la lupa se vea nítida
        lens.style.backgroundImage = `url("${img.currentSrc.replace("width=900", "width=2000")}")`;
        box.append(lens);
      }
      const r = box.getBoundingClientRect();
      const size = lens.offsetWidth;
      // La foto va con object-fit: cover y centrada: calcula su tamaño real para que la lupa coincida
      const scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const left = clamp(e.clientX - r.left - size / 2, 0, r.width - size);
      const top = clamp(e.clientY - r.top - size / 2, 0, r.height - size);
      // Amplía lo que hay bajo el centro del recuadro, que nunca sale de la foto
      const x = left + size / 2;
      const y = top + size / 2;
      lens.style.transform = `translate(${left}px, ${top}px)`;
      lens.style.backgroundSize = `${w * ZOOM}px ${h * ZOOM}px`;
      lens.style.backgroundPosition = `${size / 2 - (x + (w - r.width) / 2) * ZOOM}px ${size / 2 - (y + (h - r.height) / 2) * ZOOM}px`;
    });
    mediaEl.addEventListener("mouseleave", hide);
  }

  function mountProduct(p, optionNames, sel) {
    const mediaEl = $("#pdpMedia");
    if (!mediaEl) return;
    mountZoom(mediaEl);
    const colorKey = optionNames.find((n) => /^(colou?r|couleur)$/i.test(n));
    const values = (name) => [...new Set(p.variants.map((v) => v.options[name]))];
    const match = () => p.variants.find((v) => optionNames.every((n) => v.options[n] === sel[n]));
    const isAvail = (name, value) =>
      p.variants.some((v) => v.available && v.options[name] === value &&
        optionNames.every((n) => n === name || !sel[n] || v.options[n] === sel[n]));

    function update() {
      const v = match();
      if (p.images.length > 1) {
        mediaEl.innerHTML = p.images.map((_, i) => `<div class="pdp-img">${media(p, null, i)}</div>`).join("");
      } else {
        mediaEl.innerHTML = `<div class="pdp-img">${media(p, colorKey ? sel[colorKey] : null)}</div>`;
      }
      const price = v ? v.price : p.price;
      const compare = v && v.compareAt > v.price ? v.compareAt : null;
      $("#pdpPrice").innerHTML = `${compare ? `<s class="muted">${money(compare)}</s> ` : ""}${money(price)}`;

      $("#pdpOptions").innerHTML = optionNames.map((name) => `
        <fieldset class="opt">
          <legend>${esc(optLabel(name))}${sel[name] ? `: <span class="muted">${esc(sel[name])}</span>` : ""}</legend>
          <div class="opt-values">
            ${values(name).map((val) => {
              const sw = name === colorKey && p.swatches ? p.swatches[val] : null;
              return `<button type="button" class="opt-btn ${sw ? "swatch" : ""} ${sel[name] === val ? "active" : ""} ${isAvail(name, val) ? "" : "na"}"
                data-opt="${esc(name)}" data-val="${esc(val)}" aria-pressed="${sel[name] === val}"
                ${sw ? `style="--sw:${esc(sw)}" aria-label="${esc(val)}" title="${esc(val)}"` : ""}>${sw ? "" : esc(val)}</button>`;
            }).join("")}
          </div>
        </fieldset>`).join("");

      const btn = $("#addBtn");
      const missing = optionNames.find((n) => !sel[n]);
      if (missing) { btn.disabled = false; btn.textContent = t("pdp.choose", { option: optLabel(missing).toLowerCase() }); btn.dataset.state = "choose"; }
      else if (!v || !v.available) { btn.disabled = true; btn.textContent = t("pdp.soldout"); btn.dataset.state = ""; }
      else { btn.disabled = false; btn.textContent = `${t("pdp.add")} · ${money(v.price)}`; btn.dataset.state = "add"; }
    }

    $("#pdpOptions").addEventListener("click", (e) => {
      const b = e.target.closest("[data-opt]");
      if (!b) return;
      sel[b.dataset.opt] = b.dataset.val;
      update();
    });
    $("#addBtn").addEventListener("click", (e) => {
      if (e.currentTarget.dataset.state === "choose") {
        $("#pdpOptions .opt:not(:has(.active))")?.classList.add("shake");
        setTimeout(() => $(".shake")?.classList.remove("shake"), 500);
        return;
      }
      const v = match();
      if (v && v.available) { addToCart(p, v); toast(t("cart.added")); }
    });
    update();
  }

  function viewHandmade(params) {
    const sort = params.get("sort") || "new";
    const type = params.get("type");
    const all = state.products.filter(isHandmade);
    const TYPES = ["boots", "leather-jackets", "hats", "belts"];
    const tiles = TYPES.map((k) => {
      const items = all.filter((p) => hasTag(p, k));
      if (!items.length) return "";
      const href = `#/handmade${type === k ? "" : "?type=" + k}`;
      return `<a class="hm-tile ${type === k ? "active" : ""}" href="${href}" aria-pressed="${type === k}">
        <div class="hm-tile-media">${media(items[0])}</div>
        <div class="hm-tile-label"><span>${t("hm.type." + k)}</span><small>${items.length}</small></div>
      </a>`;
    }).join("");
    const list = all.filter((p) => !type || hasTag(p, type)).sort((a, b) =>
      sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : String(b.createdAt).localeCompare(String(a.createdAt)));
    return `
      <section class="hm-hero">
        ${matchMedia("(prefers-reduced-motion: reduce)").matches ? "" : `<video class="hm-video" id="hmVideo" src="${esc(cfg.handmadeVideo.src)}" poster="${esc(cfg.handmadeVideo.poster)}"
          autoplay muted loop playsinline preload="auto" disablepictureinpicture disableremoteplayback tabindex="-1" aria-hidden="true"></video>`}
        <div class="hm-hero-inner">
          <p class="eyebrow">${t("hm.eyebrow")}</p>
          <h1>${t("hm.title")}</h1>
          <p>${t("hm.text")}</p>
        </div>
      </section>
      <section class="hm-pillars">
        ${["hand", "edition", "care"].map((k) => `
          <div><span class="hm-num">${{ hand: "I", edition: "II", care: "III" }[k]}</span>
            <h3>${t(`hm.${k}.t`)}</h3><p>${t(`hm.${k}.d`)}</p></div>`).join("")}
      </section>
      ${tiles ? `<section class="section hm-tiles-wrap">
        <h2 class="section-title">${t("hm.shopBy")}</h2>
        <div class="hm-tiles">${tiles}</div>
      </section>` : ""}
      <section class="section" id="hmGrid">
        <div class="toolbar">
          <p class="muted small">${type ? `<strong>${t("hm.type." + type)}</strong> · ` : ""}${t("shop.count", { n: list.length })}${type ? ` · <a class="link" href="#/handmade">${t("hm.viewAll")}</a>` : ""}</p>
          <label class="sort"><span class="muted small">${t("shop.sort")}</span>
            <select id="sortSel">
              ${["new", "low", "high"].map((s) => `<option value="${s}" ${s === sort ? "selected" : ""}>${t("sort." + s)}</option>`).join("")}
            </select>
          </label>
        </div>
        ${list.length ? `<div class="grid grid-hm">${list.map(card).join("")}</div>` : `<p>${t("shop.none")}</p>`}
      </section>`;
  }

  const viewAbout = () => `
    <div class="about">
      <section class="ab-hero">
        <div class="ab-hero-copy">
          <p class="eyebrow rv">${t("about.hero.eyebrow")}</p>
          <h1><span class="ab-line"><span>${t("about.eyebrow")}</span></span></h1>
          <p class="ab-hero-sub rv" style="--d:.25s">${t("about.hero.sub")}</p>
        </div>
      </section>

      <section class="ab-founders">
        <figure>
          <div class="ab-frame rv-clip"><img data-parallax src="assets/img/founders.jpg" alt="${t("about.foundersAlt")}" width="1536" height="1024" fetchpriority="high"></div>
          <figcaption>Diego A. Muro de la Torre <span>&amp;</span> Aldo E. Muro de la Torre</figcaption>
        </figure>
        <div class="ab-copy">
          <p class="eyebrow rv">${t("about.foundersRole")}</p>
          <h2 class="rv" style="--d:.08s">${t("about.founders.title")}</h2>
          <p class="rv" style="--d:.16s">${t("about.p1")}</p>
          <p class="rv" style="--d:.22s">${t("about.p2")}</p>
          <p class="ab-strong rv" style="--d:.28s">${t("about.p3")}</p>
        </div>
      </section>

      <section class="ab-sister">
        <div class="ab-sister-inner">
          <div class="ab-copy">
            <p class="eyebrow rv">${t("about.sister.name")}</p>
            <h2 class="rv" style="--d:.08s">${t("about.sister.title")}</h2>
            <p class="rv" style="--d:.16s">${t("about.sister.p1")}</p>
            <p class="rv" style="--d:.2s">${t("about.sister.p2")}</p>
            <p class="rv" style="--d:.24s">${t("about.sister.p3")}</p>
            <p class="ab-sign rv" style="--d:.28s">${t("about.sister.sign")}</p>
            <figure class="ab-gallery rv" style="--d:.1s">
              <div>
                ${[
                  ["cap-rider.jpg", "about.gallery.cap", "50% 40%", 1.12],
                  ["bunny-sweatshirt.jpg", "about.gallery.bunny", "50% 50%", 1.3],
                  ["tee-rancher-lifestyle.jpg", "about.gallery.rancher", "50% 76%", 1.7],
                ].map(([f, alt, pos, z]) => `<span><img src="assets/img/${f}" alt="${t(alt)}" loading="lazy" style="object-position:${pos};--z:${z}"></span>`).join("")}
              </div>
              <figcaption>${t("about.gallery.caption")}</figcaption>
            </figure>
          </div>
          <figure class="ab-portrait">
            <div class="ab-print"><div class="rv-clip"><img src="assets/img/hermana-alto-co.jpg" alt="${t("about.sister.alt")}" width="900" height="1200" loading="lazy"></div></div>
            <figcaption>${t("about.sister.caption")}</figcaption>
          </figure>
        </div>
      </section>

      <section class="ab-siblings">
        <figure>
          <div class="ab-paper"><div class="rv-clip"><img src="assets/img/hermanos-dibujo.jpg" alt="${t("about.siblings.alt")}" width="1486" height="1059" loading="lazy"></div></div>
          <figcaption>${t("about.siblings.caption")}</figcaption>
        </figure>
        <div class="ab-copy">
          <h2 class="rv">${t("about.siblings.title")}</h2>
          <p class="rv" style="--d:.1s">${t("about.siblings.p1")}</p>
          <p class="rv" style="--d:.16s">${t("about.siblings.p2")}</p>
          <p class="rv" style="--d:.22s">${t("about.siblings.p3")}</p>
        </div>
      </section>

      <section class="ab-close">
        <img data-parallax src="assets/img/handmade-boot-artisan.jpg" alt="" width="1920" height="1080" loading="lazy">
        <div class="ab-close-copy">
          <h2><span class="ab-line"><span>${t("about.sign")}</span></span></h2>
          <p class="rv" style="--d:.15s">${t("about.close.text")}</p>
          <img class="rv" style="--d:.22s" src="assets/logo-light.png" alt="Alto & Co." width="800" height="158" loading="lazy">
          <a class="btn btn-light rv" style="--d:.28s" href="#/shop">${t("about.cta")}</a>
        </div>
      </section>
    </div>`;

  function viewWishlist() {
    const list = state.wish.map((h) => state.products.find((p) => p.handle === h)).filter(Boolean);
    return `
      <section class="section">
        <h1 class="page-title">${t("wish.title")}</h1>
        ${list.length ? `<p class="muted small">${t("shop.count", { n: list.length })}</p>
        <div class="grid">${list.map(card).join("")}</div>` : `<p class="shop-empty">${t("wish.empty")}</p>
        <a class="btn" href="#/shop">${t("about.cta")}</a>`}
      </section>`;
  }

  const viewHelp = () => `
    <section class="section prose">
      <h1 class="page-title">${t("help.title")}</h1>
      ${["ship", "tax", "pay", "ret"].map((k) => `
        <h2>${t(`help.${k}.t`)}</h2><p>${t(`help.${k}.d`, { amount: money(cfg.freeShippingThreshold) })}</p>`).join("")}
      ${payIcons()}
      <p>${t("help.contact")} <a class="link" href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>.</p>
    </section>`;

  const viewNotFound = () => `<section class="section prose"><h1 class="page-title">${t("notfound")}</h1>
    <a class="btn" href="#/">Alto & Co.</a></section>`;

  /* ---------- router ---------- */
  function route() {
    closeDrawer();
    closeSearch();
    // Al navegar se cierra el menú grande, aunque el cursor siga encima
    $("#nav").classList.toggle("no-mega", $("#nav").matches(":hover"));
    if ($("#nav").contains(document.activeElement)) document.activeElement.blur();
    $("#nav").classList.remove("open");
    $("#menuBtn").setAttribute("aria-expanded", "false");

    if (!state.loaded) {
      app.innerHTML = state.error
        ? `<section class="section prose"><p>${t("err.load")}</p></section>`
        : `<section class="section"><div class="grid">${'<div class="card skeleton"></div>'.repeat(8)}</div></section>`;
      return;
    }
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, query = ""] = raw.split("?");
    const params = new URLSearchParams(query);
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent);

    let html;
    if (!parts.length) html = viewHome();
    else if (parts[0] === "shop") html = viewShop(parts[1], params);
    else if (parts[0] === "product") html = viewProduct(parts[1]);
    else if (parts[0] === "handmade") html = viewHandmade(params);
    else if (parts[0] === "about") html = viewAbout();
    else if (parts[0] === "help") html = viewHelp();
    else if (parts[0] === "wishlist") html = viewWishlist();
    else html = viewNotFound();

    app.innerHTML = html;
    document.body.classList.toggle("hero-page", !parts.length);
    mountHero();
    mountRails();
    const hmVideo = $("#hmVideo");
    if (hmVideo) {
      hmVideo.muted = true;
      hmVideo.play().catch(() => hmVideo.remove()); // si el navegador no lo reproduce, queda la foto de fondo
    }
    mountStory();
    // Marca el enlace activo: misma ruta y, si el enlace lleva filtros (?type=boots), los mismos filtros
    document.querySelectorAll("#nav .nav-item > a").forEach((a) => {
      const [aPath, aQuery = ""] = a.getAttribute("href").replace(/^#/, "").split("?");
      const aParams = new URLSearchParams(aQuery);
      const match = aPath === path && [...aParams.keys()].every((k) => params.get(k) === aParams.get(k));
      a.classList.toggle("active", match);
    });
    // Al elegir un cuadro de Handmade, deja a la vista los cuadros y los productos filtrados
    const anchor = parts[0] === "handmade" && params.get("type") && document.querySelector(".hm-tiles-wrap");
    if (anchor) anchor.scrollIntoView({ block: "start" });
    else window.scrollTo({ top: 0 });
  }

  /* ---------- búsqueda ---------- */
  function closeSearch() {
    $("#searchForm").hidden = true;
    $("#searchBtn").setAttribute("aria-expanded", "false");
  }

  /* ---------- eventos globales ---------- */
  const onScroll = () => document.body.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  $("#nav").addEventListener("mouseleave", () => $("#nav").classList.remove("no-mega"));
  $("#nav").addEventListener("focusin", () => $("#nav").classList.remove("no-mega"));
  $("#searchBtn").addEventListener("click", () => {
    const form = $("#searchForm");
    form.hidden = !form.hidden;
    $("#searchBtn").setAttribute("aria-expanded", String(!form.hidden));
    if (!form.hidden) $("#searchInput").focus();
  });
  $("#searchClose").addEventListener("click", closeSearch);
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    if (!q) return;
    closeSearch();
    location.hash = `#/shop?q=${encodeURIComponent(q)}`;
  });
  $("#cartBtn").addEventListener("click", () => { renderDrawer(); openDrawer(); });
  $("#overlay").addEventListener("click", closeDrawer);
  app.addEventListener("click", (e) => {
    const heart = e.target.closest("[data-wish]");
    if (heart) toggleWish(heart.dataset.wish);
  });
  $("#footer").addEventListener("click", (e) => {
    const soon = e.target.closest("[data-social-soon]");
    if (soon) toast(t("social.soon", { name: soon.dataset.socialSoon }));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeDrawer();
    closeSearch();
    if (!$("#promo").hidden) closePromo();
  });
  $("#promo").addEventListener("click", async (e) => {
    if (e.target.id === "promo" || e.target.closest("[data-promo-close]")) return closePromo();
    const copy = e.target.closest("[data-promo-copy]");
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(cfg.promo.code);
      copy.textContent = t("promo.copied");
    } catch { /* el código sigue visible para copiarlo a mano */ }
  });
  $("#menuBtn").addEventListener("click", () => {
    const open = $("#nav").classList.toggle("open");
    $("#menuBtn").setAttribute("aria-expanded", String(open));
  });
  $("#langSel").addEventListener("change", async (e) => {
    state.lang = e.target.value;
    store.set("alto-lang", state.lang);
    renderChrome();
    if (Shopify.enabled) await loadProducts(); // nombres/descripciones traducidos desde Shopify
    route();
  });

  $("#drawer").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return closeDrawer();
    const q = e.target.closest("[data-qty]");
    if (q) {
      const line = state.cart[+q.dataset.qty];
      line.qty += +q.dataset.d;
      if (line.qty <= 0) state.cart.splice(+q.dataset.qty, 1);
      saveCart(); renderDrawer(); return;
    }
    const r = e.target.closest("[data-remove]");
    if (r) { state.cart.splice(+r.dataset.remove, 1); saveCart(); renderDrawer(); return; }
    if (e.target.closest("#checkoutBtn")) checkout(e.target.closest("#checkoutBtn"));
  });

  app.addEventListener("change", (e) => {
    if (e.target.id !== "sortSel") return;
    const [path, query = ""] = (location.hash.replace(/^#/, "") || "/").split("?");
    const params = new URLSearchParams(query);
    params.set("sort", e.target.value);
    location.hash = `${path}?${params.toString()}`;
  });

  document.addEventListener("submit", async (e) => {
    if (!e.target.classList.contains("news")) return;
    e.preventDefault();
    const form = e.target;
    try {
      const res = await fetch(cfg.signupEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`Signup HTTP ${res.status}`);
      form.reset();
      toast(t("footer.joined"));
    } catch (err) {
      console.error(err);
      toast(t("err.signup"));
    }
  });

  window.addEventListener("hashchange", route);

  /* ---------- arranque ---------- */
  async function loadProducts() {
    try {
      state.products = Shopify.enabled ? await Shopify.getProducts(state.lang) : window.DEMO_PRODUCTS;
      // Quita del carrito variantes que ya no existen en la tienda
      const ids = new Set(state.products.flatMap((p) => p.variants.map((v) => v.id)));
      state.cart = state.cart.filter((l) => ids.has(l.variantId));
      saveCart();
      // Quita de la wishlist productos que ya no existen en la tienda
      state.wish = state.wish.filter((h) => state.products.some((p) => p.handle === h));
      store.set("alto-wish", state.wish);
      renderWishCount();
      state.loaded = true;
      state.error = false;
    } catch (e) {
      console.error(e);
      state.error = true;
    }
  }

  renderChrome();
  route();
  loadProducts().then(() => { renderDrawer(); route(); });
  schedulePromo();
})();
