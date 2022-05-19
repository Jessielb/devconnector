const express = require('express');
const router = express.Router();

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.send('Auth route')); // req/res = request / respond function

module.exports = router; // export the route