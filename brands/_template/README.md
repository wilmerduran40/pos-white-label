# Plantilla de marca nueva

Copia esta carpeta para registrar un local nuevo sin tocar el core.

## Pasos

1. Copia `brands/_template` → `brands/<slug>` (ej: `brands/azucar`).
2. Sube en `panel-assets/` (nombres fijos):
   - `logo.png`          → logo del panel (splash, fondo del login)
   - `favicon.png`       → ícono de pestaña
   - `logo-watermark.png`→ opcional; si no existe se usa `logo.png` como marca de agua
3. Reemplaza `index.html` y `menu.html` por los del local (plantilla: los de
   cualquier marca existente). Pon también su `css/`, `data/menu.js` (respaldo
   del menú) e `img/` (fotos del menú).
4. Edita `seed.sql`: menú/inventario de la marca (ver `brands/kiki/seed.sql`).
5. Configura la app en Dokploy con `BRAND=<slug>` y estas variables:

| Variable | Ejemplo |
|---|---|
| `BRAND` | `azucar` (obligatoria, controla el build) |
| `BRAND_NAME` | `Azúcar & Especias` |
| `BRAND_SHORT` | `Azúcar` |
| `BRAND_PRIMARY` | `#B45309` (color de acento) |
| `BRAND_WHATSAPP` / `BRAND_ADDRESS` / `BRAND_INSTAGRAM` / `BRAND_MAPS_URL` | contacto |

> El `panel.html`/`login.html` son **idénticos** para todas las marcas. Si algo
> necesita variar por marca (nombres, colores, contactos) se hace por
> variables/`brand.js`, nunca editando el panel.