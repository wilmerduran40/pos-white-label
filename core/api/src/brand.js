'use strict';

// ---------------------------------------------------------------------------
// Configuración de marca (white-label).
//
// Un único panel.html/login.html sirve a todas las marcas. Los valores que
// cambian por local se resuelven aquí, desde variables de entorno, y se
// publican al navegador en GET /admin/brand.js como `window.BRAND`.
//
// Los assets (logo, favicon, marca de agua) se copian a nombres FIJOS en
// build-time (ver Dockerfile, ARG BRAND), por lo que el HTML no cambia.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

// Paletas por defecto (idénticas al tema actual, para no alterar la apariencia
// cuando una marca no define color propio).
const DEFAULT_ORANGE = {
  50: '#FBF0F1', 100: '#F7E0E2', 200: '#F0C3C6', 300: '#E49A9E',
  400: '#D45E64', 500: '#BF0B1A', 600: '#A80917', 700: '#730710',
  800: '#5A060D', 900: '#400509',
};
const DEFAULT_GOLD = {
  50: '#FDF8E3', 100: '#FBF0C2', 200: '#F7E69B', 300: '#F2D335',
  400: '#E0BE2F', 500: '#C9A92A', 600: '#A69129', 700: '#88701F',
  800: '#6A5618', 900: '#4B3D11',
};

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function parseHex(hex) {
  let h = String(hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex(rgb) {
  const to = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + to(rgb.r) + to(rgb.g) + to(rgb.b);
}

// Mezcla un color con blanco (t>0) o negro (t<0). t en [-1, 1].
function mix(hex, t) {
  const c = parseHex(hex);
  if (!c) return hex;
  const target = t >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const k = Math.abs(t);
  return toHex({
    r: c.r + (target.r - c.r) * k,
    g: c.g + (target.g - c.g) * k,
    b: c.b + (target.b - c.b) * k,
  });
}

// Genera una escala 50..900 a partir de un color base (que queda en 500).
function scale(baseHex) {
  const base = parseHex(baseHex) ? toHex(parseHex(baseHex)) : '#BF0B1A';
  return {
    50: mix(base, 0.95),
    100: mix(base, 0.88),
    200: mix(base, 0.72),
    300: mix(base, 0.52),
    400: mix(base, 0.26),
    500: base,
    600: mix(base, -0.16),
    700: mix(base, -0.34),
    800: mix(base, -0.5),
    900: mix(base, -0.65),
  };
}

function env(name) {
  const v = process.env[name];
  return v === undefined || v === null ? '' : String(v).trim();
}

// ¿Existe el asset en el volumen/servido por la API? (para la marca de agua)
function assetExists(file) {
  try {
    const dir = path.join(__dirname, '..', 'public', 'img');
    return fs.existsSync(path.join(dir, file));
  } catch (e) {
    return false;
  }
}

function getBrand() {
  const name = env('BRAND_NAME') || 'KIKI Fast Food';
  const slug = env('BRAND_SLUG') || 'kiki';
  const primary = env('BRAND_PRIMARY') || '#DC143C';

  const watermark = assetExists('logo-watermark.png')
    ? '/admin/img/logo-watermark.png'
    : '/admin/img/logo.png';

  return {
    slug,
    name,
    shortName: env('BRAND_SHORT') || name,
    tagline: env('BRAND_TAGLINE') || 'Panel de pedidos',
    colors: {
      brand: scale(primary),
      orange: env('BRAND_ORANGE') ? scale(env('BRAND_ORANGE')) : DEFAULT_ORANGE,
      gold: env('BRAND_GOLD') ? scale(env('BRAND_GOLD')) : DEFAULT_GOLD,
      primary,
    },
    assets: {
      logo: '/admin/img/logo.png',
      favicon: '/admin/img/favicon.png',
      watermark,
    },
    contact: {
      whatsapp: env('BRAND_WHATSAPP'),
      address: env('BRAND_ADDRESS'),
      instagram: env('BRAND_INSTAGRAM'),
      mapsUrl: env('BRAND_MAPS_URL'),
    },
  };
}

// Script que consume el panel/login. Debe ejecutarse de forma SÍNCRONA antes de
// configurar Tailwind para poder construir los colores de marca.
function brandScript() {
  return 'window.BRAND=' + JSON.stringify(getBrand()) + ';';
}

module.exports = { getBrand, brandScript };
