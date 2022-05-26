const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const User = require('../../models/User');

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // find user in User schema by ID from auth middleware, exclude password
        res.json(user); // response showing all the details in the database for that user
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}); 

module.exports = router; // export the route