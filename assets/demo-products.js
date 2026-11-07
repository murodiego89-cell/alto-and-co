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
    mk("little-bunny-sweatshirt", "Little Bunny Sweatshirt", "Unisex", 85,
      [["Natural", "#efe6d2"]], "knit",
      "Crewneck sweatshirt in natural, with Sofia's little bunny, red flowers and birds drawn across the back.",
      { tags: ["featured", "new"], createdAt: "2026-11-07", sizes: ["S", "M", "L", "XL", "XXL"],
        images: ["assets/img/bunny-sweatshirt.jpg"] }),
    mk("heritage-in-motion-tee", "Heritage in Motion Tee", "Unisex", 55,
      [["Sand", "#e3d6bf"]], "tee",
      "Heavyweight cotton tee with a relaxed, boxy fit. Small Alto & Co. wordmark on the chest and our hand-drawn rider embroidered on the back — Heritage in Motion, est. 2026.",
      { tags: ["featured", "new"], createdAt: "2026-11-01", sizes: ["S", "M", "L", "XL", "XXL"],
        images: ["assets/img/tee-heritage-back.jpg", "assets/img/tee-heritage-front.jpg"] }),
    mk("rider-cap", "Rider Cap", "Accessories", 45,
      [["Cream / Brown", "#e9e1d0"]], "hat",
      "Structured six-panel cotton twill cap with a contrast brown brim. Embroidered with our original rider drawing and the Alto & Co. signature. Adjustable strap.",
      { tags: ["featured", "new", "caps"], createdAt: "2026-11-01", sizes: ["One size"],
        images: ["assets/img/cap-rider.jpg"] }),
    mk("little-rancher-tee", "Little Rancher Tee", "Unisex", 55,
      [["Natural", "#efe6d2"]], "tee",
      "Garment-dyed cotton tee in natural, with our little rancher drawn on the back and the Alto and Co. signature underneath. Made for long days outside.",
      { tags: ["featured", "new"], createdAt: "2026-10-30", sizes: ["S", "M", "L", "XL", "XXL"],
        images: ["assets/img/tee-rancher-lifestyle.jpg"] }),

    // ---- Colección Handmade: solo piezas artesanales de piel (ejemplos: reemplazar con fotos y precios reales) ----
    // Etiquetas: "handmade" la incluye en la colección; "edition-N" = edición numerada de N piezas;
    // "made-to-order" = se fabrica después de la compra (2–3 semanas).
    // Tipo (para los cuadros de categoría): "boots", "leather-jackets", "hats" o "belts".
    // Accesorios: la etiqueta "caps", "hats", "bags" o "belts" pone el producto en esa sección.

    // Botas
    mk("alto-handmade-western-boot", "Alto Handmade Western Boot", "Handmade", 780,
      [["Cognac", "#9a5b34"], ["Black", "#222222"]], "boot",
      "Goodyear-welted western boot built over 200 hand steps. Full-grain calf upper with our rider stitch pattern on the shaft, stacked leather heel and leather sole.",
      { tags: ["handmade", "boots", "edition-25", "made-to-order", "new"], createdAt: "2026-11-04", sizes: ["7", "8", "9", "10", "11", "12"] }),
    mk("roper-ankle-boot", "Roper Ankle Boot", "Handmade", 620,
      [["Chocolate", "#4a2c1d"], ["Sand Suede", "#c8ad88"]], "boot",
      "A low roper boot hand-lasted in Los Altos de Jalisco. Rounded toe, walking heel and a cushioned leather footbed for all-day wear.",
      { tags: ["handmade", "boots", "edition-40"], createdAt: "2026-11-03", sizes: ["7", "8", "9", "10", "11", "12"] }),

    // Sombreros
    mk("palm-straw-rancher-hat", "Palm Straw Rancher Hat", "Accessories", 185,
      [["Natural", "#dcc79e"]], "fedora",
      "Palm straw hat with a leather band and a stitched Alto & Co. rider on the sweatband. Built for summer on the ranch.",
      { tags: ["hats"], createdAt: "2026-10-30", sizes: ["S", "M", "L", "XL"] }),

    // Cintos
    mk("braided-leather-belt", "Braided Leather Belt", "Handmade", 165,
      [["Cognac", "#9a5b34"], ["Black", "#222222"]], "belt",
      "Hand-braided from a single strip of bridle leather with a solid brass roller buckle.",
      { tags: ["handmade", "belts", "edition-60"], createdAt: "2026-10-29", sizes: ["30", "32", "34", "36", "38", "40"] }),
    mk("silver-buckle-dress-belt", "Silver Buckle Dress Belt", "Handmade", 340,
      [["Black", "#222222"], ["Chocolate", "#4a2c1d"]], "belt",
      "Smooth calf leather with a hand-engraved sterling silver buckle and keeper. Our most formal piece.",
      { tags: ["handmade", "belts", "edition-20"], createdAt: "2026-10-27", sizes: ["30", "32", "34", "36", "38", "40"] }),

    // Más cintos y sombreros
    mk("hand-tooled-leather-belt", "Hand-Tooled Leather Belt", "Handmade", 210,
      [["Cognac", "#9a5b34"], ["Chocolate", "#4a2c1d"]], "belt",
      "Full-grain vegetable-tanned leather, hand-tooled with a western floral pattern and finished with a solid brass buckle engraved “Alto & Co.”. Gets better with every year of wear.",
      { tags: ["handmade", "belts", "edition-50"], createdAt: "2026-11-01", sizes: ["30", "32", "34", "36", "38", "40"] }),
    mk("felt-rancher-hat", "Felt Rancher Hat", "Accessories", 295,
      [["Sand", "#cdb89a"], ["Chocolate", "#4a2c1d"]], "fedora",
      "Wool felt hat with a grosgrain band and a small embroidered rider on the inner lining.",
      { tags: ["hats"], createdAt: "2026-10-31", sizes: ["S", "M", "L", "XL"] }),

  ];
})();
