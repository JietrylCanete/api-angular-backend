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
  departmentService.getAll()  // FIXED: Changed from requestService to departmentService
    .then(departments => res.json(departments))
    .catch(next);
}

function getById(req, res, next) {
  departmentService.getById(req.params.id)  // FIXED: Changed from requestService to departmentService
    .then(department => department ? res.json(department) : res.sendStatus(404))
    .catch(next);
}

function create(req, res, next) {
  departmentService.create(req.body)  // FIXED: Changed from requestService to departmentService
    .then(department => res.json(department))
    .catch(next);
}

function update(req, res, next) {
  departmentService.update(req.params.id, req.body)  // FIXED: Changed from requestService to departmentService
    .then(department => res.json(department))
    .catch(next);
}

function _delete(req, res, next) {
  departmentService.delete(req.params.id)  // FIXED: Changed from requestService to departmentService
    .then(() => res.json({ message: 'Department deleted successfully' }))
    .catch(next);
}