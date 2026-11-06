/* Productos de ejemplo para MODO DEMO (se ignoran al conectar Shopify). */
window.DEMO_PRODUCTS = (() => {
  const sizes = ["XS", "S", "M", "L", "XL"];
  const mk = (handle, title, category, price, colors, shape, description, opts = {}) => {
    const sz = opts.sizes || sizes;
    const variants = [];
    colors.forEach(([color]) =>
      sz.forEach((size) =>
        variants.push({
          id: `demo-${handle}-${color}-${size}`.toLowerCase().replace(/\s+/g, "-"),
          title: `${color} / ${size}`,
          available: !(opts.soldOut || []).includes(size),
          price,
          compareAt: opts.compareAt || null,
          options: { Color: color, Size: size },
        })
      )
    );
    return {
      id: `demo-${handle}`,
      handle,
      title,
      description,
      category,
      tags: opts.tags || [],
      createdAt: opts.createdAt || "2026-10-01",
      price,
      images: (opts.images || []).map((url) => ({ url, alt: title })),
      swatches: Object.fromEntries(colors),
      shape,
      variants,
    };
  };

  return [
    // ---- Productos con fotos reales de Alto & Co. ----
    mk("heritage-in-motion-tee", "Heritage in Motion Tee", "Unisex", 55,
      [["Sand", "#e3d6bf"]], "tee",
      "Heavyweight cotton tee with a relaxed, boxy fit. Small Alto & Co. wordmark on the chest and our hand-drawn rider embroidered on the back — Heritage in Motion, est. 2026.",
      { tags: ["featured", "new"], createdAt: "2026-11-01", sizes: ["S", "M", "L", "XL", "XXL"],
        images: ["assets/img/tee-heritage-back.jpg", "assets/img/tee-heritage-front.jpg"] }),
    mk("rider-cap", "Rider Cap", "Accessories", 45,
      [["Cream / Brown", "#e9e1d0"]], "hat",
      "Structured six-panel cotton twill cap with a contrast brown brim. Embroidered with our original rider drawing and the Alto & Co. signature. Adjustable strap.",
      { tags: ["featured", "new"], createdAt: "2026-11-01", sizes: ["One size"],
        images: ["assets/img/cap-rider.jpg"] }),
    mk("little-rancher-tee", "Little Rancher Tee", "Unisex", 55,
      [["Natural", "#efe6d2"]], "tee",
      "Garment-dyed cotton tee in natural, with our little rancher drawn on the back and the Alto and Co. signature underneath. Made for long days outside.",
      { tags: ["featured", "new"], createdAt: "2026-10-30", sizes: ["S", "M", "L", "XL", "XXL"],
        images: ["assets/img/tee-rancher-lifestyle.jpg"] }),

    // ---- Colección Handmade (ejemplos: reemplazar con fotos y precios reales) ----
    // Etiquetas: "handmade" la incluye en la colección; "edition-N" = edición numerada de N piezas;
    // "made-to-order" = se fabrica después de la compra (2–3 semanas).
    // Tipo (para los cuadros de categoría): "boots", "leather-jackets", "hats" o "belts".

    // Botas
    mk("alto-handmade-western-boot", "Alto Handmade Western Boot", "Handmade", 780,
      [["Cognac", "#9a5b34"], ["Black", "#222222"]], "boot",
      "Goodyear-welted western boot built over 200 hand steps. Full-grain calf upper with our rider stitch pattern on the shaft, stacked leather heel and leather sole.",
      { tags: ["handmade", "boots", "edition-25", "made-to-order", "new"], createdAt: "2026-11-04", sizes: ["7", "8", "9", "10", "11", "12"] }),
    mk("roper-ankle-boot", "Roper Ankle Boot", "Handmade", 620,
      [["Chocolate", "#4a2c1d"], ["Sand Suede", "#c8ad88"]], "boot",
      "A low roper boot hand-lasted in Los Altos de Jalisco. Rounded toe, walking heel and a cushioned leather footbed for all-day wear.",
      { tags: ["handmade", "boots", "edition-40"], createdAt: "2026-11-03", sizes: ["7", "8", "9", "10", "11", "12"] }),

    // Chamarras de piel
    mk("rancher-leather-jacket", "Rancher Leather Jacket", "Handmade", 1150,
      [["Chocolate", "#4a2c1d"], ["Cognac", "#9a5b34"]], "coat",
      "Hand-cut and hand-finished lambskin jacket with a shearling collar, antiqued brass snaps and a quilted lining. Each one is numbered inside the pocket.",
      { tags: ["handmade", "leather-jackets", "edition-20", "made-to-order", "new"], createdAt: "2026-11-04", sizes: ["S", "M", "L", "XL"] }),
    mk("suede-fringe-jacket", "Suede Fringe Jacket", "Handmade", 1290,
      [["Tan", "#b8875a"]], "coat",
      "Soft goat suede with hand-cut fringe across the yoke and sleeves. A modern take on the classic western jacket.",
      { tags: ["handmade", "leather-jackets", "edition-15", "made-to-order"], createdAt: "2026-11-02", sizes: ["S", "M", "L", "XL"] }),

    // Sombreros
    mk("palm-straw-rancher-hat", "Palm Straw Rancher Hat", "Handmade", 185,
      [["Natural", "#dcc79e"]], "fedora",
      "Hand-woven palm straw hat with a leather band and a stitched Alto & Co. rider on the sweatband. Built for summer on the ranch.",
      { tags: ["handmade", "hats", "edition-60"], createdAt: "2026-10-30", sizes: ["S", "M", "L", "XL"] }),

    // Cintos
    mk("braided-leather-belt", "Braided Leather Belt", "Handmade", 165,
      [["Cognac", "#9a5b34"], ["Black", "#222222"]], "belt",
      "Hand-braided from a single strip of bridle leather with a solid brass roller buckle.",
      { tags: ["handmade", "belts", "edition-60"], createdAt: "2026-10-29", sizes: ["30", "32", "34", "36", "38", "40"] }),
    mk("silver-buckle-dress-belt", "Silver Buckle Dress Belt", "Handmade", 340,
      [["Black", "#222222"], ["Chocolate", "#4a2c1d"]], "belt",
      "Smooth calf leather with a hand-engraved sterling silver buckle and keeper. Our most formal piece.",
      { tags: ["handmade", "belts", "edition-20"], createdAt: "2026-10-27", sizes: ["30", "32", "34", "36", "38", "40"] }),

    // Otras piezas
    mk("rider-embroidered-chore-jacket", "Rider Hand-Embroidered Chore Jacket", "Handmade", 385,
      [["Indigo", "#3b4a6b"], ["Ecru", "#e6dcc6"]], "coat",
      "Heavy cotton canvas chore jacket with our rider drawing hand-embroidered across the back — roughly 14 hours of needlework per piece. Corozo buttons, three patch pockets, blanket-lined body.",
      { tags: ["handmade", "edition-30", "new"], createdAt: "2026-11-03", sizes: ["S", "M", "L", "XL"] }),
    mk("rancher-hand-knit-cardigan", "Rancher Hand-Knit Cardigan", "Handmade", 420,
      [["Oat", "#e2d6c2"], ["Forest", "#3f5246"]], "knit",
      "Hand-knit in merino with a shawl collar and leather-wrapped buttons. Each cardigan is knit by a single artisan and signed on the inside label.",
      { tags: ["handmade", "edition-20", "made-to-order"], createdAt: "2026-11-02", sizes: ["S", "M", "L", "XL"] }),
    mk("hand-tooled-leather-belt", "Hand-Tooled Leather Belt", "Handmade", 210,
      [["Cognac", "#9a5b34"], ["Chocolate", "#4a2c1d"]], "belt",
      "Full-grain vegetable-tanned leather, hand-tooled with a western floral pattern and finished with a solid brass buckle engraved “Alto & Co.”. Gets better with every year of wear.",
      { tags: ["handmade", "belts", "edition-50"], createdAt: "2026-11-01", sizes: ["30", "32", "34", "36", "38", "40"] }),
    mk("felt-rancher-hat", "Felt Rancher Hat", "Handmade", 295,
      [["Sand", "#cdb89a"], ["Chocolate", "#4a2c1d"]], "fedora",
      "Wool felt hat blocked and shaped by hand, with a grosgrain band and a small embroidered rider on the inner lining.",
      { tags: ["handmade", "hats", "edition-40"], createdAt: "2026-10-31", sizes: ["S", "M", "L", "XL"] }),
    mk("saddle-leather-weekender", "Saddle Leather Weekender", "Handmade", 650,
      [["Cognac", "#9a5b34"]], "bag",
      "Saddle-stitched by hand in thick bridle leather with brass hardware and a waxed-canvas lining. Built to carry a weekend’s worth of clothes for decades.",
      { tags: ["handmade", "edition-15", "made-to-order"], createdAt: "2026-10-29", sizes: ["One size"] }),
    mk("hand-woven-wool-throw", "Hand-Woven Wool Throw", "Handmade", 340,
      [["Cream / Brown", "#e3d6bf"]], "blanket",
      "Woven on a traditional floor loom from undyed wool, with fringed edges and our brown signature stripe. 130 × 180 cm.",
      { tags: ["handmade", "edition-25"], createdAt: "2026-10-28", sizes: ["One size"] }),

    // ---- Productos de ejemplo (dibujos) ----
    mk("laurentian-wool-coat", "Laurentian Wool Coat", "Women", 395,
      [["Camel", "#c9a77c"], ["Charcoal", "#4a4a4a"]], "coat",
      "A long, double-faced wool coat cut for Canadian winters. Dropped shoulders, deep pockets and a lining that layers over knits.",
      { tags: ["new"], createdAt: "2026-10-20", soldOut: ["XS"] }),
    mk("muskoka-merino-crew", "Muskoka Merino Crew", "Women", 145,
      [["Oat", "#e2d6c2"], ["Forest", "#3f5246"], ["Ink", "#2b3140"]], "knit",
      "Extra-fine merino in a relaxed crew neck. Soft enough to wear next to skin, warm enough for the lake in October.",
      { tags: [] }),
    mk("bay-street-trouser", "Bay Street Trouser", "Women", 165,
      [["Black", "#222222"], ["Stone", "#b8ae9c"]], "pants",
      "High-rise, wide-leg trouser in a fluid stretch twill. Pressed front crease, side pockets and a clean waistband.",
      { tags: ["new"], createdAt: "2026-10-15" }),
    mk("okanagan-slip-dress", "Okanagan Slip Dress", "Women", 175,
      [["Clay", "#b5735a"], ["Black", "#222222"]], "dress",
      "Bias-cut midi dress in washed satin with adjustable straps. Layer it over a knit when the evenings turn cool.",
      { compareAt: 220, tags: ["sale"] }),
    mk("yukon-parka", "Yukon Parka", "Men", 495,
      [["Olive", "#5c6346"], ["Black", "#222222"]], "coat",
      "Recycled-down parka rated to −25 °C. Water-resistant shell, storm cuffs and a removable hood trim.",
      { tags: ["new"], createdAt: "2026-10-25", soldOut: ["XL"] }),
    mk("harbour-oxford-shirt", "Harbour Oxford Shirt", "Men", 98,
      [["White", "#f2f0ea"], ["Sky", "#a9bfd6"]], "tee",
      "Garment-washed oxford cloth with a soft button-down collar. Easy enough for weekends, sharp enough for the office.",
      {}),
    mk("rideau-cord-pant", "Rideau Cord Pant", "Men", 135,
      [["Tobacco", "#8a6040"], ["Navy", "#2c3550"]], "pants",
      "Mid-wale cotton corduroy with a tapered leg and a hint of stretch.",
      { sizes: ["28", "30", "32", "34", "36"], tags: [] }),
    mk("cabot-fisherman-knit", "Cabot Fisherman Knit", "Men", 185,
      [["Ecru", "#e9e2d0"], ["Navy", "#2c3550"]], "knit",
      "Heavy cable-knit sweater in a wool-cashmere blend, inspired by the Atlantic coast.",
      { compareAt: 240, tags: ["sale"] }),
    mk("st-lawrence-tote", "St. Lawrence Tote", "Accessories", 120,
      [["Cognac", "#9a5b34"], ["Black", "#222222"]], "bag",
      "Full-grain leather tote with an interior zip pocket. Fits a 15\" laptop.",
      { sizes: ["One size"], tags: [] }),
    mk("alpine-cashmere-beanie", "Alpine Cashmere Beanie", "Accessories", 65,
      [["Heather Grey", "#a3a3a3"], ["Camel", "#c9a77c"], ["Red", "#a3392f"]], "hat",
      "Pure cashmere rib-knit beanie with a fold-over cuff.",
      { sizes: ["One size"], tags: ["new"], createdAt: "2026-10-18" }),
  ];
})();
