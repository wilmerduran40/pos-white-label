'use strict';

// CRUD de objetos decorativos del plano de mesas.
//
// Son elementos fijos para que el plano también sirva como mapa real del local:
// puertas, ventanas, plantas, columnas, barra, mostrador/caja, cocina, baños,
// escaleras, escenario, basura y nevera/bodega.
//
//   R      GET    /api/objects?area=<id>  (admin, mesero) listar
//   C      POST   /api/objects            (admin) crear objeto
//   U      PUT    /api/objects/:id        (admin) editar
//   P      PATCH  /api/objects/:id/position (admin) guardar posición al arrastrar
//   D      DELETE /api/objects/:id        (admin) eliminar

const express = require('express');
const { query } = require('../db');
const { requireRole, requireAdmin } = require('../auth');
const { wrap } = require('../http');

const router = express.Router();

const OBJ_COLS = 'id, area_id, type, name, pos_x, pos_y, width, height, rotation, z_index, created_at, updated_at';

// Mismos tipos que el catálogo del panel; aquí solo se valida el nombre.
const TYPES = new Set([
  'door', 'window', 'plant', 'pillar', 'bar',
  'counter', 'kitchen', 'restroom', 'stairs', 'stage', 'trash', 'fridge',
]);

function clampNum(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

function mapObject(row) {
  return {
    id: row.id,
    areaId: row.area_id,
    type: row.type,
    name: row.name,
    posX: row.pos_x,
    posY: row.pos_y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    zIndex: row.z_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function bad(msg) {
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

function notFound() {
  const err = new Error('Objeto no encontrado.');
  err.status = 404;
  throw err;
}

async function getById(id) {
  const { rows } = await query(`SELECT ${OBJ_COLS} FROM floor_objects WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function resolveAreaId(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) bad('El área indicada no es válida.');
  const { rows } = await query('SELECT id FROM areas WHERE id = $1', [id]);
  if (!rows.length) bad('El área indicada no existe.');
  return rows[0].id;
}

async function defaultAreaId() {
  const { rows } = await query('SELECT id FROM areas ORDER BY sort_order ASC, id ASC LIMIT 1');
  return rows.length ? rows[0].id : null;
}

function sanitize(body, existing) {
  const cur = existing || { type: 'plant', name: '', pos_x: 0, pos_y: 0, width: 80, height: 80, rotation: 0, z_index: 1 };
  const pick = (f, fallback) => (body && body[f] !== undefined ? body[f] : fallback);

  let type = String(pick('type', cur.type)).toLowerCase();
  if (!TYPES.has(type)) bad('Tipo de objeto inválido.');

  let name = String(pick('name', cur.name)).trim();
  if (!name) name = type;

  const posX = clampNum(pick('posX', cur.pos_x), 0, 100000, 0);
  const posY = clampNum(pick('posY', cur.pos_y), 0, 100000, 0);
  const width = clampNum(pick('width', cur.width), 10, 8000, 80);
  const height = clampNum(pick('height', cur.height), 10, 8000, 80);
  let rotation = Math.round(clampNum(pick('rotation', cur.rotation), -360, 720, 0));
  rotation = ((rotation % 360) + 360) % 360;
  const zIndex = Math.round(clampNum(pick('zIndex', cur.z_index), 0, 100, 1));

  return { type, name: name.slice(0, 40), posX, posY, width, height, rotation, zIndex };
}

// ---------------------------------------------------------------------------
// R — GET /api/objects (admin, mesero)
// ---------------------------------------------------------------------------
router.get('/objects', requireRole('admin', 'mesero'), wrap(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.area !== undefined && req.query.area !== '') {
    const areaId = Number(req.query.area);
    if (Number.isInteger(areaId) && areaId > 0) {
      params.push(areaId);
      where = ' WHERE area_id = $1';
    }
  }
  const { rows } = await query(`SELECT ${OBJ_COLS} FROM floor_objects${where} ORDER BY z_index ASC, id ASC`, params);
  res.json({ objects: rows.map(mapObject) });
}));

// ---------------------------------------------------------------------------
// C — POST /api/objects (admin)
// ---------------------------------------------------------------------------
router.post('/objects', requireAdmin, wrap(async (req, res) => {
  const o = sanitize(req.body, null);
  o.areaId = await resolveAreaId(req.body && req.body.areaId, await defaultAreaId());
  if (o.areaId === null) bad('No hay áreas configuradas. Crea un área primero.');

  // Auto-colocar en hueco libre dentro del área si no se manda posición.
  const body = req.body || {};
  if (body.posX === undefined && body.posY === undefined) {
    const { rows } = await query(
      `SELECT COALESCE(MAX(pos_x), 0) AS maxx, COALESCE(MAX(pos_y), 0) AS maxy
         FROM floor_objects WHERE area_id = $1`, [o.areaId]
    );
    o.posX = Math.round(rows[0].maxx) + 40;
    o.posY = Math.round(rows[0].maxy) + 40;
  }

  const { rows } = await query(
    `INSERT INTO floor_objects (area_id, type, name, pos_x, pos_y, width, height, rotation, z_index)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${OBJ_COLS}`,
    [o.areaId, o.type, o.name, o.posX, o.posY, o.width, o.height, o.rotation, o.zIndex]
  );
  res.status(201).json({ object: mapObject(rows[0]) });
}));

// ---------------------------------------------------------------------------
// U — PUT /api/objects/:id (admin)
// ---------------------------------------------------------------------------
router.put('/objects/:id', requireAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) bad('Objeto inválido.');
  const existing = await getById(id);
  if (!existing) notFound();

  const o = sanitize(req.body || {}, existing);
  o.areaId = await resolveAreaId(req.body && req.body.areaId, existing.area_id);
  if (o.areaId === null) bad('No hay áreas configuradas. Crea un área primero.');

  const { rows } = await query(
    `UPDATE floor_objects
     SET area_id = $1, type = $2, name = $3, pos_x = $4, pos_y = $5,
         width = $6, height = $7, rotation = $8, z_index = $9, updated_at = now()
     WHERE id = $10
     RETURNING ${OBJ_COLS}`,
    [o.areaId, o.type, o.name, o.posX, o.posY, o.width, o.height, o.rotation, o.zIndex, id]
  );
  res.json({ object: mapObject(rows[0]) });
}));

// ---------------------------------------------------------------------------
// PATCH /api/objects/:id/position (admin) — guardar la posición al arrastrar
// ---------------------------------------------------------------------------
router.patch('/objects/:id/position', requireAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) bad('Objeto inválido.');
  const existing = await getById(id);
  if (!existing) notFound();

  const b = req.body || {};
  const posX = clampNum(b.posX !== undefined ? b.posX : existing.pos_x, 0, 100000, existing.pos_x);
  const posY = clampNum(b.posY !== undefined ? b.posY : existing.pos_y, 0, 100000, existing.pos_y);

  const { rows } = await query(
    `UPDATE floor_objects SET pos_x = $1, pos_y = $2, updated_at = now()
     WHERE id = $3 RETURNING ${OBJ_COLS}`,
    [posX, posY, id]
  );
  res.json({ object: mapObject(rows[0]) });
}));

// ---------------------------------------------------------------------------
// D — DELETE /api/objects/:id (admin)
// ---------------------------------------------------------------------------
router.delete('/objects/:id', requireAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) bad('Objeto inválido.');
  const existing = await getById(id);
  if (!existing) notFound();
  await query('DELETE FROM floor_objects WHERE id = $1', [id]);
  res.json({ ok: true });
}));

module.exports = router;