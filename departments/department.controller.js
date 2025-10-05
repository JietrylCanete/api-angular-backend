const express = require('express');
const router = express.Router();
const departmentService = require('./department.service'); 

// routes
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', _delete);

// export router
module.exports = router;

// controller functions
function getAll(req, res, next) {
  requestService.getAll()
    .then(requests => res.json(requests))
    .catch(next);
}

function getById(req, res, next) {
  requestService.getById(req.params.id)
    .then(request => request ? res.json(request) : res.sendStatus(404))
    .catch(next);
}

function create(req, res, next) {
  requestService.create(req.body)
    .then(request => res.json(request))
    .catch(next);
}

function update(req, res, next) {
  requestService.update(req.params.id, req.body)
    .then(request => res.json(request))
    .catch(next);
}

function _delete(req, res, next) {
  requestService.delete(req.params.id)
    .then(() => res.json({ message: 'Request deleted successfully' }))
    .catch(next);
}
