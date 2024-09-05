
const asyncHandler = require("express-async-handler");


const jwt = require('jsonwebtoken');
const User = require('../Schema/userschema.js');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check if token exists in cookies
    token = req.cookies.jwt;

    console.log('Token:', token); // Debug statement

    if (token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded:', decoded); // Debug statement

            if (!decoded || !decoded.id) {
                res.status(401);
                throw new Error('Token is invalid');
            }

            // Attach user to request object
            req.user = await User.findById(decoded.id).select('-password');

            console.log('User:', req.user); // Debug statement

            if (!req.user) {
                res.status(404);
                throw new Error('User not found');
            }

            next();
        } catch (error) {
            console.error('Token error:', error.message); // Debug statement
            if (error.name === 'JsonWebTokenError') {
                res.status(401);
                throw new Error('Not authorized, invalid token');
            }
            res.status(401);
            throw new Error('Not authorized, token error');
        }
    } else {
        console.error('No token found'); // Debug statement
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});
module.exports = { protect };