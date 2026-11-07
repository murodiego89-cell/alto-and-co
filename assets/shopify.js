/* Cliente mínimo de la Shopify Storefront API (sin dependencias). */
window.Shopify = (() => {
  const cfg = window.ALTO_CONFIG;
  const enabled = Boolean(cfg.shopDomain && cfg.storefrontToken);

  async function gql(query, variables = {}) {
    const res = await fetch(
      `https://${cfg.shopDomain}/api/${cfg.apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": cfg.storefrontToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    );
    if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data;
  }

  const PRODUCTS_QUERY = `
    query Products($language: LanguageCode, $cursor: String)
      @inContext(country: CA, language: $language) {
      products(first: 100, after: $cursor, sortKey: CREATED_AT, reverse: true) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id handle title description productType tags createdAt
          images(first: 8) { nodes { url altText } }
          variants(first: 100) {
            nodes {
              id title availableForSale
              price { amount currencyCode }
              compareAtPrice { amount }
              selectedOptions { name value }
            }
          }
        }
      }
    }`;

  function normalize(p) {
    const variants = p.variants.nodes.map((v) => ({
      id: v.id,
      title: v.title,
      available: v.availableForSale,
      price: Number(v.price.amount),
      compareAt: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
      options: Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value])),
    }));
    return {
      id: p.id,
      handle: p.handle,
      title: p.title,
      description: p.description,
      category: p.productType || "Other",
      tags: p.tags,
      createdAt: p.createdAt,
      price: Math.min(...variants.map((v) => v.price)),
      images: p.images.nodes.map((i) => ({ url: i.url, alt: i.altText || p.title })),
      variants,
    };
  }

  async function getProducts(lang) {
    const language = lang.toUpperCase();
    const all = [];
    let cursor = null;
    do {
      const data = await gql(PRODUCTS_QUERY, { language, cursor });
      all.push(...data.products.nodes.map(normalize));
      cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
    } while (cursor);
    return all;
  }

  /* Crea un carrito en Shopify y devuelve la URL del checkout seguro.
     El checkout de Shopify cobra con Visa, Mastercard, Amex, Discover, JCB,
     Apple Pay, Google Pay y Shop Pay, y calcula GST/HST/PST por provincia. */
  async function createCheckout(lines, lang) {
    const data = await gql(
      `mutation CartCreate($input: CartInput!, $language: LanguageCode)
        @inContext(country: CA, language: $language) {
        cartCreate(input: $input) {
          cart { checkoutUrl }
          userErrors { field message }
        }
      }`,
      {
        language: lang.toUpperCase(),
        input: {
          lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.qty })),
          buyerIdentity: { countryCode: "CA" },
        },
      }
    );
    const { cart, userErrors } = data.cartCreate;
    if (userErrors.length) throw new Error(userErrors.map((e) => e.message).join("; "));
    return cart.checkoutUrl;
  }

  return { enabled, getProducts, createCheckout };
})();
