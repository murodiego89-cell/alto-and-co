# Alto & Co. — tienda online

Sitio a medida (HTML/CSS/JS, sin dependencias) conectado a **Shopify** como motor:
Shopify guarda productos e inventario y procesa los pagos en su checkout seguro.

- 🇨🇦 Vende en todo Canadá: precios en **CAD**, GST/HST/PST según la provincia y envío a las 13 provincias y territorios.
- 💳 Acepta Visa, Mastercard, American Express, Discover, JCB, débito Visa/Mastercard, Apple Pay, Google Pay y Shop Pay.
- 🇫🇷 Bilingüe **inglés / francés** (botón EN/FR), algo importante para vender en Québec.
- 📱 Diseño responsive con carrito lateral, filtros, orden por precio, selector de talla y color, y barra de envío gratis.

## Estructura

```
index.html              Página única; la navegación usa #/rutas
assets/config.js        ← AQUÍ conectas tu tienda Shopify
assets/shopify.js       Cliente de la Storefront API (productos + checkout)
assets/app.js           Vistas, carrito y navegación
assets/i18n.js          Textos EN / FR
assets/demo-products.js Productos de ejemplo (solo en modo demo)
assets/styles.css       Estilos
```

Mientras `config.js` no tenga datos, el sitio corre en **modo demo**: muestra productos
de ejemplo y el botón de pago avisa que falta conectar Shopify.

## 1. Configurar Shopify (una sola vez)

1. Crea la tienda en <https://www.shopify.com/ca>. El plan **Basic** es suficiente para empezar.
2. **Settings → Payments**: activa **Shopify Payments**. Así se habilitan las tarjetas de crédito y débito,
   Apple Pay, Google Pay y Shop Pay. Tendrás que dar los datos de tu negocio y tu cuenta bancaria canadiense.
3. **Settings → Markets**: el mercado principal debe ser **Canada** y la moneda **CAD**.
4. **Settings → Taxes and duties → Canada**: registra tus números de GST/HST (y de PST/QST si aplican).
   Shopify calcula el impuesto de cada provincia automáticamente.
5. **Settings → Shipping and delivery**: crea una zona “Canada” con tus tarifas.
   Para que coincida con el sitio, agrega una tarifa **gratis para pedidos de $150 o más**
   (o cambia `freeShippingThreshold` en `config.js`).
6. **Settings → Languages**: agrega **French** y traduce los productos con la app gratuita *Translate & Adapt*.
   El sitio pide los textos a Shopify en el idioma que tenga elegido el cliente.
7. **Products**: crea tus productos.
   - **Product type** = categoría (`Women`, `Men`, `Accessories`…). Con eso se arman los filtros.
   - Opciones de variante **Size** y **Color**.
   - Etiquetas (tags) opcionales: `featured` (aparece en la portada) y `new` (lleva la etiqueta “New”).
   - Para mostrar un producto en oferta, llena el campo *Compare-at price*.
8. Instala la app **Headless** (de Shopify, gratuita) → *Create storefront* → copia el
   **Public access token** de la Storefront API.
9. Abre `assets/config.js` y completa:

   ```js
   shopDomain: "alto-and-co.myshopify.com",
   storefrontToken: "el-token-publico",
   ```

   ⚠️ Usa solo el token **público** de Storefront. Nunca pongas un token de la Admin API en este archivo.

Al conectarlo, el sitio carga tus productos reales y el botón **Secure checkout**
lleva al cliente al checkout de Shopify, donde paga con su tarjeta.

## 2. Publicar el sitio en altoandco.ca

| Dirección | Qué muestra |
|---|---|
| `https://altoandco.ca` | La tienda (dirección principal) |
| `https://www.altoandco.ca` | Redirige automáticamente a `altoandco.ca` |
| `https://checkout.altoandco.ca` | El checkout de pago de Shopify |

### a) Comprar el dominio
Registra **altoandco.ca** (~$15–20 CAD/año) en un registrador certificado por CIRA
(Namecheap, GoDaddy, Rebel, etc.). Un `.ca` exige tener presencia en Canadá (ser residente, ciudadano o empresa canadiense).

### b) Subir el sitio a Netlify (gratis)
1. Entra a <https://app.netlify.com/drop> y arrastra la carpeta **Alto&Co.** completa.
2. **Domain management → Add a domain** → escribe `altoandco.ca`. Netlify agrega `www.altoandco.ca` por su cuenta;
   deja `altoandco.ca` como **primary domain**. El archivo `_redirects` del proyecto manda `www` → `altoandco.ca`.
3. Netlify te da 4 *nameservers* (`dns1.p0X.nsone.net`…). Ponlos en tu registrador, en la sección
   *Nameservers / DNS*. El cambio tarda entre unos minutos y 24 horas.
4. **HTTPS** (el candado) se activa automáticamente y es gratis.

> Si prefieres no cambiar los nameservers, crea en tu registrador:
> `A  @  75.2.60.5` y `CNAME  www  <tu-sitio>.netlify.app`.

### c) Checkout con tu dominio (Shopify)
1. En Shopify: **Settings → Domains → Connect existing domain** → `checkout.altoandco.ca`.
2. En el DNS (Netlify → *Domains → altoandco.ca → DNS records*) agrega:
   `CNAME  checkout  shops.myshopify.com`.
3. Vuelve a Shopify, pulsa **Verify connection** y deja ese dominio como principal de la tienda.

### d) Email `hello@altoandco.ca` (opcional)
El sitio muestra `hello@altoandco.ca` como contacto. Para recibir correos en esa dirección, usa
Google Workspace o Zoho Mail. También sirve un reenvío gratuito como ImprovMX, que pasa los mensajes a tu Gmail.
Agrega en el DNS los registros MX que te indique el servicio.

Archivos incluidos para el dominio: `_redirects` (www → sin www), `robots.txt` y `sitemap.xml`.
`index.html` declara `https://altoandco.ca/` como dirección canónica y trae vista previa para redes sociales.

## 3. Probarlo localmente

Abre `index.html` con doble clic en el navegador. No necesita servidor.

## Pendientes recomendados antes de lanzar

- [ ] Fotos reales de producto (se cargan desde Shopify).
- [ ] Páginas de **Política de privacidad**, **Términos** y **Reembolsos**. Shopify las genera en
      *Settings → Policies*; enlázalas en el footer.
- [ ] Newsletter: el formulario del footer solo muestra un mensaje de confirmación. Conéctalo a Shopify Email
      o Klaviyo, con consentimiento explícito como exige la ley anti-spam de Canadá (CASL).
- [ ] Revisar las traducciones al francés de `assets/i18n.js` con un hablante nativo.
- [ ] Hacer un pedido de prueba con el *test mode* de Shopify Payments.

> Nota: Interac Online no está disponible en el checkout web de Shopify. Las tarjetas de débito
> Visa y Mastercard sí funcionan, y Apple Pay / Google Pay pueden usar tarjetas de débito.
