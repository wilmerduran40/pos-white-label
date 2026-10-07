'use strict';

// CRUD de mesas del local.
//
// Antes las mesas eran fijas (1-12). Ahora viven en la tabla `tables` y el admin
// puede crear/editar/eliminar mesas desde el panel:
//
//   R      GET    /api/tables            (admin, mesero) listar con pedidos activos
//   C      POST   /api/tables            (admin) crear mesa
//   U      PUT    /api/tables/:no        (admin) editar mesa
//   P      PATCH  /api/tables/:no/position (admin) guardar posición al arrastrar
//   D      DELETE /api/tables/:no        (admin) eliminar (solo sin pedidos activos)
//
// El GET mantiene la forma que esperaba el panel (`tables[].orders`) para no
// romper la pestaña Mesas.

const express = require('express');
const { query } = require('../db');
const { requireRole, requireAdmin } = require('../auth');
const { wrap } = require('../http');

const router = express.Router();

const TABLE_COLS = 'id, no, name, capacity, active, area_id, pos_x, pos_y, shape, width, height, rotation, created_at, updated_at';

const SHAPES = ['round', 'square', 'rect'];
const SHAPE_DIMS = { round: [120, 120], square: [96, 96], rect: [180, 96] };

// Cuadrícula usada para auto-colocar una mesa nueva dentro de su área cuando
// el cliente no manda posición explícita.
const SLOT_COLS = 4, SLOT_GAP = 200, SLOT_Y = 180, SLOT_OFF = 40;

function clampNum(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

function mapTable(row) {
  return {
    id: row.id,
    no: row.no,
    name: row.name,
    capacity: row.capacity,
    active: row.active,
    areaId: row.area_id,
    posX: row.pos_x,
    posY: row.pos_y,
    shape: row.shape,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Estados que cuentan como "pedido activo" en una mesa (mismos que usaba el
// GET /api/tables original).
const ACTIVE_TABLE_STATUSES = ['nuevo', 'pago_confirmado', 'en_cola', 'impreso'];

async function getTableByNo(no) {
  const { rows } = await query(`SELECT ${TABLE_COLS} FROM tables WHERE no = $1`, [no]);
  return rows[0] || null;
}

function bad(msg) {
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

function notFound() {
  const err = new Error('Mesa no encontrada.');
  err.status = 404;
  throw err;
}

function sanitize(body, existing) {
  const cur = existing || { name: '', capacity: 1, active: true, shape: 'square', width: 0, height: 0, area_id: null };
  const pick = (f, fallback) => (body && body[f] !== undefined ? body[f] : fallback);

  let no = existing ? existing.no : Number(pick('no', null));
  if (!Number.isInteger(no) || no <= 0) {
    bad('El número de mesa debe ser un entero positivo.');
  }

  let name = String(pick('name', cur.name)).trim();
  if (!name) name = 'Mesa ' + no;

  let capacity = Number(pick('capacity', cur.capacity));
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
    bad('La capacidad debe ser un entero entre 1 y 100.');
  }

  // ---- Área (la existencia se valida en la ruta con resolveAreaId) ----
  let areaId = pick('areaId', cur.area_id);
  areaId = (areaId === null || areaId === undefined || areaId === '') ? null : Number(areaId);

  // ---- Layout del plano ----
  let shape = String(pick('shape', cur.shape)).toLowerCase();
  if (!SHAPES.includes(shape)) shape = 'square';

  let posX = clampNum(pick('posX', cur.pos_x), 0, 100000, 0);
  let posY = clampNum(pick('posY', cur.pos_y), 0, 100000, 0);

  const def = SHAPE_DIMS[shape];
  let width = clampNum(pick('width', cur.width), 0, 5000, def[0]);
  let height = clampNum(pick('height', cur.height), 0, 5000, def[1]);
  if (!width) width = def[0];
  if (!height) height = def[1];

  let rotation = Math.round(clampNum(pick('rotation', cur.rotation), -360, 720, 0));
  rotation = ((rotation % 360) + 360) % 360;

  return {
    no,
    name: name.slice(0, 80),
    capacity,
    active: pick('active', cur.active) ? true : false,
    areaId,
    posX,
    posY,
    shape,
    width,
    height,
    rotation,
  };
}

// Valida que el área exista y devuelve su id; si no se indicó, usa `fallback`.
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

// Primera posición libre aproximada (cuadrícula 4 columnas) dentro del área.
async function nextPositionForArea(areaId) {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM tables WHERE area_id = $1', [areaId]);
  const i = rows[0].n;
  return {
    x: SLOT_OFF + (i % SLOT_COLS) * SLOT_GAP,
    y: SLOT_OFF + Math.floor(i / SLOT_COLS) * SLOT_Y,
  };
}

// ---------------------------------------------------------------------------
// R — GET /api/tables (admin, mesero)
// ---------------------------------------------------------------------------
router.get('/tables', requireRole('admin', 'mesero'),
  wrap(async (req, res) => {
    const params = [];
    let where = '';
    if (req.query.area !== undefined && req.query.area !== '') {
      const areaId = Number(req.query.area);
      if (Number.isInteger(areaId) && areaId > 0) {
        params.push(areaId);
        where = ' WHERE area_id = $1';
      }
    }
    const tables = await query(`SELECT ${TABLE_COLS} FROM tables${where} ORDER BY no ASC`, params);
    if (!tables.rows.length) {
      return res.json({ tables: [] });
    }
    const { rows } = await query(
      `SELECT * FROM orders
       WHERE delivery_type = 'local' AND table_no IS NOT NULL
         AND (status = ANY($1::text[]) OR (status = 'completado' AND paid_at IS NULL))
       ORDER BY table_no ASC, created_at ASC, id ASC`,
      [ACTIVE_TABLE_STATUSES]
    );
    const byTable = new Map();
    for (const row of rows) {
      if (!byTable.has(row.table_no)) byTable.set(row.table_no, []);
      byTable.get(row.table_no).push(mapOrder(row));
    }
    res.json({
      tables: tables.rows.map((t) => ({
        ...mapTable(t),
        orders: byTable.get(t.no) || [],
      })),
    });
  })
);

function mapOrder(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    address: row.address,
    phone: row.phone,
    source: row.source,
    waiter: row.waiter,
    tableNo: row.table_no,
    deliveryType: row.delivery_type,
    paymentMethod: row.payment_method,
    total: Number(row.total),
    items: row.items,
    status: row.status,
    paidAt: row.paid_at,
    printedAt: row.printed_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    kitchenReadyAt: row.kitchen_ready_at || null,
  };
}

// ---------------------------------------------------------------------------
// C — POST /api/tables (admin)
// ---------------------------------------------------------------------------
router.post('/tables', requireAdmin, wrap(async (req, res) => {
  const t = sanitize(req.body, null);
  t.areaId = await resolveAreaId(t.areaId, await defaultAreaId());
  if (t.areaId === null) bad('No hay áreas configuradas. Crea un área primero.');

  const existing = await getTableByNo(t.no);
  if (existing) {
    return res.status(409).json({ error: `Ya existe la mesa ${t.no} (${existing.name}).` });
  }

  // Si el cliente no manda posición, se auto-coloca dentro del área.
  const body = req.body || {};
  if (body.posX === undefined && body.posY === undefined) {
    const p = await nextPositionForArea(t.areaId);
    t.posX = p.x;
    t.posY = p.y;
  }

  const { rows } = await query(
    `INSERT INTO tables (no, name, capacity, active, area_id, pos_x, pos_y, shape, width, height, rotation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${TABLE_COLS}`,
    [t.no, t.name, t.capacity, t.active, t.areaId, t.posX, t.posY, t.shape, t.width, t.height, t.rotation]
  );
  res.status(201).json({ table: mapTable(rows[0]) });
}));

// ---------------------------------------------------------------------------
// U — PUT /api/tables/:no (admin)
// ---------------------------------------------------------------------------
router.put('/tables/:no', requireAdmin, wrap(async (req, res) => {
  const no = Number(req.params.no);
  if (!Number.isInteger(no) || no <= 0) bad('Número de mesa inválido.');
  const existing = await getTableByNo(no);
  if (!existing) notFound();

  // Si se cambia el número, verifica que el nuevo no esté ocupado por otra mesa.
  const body = req.body || {};
  const newNo = Number(body.no !== undefined ? body.no : existing.no);
  if (Number.isInteger(newNo) && newNo > 0 && newNo !== no) {
    const clash = await getTableByNo(newNo);
    if (clash) {
      return res.status(409).json({ error: `Ya existe la mesa ${newNo} (${clash.name}).` });
    }
  }

  const t = sanitize(body, existing);
  t.areaId = await resolveAreaId(t.areaId, existing.area_id);
  if (t.areaId === null) bad('No hay áreas configuradas. Crea un área primero.');
  const { rows } = await query(
    `UPDATE tables
     SET no = $1, name = $2, capacity = $3, active = $4, area_id = $5,
         pos_x = $6, pos_y = $7, shape = $8, width = $9, height = $10, rotation = $11,
         updated_at = now()
     WHERE id = $12
     RETURNING ${TABLE_COLS}`,
    [t.no, t.name, t.capacity, t.active, t.areaId, t.posX, t.posY, t.shape, t.width, t.height, t.rotation, existing.id]
  );
  res.json({ table: mapTable(rows[0]) });
}));

// ---------------------------------------------------------------------------
// PATCH /api/tables/:no/position (admin) — guardar la posición al arrastrar
// ---------------------------------------------------------------------------
router.patch('/tables/:no/position', requireAdmin, wrap(async (req, res) => {
  const no = Number(req.params.no);
  if (!Number.isInteger(no) || no <= 0) bad('Número de mesa inválido.');
  const existing = await getTableByNo(no);
  if (!existing) notFound();

  const b = req.body || {};
  const posX = clampNum(b.posX !== undefined ? b.posX : existing.pos_x, 0, 100000, existing.pos_x);
  const posY = clampNum(b.posY !== undefined ? b.posY : existing.pos_y, 0, 100000, existing.pos_y);

  const { rows } = await query(
    `UPDATE tables SET pos_x = $1, pos_y = $2, updated_at = now()
     WHERE id = $3 RETURNING ${TABLE_COLS}`,
    [posX, posY, existing.id]
  );
  res.json({ table: mapTable(rows[0]) });
}));

// ---------------------------------------------------------------------------
// D — DELETE /api/tables/:no (admin)
// ---------------------------------------------------------------------------
router.delete('/tables/:no', requireAdmin, wrap(async (req, res) => {
  const no = Number(req.params.no);
  if (!Number.isInteger(no) || no <= 0) bad('Número de mesa inválido.');
  const existing = await getTableByNo(no);
  if (!existing) notFound();

  // No se puede borrar una mesa con pedidos activos (no dejaría historial consistente).
  const active = await query(
    `SELECT id FROM orders
     WHERE table_no = $1
       AND (status = ANY($2::text[]) OR (status = 'completado' AND paid_at IS NULL))
     LIMIT 1`,
    [no, ACTIVE_TABLE_STATUSES]
  );
  if (active.rows.length) {
    const err = new Error(
      `La mesa ${no} tiene pedidos activos. Entrégalos o anúlalos antes de eliminarla.`
    );
    err.status = 409;
    throw err;
  }

  const { rowCount } = await query('DELETE FROM tables WHERE no = $1', [no]);
  if (!rowCount) notFound();
  res.json({ ok: true });
}));

module.exports = router;