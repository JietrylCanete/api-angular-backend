const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const requestService = require('./request.service');

// ---------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------
router.get('/', getAll);
router.get('/:id', getById);
router.get('/approver/:accountId', getByApprover);
router.post('/', createSchema, create);
router.put('/:id', updateSchema, update);
router.put('/:id/status', updateStatusSchema, updateStatus); // ✅ Approve/Reject endpoint
router.delete('/:id', _delete);

module.exports = router;

// ---------------------------------------------------------------------
// SCHEMAS
// ---------------------------------------------------------------------
function createSchema(req, res, next) {
  const schema = Joi.object({
    accountId: Joi.number().optional(),
    employeeEmail: Joi.string().email().optional(),
    type: Joi.string().valid('equipment', 'leave', 'resources').required(),
    items: Joi.alternatives().try(Joi.string(), Joi.array()).required(),
    quantity: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'draft').optional(),
    forApproval: Joi.boolean().optional()
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    accountId: Joi.number().optional(),
    employeeEmail: Joi.string().email().optional(),
    type: Joi.string().valid('equipment', 'leave', 'resources').optional(),
    items: Joi.alternatives().try(Joi.string(), Joi.array()).optional(),
    quantity: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'draft').optional(),
    approverId: Joi.number().optional()
  });
  validateRequest(req, next, schema);
}

function updateStatusSchema(req, res, next) {
  const schema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required()
  });
  validateRequest(req, next, schema);
}

// ---------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------
function create(req, res, next) {
  requestService.create(req.body)
    .then(r => res.status(201).json(r))
    .catch(next);
}

function update(req, res, next) {
  requestService.update(req.params.id, req.body)
    .then(r => res.json(r))
    .catch(next);
}

function updateStatus(req, res, next) {
  const id = req.params.id;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: 'Status is required' });

  requestService.updateStatus(id, status)
    .then(r => {
      if (!r) return res.status(404).json({ message: 'Request not found' });
      res.json({ message: `Request ${status} successfully`, request: r });
    })
    .catch(next);
}

function _delete(req, res, next) {
  requestService.delete(req.params.id)
    .then(() => res.json({ message: 'Request deleted successfully' }))
    .catch(next);
}

function getAll(req, res, next) {
  requestService.getAll()
    .then(rs => res.json(rs))
    .catch(next);
}

function getById(req, res, next) {
  requestService.getById(req.params.id)
    .then(r => (r ? res.json(r) : res.sendStatus(404)))
    .catch(next);
}

function getByApprover(req, res, next) {
  const accountId = Number(req.params.accountId);
  if (!accountId) return res.status(400).json({ message: 'accountId is required' });

  requestService.getRequestsByApprover(accountId)
    .then(rs => res.json(rs))
    .catch(next);
}
