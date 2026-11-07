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

  // Video de la portada. "wide" es para computadora (16:9) y "tall" para celular (9:16).
  // Los poster se muestran mientras carga el video y a quien pidió reducir el movimiento.
  // Para cambiar el video, reemplaza estos archivos. Sin sonido, de 10 a 20 segundos y menos de 6 MB.
  heroVideo: {
    wide: "assets/video/hero-wide.mp4",
    tall: "assets/video/hero-tall.mp4",
    posterWide: "assets/video/hero-wide.jpg",
    posterTall: "assets/video/hero-tall.jpg",
  },

  // Enlace del formulario de Formspree (https://formspree.io/f/xxxx).
  // Mientras esté vacío, los formularios de correo no se muestran.
  signupEndpoint: "",

  // Ventana de código promocional. Deja code vacío para apagarla.
  // El código debe existir en Shopify > Discounts para que funcione en el checkout.
  // opensAt: fecha estimada de apertura para la cuenta regresiva. Vacía = sin cuenta regresiva.
  promo: {
    code: "ALTO10",
    delayMs: 3000,
    opensAt: "2027-06-01T09:00:00-04:00",
    image: "assets/img/tee-rancher-lifestyle.jpg",
  },

  defaultLang: "en", // "en" o "fr"
  contactEmail: "hello@altoandco.ca",
};
