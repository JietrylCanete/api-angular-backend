// positions/position.controller.js
const express = require('express');
const router = express.Router();
const positionService = require('./position.service');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function getAll(req, res, next) {
  positionService.getAll()
    .then(positions => res.json(positions))
    .catch(next);
}

function getById(req, res, next) {
  positionService.getById(req.params.id)
    .then(p => p ? res.json(p) : res.status(404).json({ message: 'Not found' }))
    .catch(next);
}

function create(req, res, next) {
  positionService.create(req.body)
    .then(p => res.status(201).json(p))
    .catch(err => next(err));
}

function update(req, res, next) {
  positionService.update(req.params.id, req.body)
    .then(p => res.json(p))
    .catch(err => next(err));
}

function _delete(req, res, next) {
  positionService.delete(req.params.id)
    .then(() => res.json({ message: 'Deleted' }))
    .catch(err => next(err));
}
