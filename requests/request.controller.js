// requests/request.controller.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const requestService = require('./request.service');

// Routes
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', createSchema, create);
router.put('/:id', updateSchema, update);
router.delete('/:id', _delete);

module.exports = router;

// Schema definitions
function createSchema(req, res, next) {
  const schema = Joi.object({
    accountId: Joi.number().required(),
    employeeEmail: Joi.string().email().optional(),
    type: Joi.string().valid('equipment', 'leave', 'resources').required(),
    items: Joi.string().trim().min(1).required(),
    quantity: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('pending', 'approved', 'disapproved', 'rejected').optional()
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    accountId: Joi.number().optional(),
    employeeEmail: Joi.string().email().optional(),
    type: Joi.string().valid('equipment', 'leave', 'resources').optional(),
    items: Joi.string().trim().min(1).optional(),
    quantity: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('pending', 'approved', 'disapproved', 'rejected').optional()
  });
  validateRequest(req, next, schema);
}

// Route handlers
async function getAll(req, res, next) {
  try {
    const requests = await requestService.getAll();
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const request = await requestService.getById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const request = await requestService.create(req.body);
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const request = await requestService.update(req.params.id, req.body);
    res.json(request);
  } catch (err) {
    next(err);
  }
}

async function _delete(req, res, next) {
  try {
    await requestService.delete(req.params.id);
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    next(err);
  }
}