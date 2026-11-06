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

  const state = {
    lang: store.get("alto-lang", cfg.defaultLang) === "fr" ? "fr" : "en",
    products: [],
    loaded: false,
    error: false,
    cart: store.get("alto-cart", []),
  };

  function t(key, vars = {}) {
    let s = I18N[state.lang][key] ?? I18N.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  }
  const money = (n) =>
    new Intl.NumberFormat(state.lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(n);
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
          <button class="link small" data-remove="${i}">${t("cart.remove")}</button>
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
  const edition = (p) => {
    const tag = p.tags.find((x) => /^edition-\d+$/i.test(x));
    return tag ? tag.split("-")[1] : null;
  };

  function card(p) {
    const compare = onSale(p) ? Math.max(...p.variants.map((v) => v.compareAt || 0)) : null;
    const badge = soldOut(p) ? t("badge.soldout") : isHandmade(p) ? t("badge.handmade") : onSale(p) ? t("badge.sale") : isNew(p) ? t("badge.new") : "";
    const ed = edition(p);
    return `<a class="card" href="#/product/${esc(p.handle)}">
      <div class="card-media">${media(p)}${badge ? `<span class="badge ${isHandmade(p) && !soldOut(p) ? "badge-hm" : ""}">${badge}</span>` : ""}</div>
      <div class="card-info">
        <h3>${esc(p.title)}</h3>
        ${ed ? `<p class="muted small">${t("hm.edition", { n: ed })}</p>` : ""}
        <p>${compare ? `<s class="muted">${money(compare)}</s> ` : ""}${money(p.price)}</p>
      </div>
    </a>`;
  }

  const categories = () => [...new Set(state.products.map((p) => p.category))];

  function renderChrome() {
    document.documentElement.lang = state.lang === "fr" ? "fr-CA" : "en-CA";
    const wholeDollars = new Intl.NumberFormat(state.lang === "fr" ? "fr-CA" : "en-CA",
      { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(cfg.freeShippingThreshold);
    $("#announce").textContent = t("announce");
    $("#announce2").textContent = t("announce2", { amount: wholeDollars });
    const demo = $("#demoBanner");
    demo.hidden = Shopify.enabled;
    demo.textContent = t("demo.banner");
    $("#langBtn").textContent = state.lang === "fr" ? "EN" : "FR";
    $("#cartBtn").setAttribute("aria-label", t("cart"));
    $("#nav").innerHTML = `
      <a href="#/shop?sort=new">${t("nav.new")}</a>
      <a href="#/shop/Women">${t("nav.women")}</a>
      <a href="#/shop/Men">${t("nav.men")}</a>
      <a href="#/handmade?type=boots">${t("nav.boots")}</a>
      <a href="#/shop/Accessories">${t("nav.accessories")}</a>
      <a href="#/about">${t("nav.story")}</a>`;
    $("#footer").innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="logo"><img src="assets/logo.png" alt="Alto & Co." width="1400" height="277"></div>
          ${cfg.signupEndpoint ? `<p class="muted small">${t("footer.news")}</p>
          <form class="news" id="newsForm">
            <label class="sr-only" for="newsEmail">${t("footer.email")}</label>
            <input id="newsEmail" name="email" type="email" required placeholder="${t("footer.email")}">
            <button class="btn">${t("footer.join")}</button>
          </form>` : ""}
        </div>
        <div class="footer-links">
          <a href="#/shop">${t("nav.shop")}</a>
          <a href="#/handmade">${t("nav.handmade")}</a>
          <a href="#/about">${t("nav.story")}</a>
          <a href="#/help">${t("nav.help")}</a>
          <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>
        </div>
        <div>${payIcons()}</div>
      </div>
      <div class="footer-bottom muted small">© ${new Date().getFullYear()} Alto & Co. ${t("footer.rights")} · 🇨🇦 Canada · CAD</div>`;
    renderCartCount();
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
  function viewHome() {
    const featured = state.products.filter((p) => p.tags.map((x) => x.toLowerCase()).includes("featured"));
    const list = [...featured, ...state.products.filter((p) => !featured.includes(p))].slice(0, 8);
    const heroImgs = cfg.heroImages || [];
    const cats = categories().slice(0, 3);
    return `
      <section class="hero">
        <div class="hero-text">
          <span class="soon-pill"><span class="soon-dot" aria-hidden="true"></span>${t("hero.soon")}</span>
          <h1 class="hero-title">${(() => {
            // "A little wild. A little western." → segunda frase en cursiva, en su propia línea
            const [first, ...rest] = t("hero.title").split(/(?<=\.)\s+/);
            return rest.length ? `${first} <em>${rest.join(" ")}</em>` : first;
          })()}</h1>
          <p class="hero-statement">${t("hero.statement")}</p>
          <p class="hero-lede">${t("hero.text")}</p>
          ${cfg.signupEndpoint ? `<form class="news hero-news">
            <label class="sr-only" for="heroEmail">${t("footer.email")}</label>
            <input id="heroEmail" name="email" type="email" required placeholder="${t("footer.email")}">
            <button class="btn">${t("hero.notify")}</button>
          </form>
          <p class="muted small hero-note">${t("hero.notifyNote")}</p>` : ""}
          <div class="hero-links">
            <a class="link" href="#/shop">${t("hero.cta")} →</a>
            <a class="link" href="#/handmade">${t("hero.cta2")} →</a>
          </div>
        </div>
        <div class="hero-art">
          ${heroImgs.length
            ? heroImgs.slice(0, 3).map((h) => `<a class="hero-tile" href="${esc(h.link || "#/shop")}"><img src="${esc(h.src)}" alt="${esc(h.alt || "Alto & Co.")}" style="object-position:${esc(h.position || "center")}"></a>`).join("")
            : state.products.slice(0, 3).map((p) => `<div class="hero-tile" aria-hidden="true">${media(p)}</div>`).join("")}
        </div>
      </section>

      <section class="values">
        <div><h3>${t("vp.ship.t")}</h3><p>${t("vp.ship.d")}</p></div>
        <div><h3>${t("vp.pay.t")}</h3><p>${t("vp.pay.d")}</p></div>
        <div><h3>${t("vp.ret.t")}</h3><p>${t("vp.ret.d")}</p></div>
      </section>

      ${state.products.some(isHandmade) ? `
      <section class="section">
        <a class="hm-teaser" href="#/handmade">
          <div>
            <p class="eyebrow">${t("hm.eyebrow")}</p>
            <h2>${t("hm.title")}</h2>
            <p>${t("hm.teaser")}</p>
            <span class="btn btn-light">${t("hm.cta")}</span>
          </div>
          <div class="hm-teaser-art" aria-hidden="true">
            ${state.products.filter(isHandmade).slice(0, 3).map((p) => `<div>${media(p)}</div>`).join("")}
          </div>
        </a>
      </section>` : ""}

      <section class="section">
        <h2 class="section-title">${t("home.categories")}</h2>
        <div class="cats">
          ${cats.map((c) => {
            const p = state.products.find((x) => x.category === c);
            return `<a class="cat" href="#/shop/${encodeURIComponent(c)}">${media(p)}<span>${esc(catLabel(c))}</span></a>`;
          }).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">${t("home.featured")}</h2>
          <a href="#/shop" class="link">${t("home.viewAll")} →</a>
        </div>
        <div class="grid">${list.map(card).join("")}</div>
      </section>`;
  }

  function viewShop(category, params) {
    const sort = params.get("sort") || "new";
    let list = state.products.filter((p) => !category || p.category === category);
    list = [...list].sort((a, b) =>
      sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : String(b.createdAt).localeCompare(String(a.createdAt))
    );
    const chip = (c, label) =>
      `<a class="chip ${c === category || (!c && !category) ? "active" : ""}" href="#/shop${c ? "/" + encodeURIComponent(c) : ""}${sort !== "new" ? "?sort=" + sort : ""}">${esc(label)}</a>`;
    return `
      <section class="section">
        <h1 class="page-title">${category ? esc(catLabel(category)) : t("shop.title")}</h1>
        <div class="toolbar">
          <div class="chips">${chip("", t("shop.all"))}${categories().map((c) => chip(c, catLabel(c))).join("")}</div>
          <label class="sort"><span class="muted small">${t("shop.sort")}</span>
            <select id="sortSel">
              ${["new", "low", "high"].map((s) => `<option value="${s}" ${s === sort ? "selected" : ""}>${t("sort." + s)}</option>`).join("")}
            </select>
          </label>
        </div>
        <p class="muted small">${t("shop.count", { n: list.length })}</p>
        ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<p>${t("shop.none")}</p>`}
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
            <p class="muted small">${t("pdp.shipping", { amount: money(cfg.freeShippingThreshold) })}</p>
            <details open><summary>${t("pdp.details")}</summary><p>${esc(p.description)}</p></details>
            ${payIcons()}
          </div>
        </div>
      </section>
      ${related.length ? `<section class="section"><h2 class="section-title">${t("pdp.related")}</h2>
        <div class="grid">${related.map(card).join("")}</div></section>` : ""}`;
  }

  function mountProduct(p, optionNames, sel) {
    const mediaEl = $("#pdpMedia");
    if (!mediaEl) return;
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

  // "Our Story": la última frase del título va en cursiva, igual que en la portada
  const italicLast = (s) => {
    const parts = s.split(/(?<=\.)\s+/);
    return parts.length > 1 ? `${parts.slice(0, -1).join(" ")} <em>${parts[parts.length - 1]}</em>` : s;
  };
  const viewAbout = () => `
    <section class="section story">
      <figure class="story-media">
        <div class="story-photo"><img src="assets/img/founders.jpg" alt="${t("about.foundersAlt")}"></div>
        <figcaption>
          <span class="story-names">Diego A. Muro de la Torre <span class="amp">&amp;</span> Aldo E. Muro de la Torre</span>
          <span class="story-role">${t("about.foundersRole")}</span>
        </figcaption>
      </figure>
      <div class="story-text">
        <p class="eyebrow">${t("about.eyebrow")}</p>
        <h1 class="story-title">${italicLast(t("about.title"))}</h1>
        <p class="story-lead">${t("about.p1")}</p>
        <p>${t("about.p2")}</p>
        <p>${t("about.p3")}</p>
        <blockquote class="story-quote">${t("about.p4")}</blockquote>
        <p class="story-sign">${t("about.sign")}</p>
        <a class="btn" href="#/shop">${t("about.cta")}</a>
      </div>
    </section>`;

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
    else html = viewNotFound();

    app.innerHTML = html;
    // Marca el enlace activo: misma ruta y, si el enlace lleva filtros (?type=boots), los mismos filtros
    document.querySelectorAll("#nav a").forEach((a) => {
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

  /* ---------- eventos globales ---------- */
  $("#cartBtn").addEventListener("click", () => { renderDrawer(); openDrawer(); });
  $("#overlay").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeDrawer();
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
  $("#langBtn").addEventListener("click", async () => {
    state.lang = state.lang === "fr" ? "en" : "fr";
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
