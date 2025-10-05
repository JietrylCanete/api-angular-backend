const db = require('_helpers/db');
const logWorkflow = require('_helpers/workflow-logger');

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

const ALLOWED_TYPES = ['equipment', 'leave', 'resources'];
const ALLOWED_STATUS = ['pending', 'approved', 'disapproved', 'rejected'];

async function getAll() {
  return await db.Request.findAll({
    include: [{ 
      model: db.Account, 
      attributes: ['id', 'email', 'firstName', 'lastName'], 
      required: false 
    }],
    order: [['created', 'DESC']]
  });
}

async function getById(id) {
  if (!id) return null;
  return await db.Request.findByPk(id, {
    include: [{ 
      model: db.Account, 
      attributes: ['id', 'email', 'firstName', 'lastName'], 
      required: false 
    }]
  });
}

async function resolveAccountIdFromEmail(email) {
  if (!email) return null;
  const account = await db.Account.findOne({ where: { email } });
  return account ? account.id : null;
}

async function resolveEmployeeFromAccount(accountId) {
  if (!accountId) return null;
  return await db.Employee.findOne({ where: { accountId } });
}

async function create(params) {
  let accountId = params.accountId || null;
  
  if (!accountId && params.employeeEmail) {
    accountId = await resolveAccountIdFromEmail(params.employeeEmail);
  }

  if (!accountId) throw 'accountId is required';

  if (!ALLOWED_TYPES.includes(params.type)) {
    throw 'Invalid request type';
  }

  if (!params.items || String(params.items).trim() === '') {
    throw 'items is required';
  }

  const qty = Number(params.quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    throw 'quantity must be an integer >= 1';
  }

  if (params.status && !ALLOWED_STATUS.includes(params.status)) {
    throw 'Invalid status';
  }

  const request = await db.Request.create({
    accountId,
    type: params.type,
    items: String(params.items).trim(),
    quantity: Math.trunc(qty),
    status: params.status || 'pending',
    created: new Date()
  });

  const employee = await resolveEmployeeFromAccount(accountId);
  if (employee) {
    await logWorkflow(
      employee.EmployeeID,
      'Request Created',
      `Request #${request.id} (${request.type}) created for ${request.items} x${request.quantity}`
    );
  }

  return await getById(request.id);
}

async function update(id, params) {
  const request = await db.Request.findByPk(id);
  if (!request) throw 'Request not found';

  if (!params.accountId && params.employeeEmail) {
    const resolved = await resolveAccountIdFromEmail(params.employeeEmail);
    if (resolved) params.accountId = resolved;
  }

  if (params.accountId && params.accountId !== request.accountId) {
    const account = await db.Account.findByPk(params.accountId);
    if (!account) throw 'Related account not found for new accountId';
  }

  if (params.type && !ALLOWED_TYPES.includes(params.type)) {
    throw 'Invalid request type';
  }
  
  if (params.status && !ALLOWED_STATUS.includes(params.status)) {
    throw 'Invalid status';
  }

  if (params.items !== undefined) {
    if (!params.items || String(params.items).trim() === '') {
      throw 'items cannot be empty';
    }
    request.items = String(params.items).trim();
  }

  if (params.quantity !== undefined) {
    const qty = Number(params.quantity);
    if (!Number.isFinite(qty) || qty < 1) throw 'quantity must be an integer >= 1';
    request.quantity = Math.trunc(qty);
  }

  const allowed = ['accountId', 'type', 'status'];
  allowed.forEach(field => {
    if (params[field] !== undefined) {
      request[field] = params[field];
    }
  });

  request.updated = new Date();
  await request.save();

  const employee = await resolveEmployeeFromAccount(request.accountId);
  if (employee) {
    await logWorkflow(
      employee.EmployeeID,
      'Request Updated',
      `Request #${request.id} updated (status: ${request.status})`
    );
  }

  return await getById(request.id);
}

async function _delete(id) {
  const request = await db.Request.findByPk(id);
  if (!request) throw 'Request not found';
  
  const employee = await resolveEmployeeFromAccount(request.accountId);
  
  await request.destroy();

  if (employee) {
    await logWorkflow(
      employee.EmployeeID,
      'Request Deleted',
      `Request #${id} was deleted`
    );
  }
}