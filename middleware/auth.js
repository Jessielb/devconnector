const jwt = require('jsonwebtoken');
const config = require('config');

// middleware functions generally use request and response objects, and next is a callback we run once we're done to move on to the next piece of middleware

module.exports = function(req, res, next) {
    
    // Get token from header
    const token = req.header('x-auth-token');

    // check if not token
    if(!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        req.user = decoded.user;
        next();
    } catch(err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }

}