const db = require('_helpers/db');
const logWorkflow = require('_helpers/workflow-logger');

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  getRequestsByApprover,
  updateStatus
};

const ALLOWED_TYPES = ['equipment', 'leave', 'resources'];
const ALLOWED_STATUS = ['pending', 'approved', 'disapproved', 'rejected', 'draft'];

/**
 * Return all requests (include Account + Approver)
 */
async function getAll() {
  return await db.Request.findAll({
    include: [
      { model: db.Account, as: 'Account', attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: db.Account, as: 'Approver', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ],
    order: [['created', 'DESC']]
  });
}

/**
 * Get request by ID
 */
async function getById(id) {
  return await db.Request.findByPk(id, {
    include: [
      { model: db.Account, as: 'Account', attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: db.Account, as: 'Approver', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });
}

/**
 * Helpers
 */
async function resolveAccountIdFromEmail(email) {
  if (!email) return null;
  const account = await db.Account.findOne({ where: { email } });
  return account ? account.id : null;
}

async function resolveEmployeeFromAccount(accountId) {
  if (!accountId) return null;
  return await db.Employee.findOne({ where: { accountId } });
}

/**
 * Create a request
 */
async function create(params) {
  let accountId = params.accountId || null;

  if (!accountId && params.employeeEmail)
    accountId = await resolveAccountIdFromEmail(params.employeeEmail);

  if (!accountId) throw 'accountId is required';
  if (!ALLOWED_TYPES.includes(params.type)) throw 'Invalid request type';

  // Make items always a plain user-friendly string
  const itemsValue = String(params.items || '').trim();
  if (!itemsValue) throw 'items cannot be empty';

  const qty = Number(params.quantity || 1);
  if (!Number.isFinite(qty) || qty < 1) throw 'quantity must be >= 1';

  // Find approver automatically
  let approverId = null;
  const employee = await resolveEmployeeFromAccount(accountId);
  if (employee && employee.headEmployeeId) {
    const head = await db.Employee.findByPk(employee.headEmployeeId);
    if (head && head.accountId) approverId = head.accountId;
  }

  const status =
    params.status && ALLOWED_STATUS.includes(params.status)
      ? params.status
      : 'draft';

  const request = await db.Request.create({
    accountId,
    approverId,
    type: params.type,
    items: itemsValue,
    quantity: Math.trunc(qty),
    status,
    created: new Date()
  });

  if (employee) {
    await logWorkflow(
      employee.EmployeeID,
      'Request Created',
      `Request #${request.requestId} (${request.type}) created for "${request.items}" x${request.quantity}`
    );
  }

  return await getById(request.requestId);
}

/**
 * Update a request (full or partial)
 */
async function update(id, params) {
  const request = await db.Request.findByPk(id);
  if (!request) throw 'Request not found';

  if (params.type && !ALLOWED_TYPES.includes(params.type)) throw 'Invalid type';
  if (params.status && !ALLOWED_STATUS.includes(params.status)) throw 'Invalid status';

  if (params.items !== undefined) {
    const clean = String(params.items || '').trim();
    if (!clean) throw 'items cannot be empty';
    request.items = clean;
  }

  if (params.quantity !== undefined) {
    const q = Number(params.quantity);
    if (!Number.isFinite(q) || q < 1) throw 'quantity must be >= 1';
    request.quantity = Math.trunc(q);
  }

  if (params.accountId !== undefined) request.accountId = params.accountId;
  if (params.approverId !== undefined) request.approverId = params.approverId;
  if (params.type !== undefined) request.type = params.type;
  if (params.status !== undefined) request.status = params.status;

  request.updated = new Date();
  await request.save();

  return await getById(request.requestId);
}

/**
 * Update only the status (approve/reject)
 */
async function updateStatus(id, status) {
  const request = await db.Request.findByPk(id);
  if (!request) throw 'Request not found';
  if (!ALLOWED_STATUS.includes(status)) throw 'Invalid status';

  request.status = status;
  request.updated = new Date();
  await request.save();

  // log workflow if possible (non-fatal)
  try {
    const employee = await resolveEmployeeFromAccount(request.accountId);
    if (employee) {
      await logWorkflow(
        employee.EmployeeID,
        `Request ${status}`,
        `Request #${request.requestId} set to ${status}`
      );
    }
  } catch (e) {
    console.warn('logWorkflow failed', e);
  }

  return await getById(request.requestId);
}

/**
 * Delete
 */
async function _delete(id) {
  const request = await db.Request.findByPk(id);
  if (!request) throw 'Request not found';
  await request.destroy();
}

/**
 * Get requests by approver
 *
 * Minimal change: exclude draft status so managers do not see drafts.
 */
async function getRequestsByApprover(approverAccountId) {
  if (!approverAccountId) return [];
  // Sequelize where clause filtering out drafts
  const Op = db.Sequelize ? db.Sequelize.Op : require('sequelize').Op;
  return await db.Request.findAll({
    where: {
      approverId: approverAccountId,
      status: { [Op.ne]: 'draft' } // exclude drafts
    },
    include: [{ model: db.Account, as: 'Account', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['created', 'DESC']]
  });
}
