// positions/position.service.js
const db = require('../_helpers/db'); // adjust path if your project stores db helper elsewhere

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

async function getAll() {
  return db.Position.findAll({ order: [['id', 'ASC']] });
}

async function getById(id) {
  return db.Position.findByPk(id);
}

async function create(params) {
  if (!params || !params.name) throw 'Position name is required';
  const existing = await db.Position.findOne({ where: { name: params.name }});
  if (existing) throw 'Position already exists';
  return db.Position.create({ name: params.name, status: params.status || 'active' });
}

async function update(id, params) {
  const pos = await db.Position.findByPk(id);
  if (!pos) throw 'Position not found';
  pos.name = params.name ?? pos.name;
  pos.status = params.status ?? pos.status;
  await pos.save();
  return pos;
}

async function _delete(id) {
  const pos = await db.Position.findByPk(id);
  if (!pos) throw 'Position not found';
  await pos.destroy();
}
