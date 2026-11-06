/*
 * Alto & Co. — configuración de la tienda
 *
 * Mientras shopDomain o storefrontToken estén vacíos, el sitio corre en
 * MODO DEMO con productos de ejemplo (no se puede pagar).
 *
 * Para conectar tu tienda Shopify (ver README.md):
 *   shopDomain:      "tu-tienda.myshopify.com"
 *   storefrontToken: token PÚBLICO de la Storefront API (canal "Headless")
 *
 * El token público de Storefront está pensado para usarse en el navegador;
 * NUNCA pongas aquí un token de la Admin API ni claves privadas.
 */
window.ALTO_CONFIG = {
  shopDomain: "",
  storefrontToken: "",
  apiVersion: "2026-07",

  // Envío gratis en todo Canadá a partir de este subtotal (CAD).
  // Debe coincidir con la tarifa configurada en Shopify > Envío.
  freeShippingThreshold: 150,

  // Fotos de la portada: la primera es la grande (izquierda), las otras dos van a la derecha.
  heroImages: [
    { src: "assets/img/tee-rancher-lifestyle.jpg", alt: "Little Rancher Tee and cap at sunset", link: "#/product/little-rancher-tee", position: "center 30%" },
    { src: "assets/img/cap-rider.jpg", alt: "Rider Cap", link: "#/product/rider-cap" },
    { src: "assets/img/tee-heritage-back.jpg", alt: "Heritage in Motion Tee", link: "#/product/heritage-in-motion-tee", position: "center 38%" },
  ],

  // Enlace del formulario de Formspree (https://formspree.io/f/xxxx).
  // Mientras esté vacío, los formularios de correo no se muestran.
  signupEndpoint: "",

  defaultLang: "en", // "en" o "fr"
  contactEmail: "hello@altoandco.ca",
};
