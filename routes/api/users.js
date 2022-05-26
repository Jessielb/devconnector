const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User'); // User model

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post('/', [ // using express validator
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => { // req/res = request / respond function

    const errors = validationResult(req);

    if(!errors.isEmpty()){ // if there are errors
        return res.status(400).json({ errors: errors.array() }); // 400 = bad request
    }

    // pull out the data
    const { name, email, password } = req.body;

    try 
    {

        // See if user exists
        let user = await User.findOne({ email });

        if(user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }]});
        }

        // Get users gravatar
        const avatar = gravatar.url(email, {
            s: '200', // size
            r: 'pg', // rating
            d: 'mm'
        });

        // creates an instance of the user, to then save to the db
        user = new User({
            name,
            email,
            avatar,
            password
        });

        // Encrypt password using bcrypt before saving user to db
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt); // turns plaintext pw into hashed pw

        await user.save(); // user getting saved, returns a promise that gets us the id

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