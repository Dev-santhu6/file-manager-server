// const jwt  = require("jsonwebtoken");
// const asyncHandler = require("express-async-handler");
// const User = require("../Schema/userschema.js");


//  const protect = asyncHandler(async(req,res,next)=>{
//  let token;
 
//  token =req.cookies.jwt;
//  if(token){
//     try{
//            const decoded = jwt.verify(token,process.env.JWT_SECRET);

//            req.user= await User.findById(decoded.userId).select('-password');
//            next();

//     } catch (error){
//         res.status(401);
//         throw new Error("Not authorized,invaild token");
//     }
// } else{
//     res.status(401);
//     throw new Error("Not authorized,no token");
// }
//  });



//  module.exports = {protect}

// const jwt = require('jsonwebtoken');
// const asyncHandler = require('express-async-handler');
// const User = require('../Schema/userschema.js');

// const protect = asyncHandler(async (req, res, next) => {
//     let token;

//     // Check if token exists in cookies
//     token = req.cookies.jwt;

//     if (token) {
//         try {
//             // Verify token
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);

//             // Check if token contains expected data
//             if (!decoded || !decoded.id) {
//                 res.status(401);
//                 throw new Error('Token is invalid');
//             }

//             // Attach user to request object
//             req.user = await User.findById(decoded.id).select('-password');

//             if (!req.user) {
//                 res.status(404);
//                 throw new Error('User not found');
//             }

//             next();
//         } catch (error) {
//             // Handle specific token verification errors
//             if (error.name === 'JsonWebTokenError') {
//                 res.status(401);
//                 throw new Error('Not authorized, invalid token');
//             }
//             // Catch other potential errors
//             res.status(401);
//             throw new Error('Not authorized, token error');
//         }
//     } else {
//         res.status(401);
//         throw new Error('Not authorized, no token');
//     }
// });

// module.exports = { protect };










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