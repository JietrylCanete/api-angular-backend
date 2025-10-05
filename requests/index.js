// requests/index.js
const express = require('express');
const router = express.Router();
const requestController = require('./request.controller');

// Use the controller directly
router.use('/', requestController);

module.exports = router;