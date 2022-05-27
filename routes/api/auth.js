const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

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

/* Mostly copied from users.js, modified for login */
// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post('/', [ // using express validator
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => { // req/res = request / respond function

    const errors = validationResult(req);

    if(!errors.isEmpty()){ // if there are errors
        return res.status(400).json({ errors: errors.array() }); // 400 = bad request
    }

    // pull out the data
    const { email, password } = req.body;

    try 
    {

        // See if user exists
        let user = await User.findOne({ email }); // request to database for the user

        if(!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials (user)' }]});
        }

        // Make sure found user matches password
        const isMatch = await bcrypt.compare(password, user.password); // compares plaintext password entered versus the user.password in the database.

        if(!isMatch){
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials (pw)' }]});
        }


        // Return jsonwebtoken (to get user logged in right away)
        const payload = { // get payload which includes user ID
            user: {
                id: user.id // after user is saved we have an id saved to mongoDB and .id can be used to return (mongoose feature)
            }
        }

        jwt.sign( // sign the token, passing payload and secret, and send token back to client
            payload, 
            config.get('jwtSecret'), // get secret token from default.json config file
            { expiresIn: 360000 }, 
            (err, token) => {
                if(err) throw err;
                res.json({ token }); // token gets outputted 
            });

        //res.send('User registered'); // string gets outputted

    } 
    catch(err) 
    {
        console.error(err.message);
        res.status(500).send('Server error'); // status gets outputted
    }
});


module.exports = router; // export the route