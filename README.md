# POS White-Label — un solo panel admin para todas las marcas

Monorepo que unifica los proyectos **KIKI Fast Food**, **AsisNexo** y **Juos**
en un solo core. El panel admin (`/admin`) y la API son **compartidos e
idénticos** para todas las marcas; por marca solo cambian los assets, el sitio
estático (`index.html`, `menu.html`) y la semilla de datos.

## Estructura

```
core/
  api/        → API Express + panel admin compartido (panel.html, login.html)
  web/        → nginx (proxy /api y /admin hacia el core)
  print-agent → agente impresor local
brands/
  kiki/  asisnexo/  juos/     → sitio de cada local (index, menu, css, data, img,
                                 panel-assets, seed.sql, brand.json)
  _template/                   → plantilla para registrar una marca nueva
```

## Features del panel unificado

- POS / Nuevo pedido, En vivo, **Cocina** (KDS), Historial, Estadísticas,
  Impresora, Delivery, Usuarios, Menú, Inventario (de KIKI).
- **Plano de mesas con áreas, objetos y drag & drop** (aportado por Juos).
- Comprobantes de pago (`receipt`, `pm_ref`, `pm_amount`) y asignación de
  método de pago.
- **White-label por variables de entorno**: `GET /admin/brand.js` publica
  `window.BRAND` (nombre, colores, contacto, assets) y el mismo `panel.html`
  se sirve en todas las marcas.

## Desplegar una marca en Dokploy

1. Clona este repo en Dokploy (app Compose).
2. Crea una carpeta por marca en `brands/<slug>` (copia `_template`).
3. Define las variables de la app: `BRAND`, `BRAND_NAME`, `BRAND_PRIMARY`,
   contactos y los secretos usuales (`ADMIN_PASSWORD`, `ORDER_TOKEN`,
   `AGENT_TOKEN`, `SESSION_SECRET`, `POSTGRES_*`).
4. El build empaqueta `brands/$BRAND` (assets + sitio + semilla) sobre el core.

Ver `.env.example` para todas las variables.

## Migraciones

`core/api/db/migrations/` es una secuencia única (001–015) de solo esquema.
Los datos por marca viven en `brands/<slug>/seed.sql` (se aplican una sola vez,
marcador `brand_seed:<slug>`), así un local nunca recibe datos de otro.

## Desarrollar localmente

```bash
cd core/api
npm install
DATABASE_URL=postgres://pos:pass@localhost:5432/pos \
ADMIN_PASSWORD=... ORDER_TOKEN=... AGENT_TOKEN=... SESSION_SECRET=... \
BRAND=kiki BRAND_NAME="KIKI Fast Food" BRAND_PRIMARY="#DC143C" \
npm start
```

> Para empaquetar el seed de la marca en local, copia `brands/<slug>/seed.sql`
> a `core/api/db/brand_seed.sql` (el Dockerfile lo hace automáticamente).