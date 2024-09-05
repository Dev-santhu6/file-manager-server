// const asynchandler = require('express-async-handler');
// const generateToken = require( '../utils/generateToken.js');
// const User = require( '../Schema/userschema.js');



// // @desc register user/set token
// // route POST /api/users/register
// // @access User
// const registerUser = asynchandler(async(req,res) => {
//     const {name,email,password}=req.body;
//     const userExists =await User.findOne({email})
//     if (userExists){
//         res.status(400);
//         throw new Error("user alredy exists");
//     }
    
//     const user =await User.create({
//         name,
//         email,
//         password,
//     })

//     if (user){
//         generateToken(res,user.id)
//         res.status(201).json({
//             id:user.id,
//             name:user.name,
//             email:user.email,
//             password:user.password,
    
//         })
//     }
//     else{
//         res.status(400)
//         throw new Error('Invalid user data')

//     }
//     res.status (200).json({ message: 'Register User' });
  
// });


// // des Auth user/set token
// // route POST /api/users/login
// // access User
// // const loginUser = asynchandler(async(req, res) => {
// //   const {email,password}=req.body

// //   const user= await User.findOne({email})

// //   if (user && (await user.matchPassword(password))){
// //     generateToken(res,user.id)
// //     res.status(201).json({
// //         message:"User successfull login"
// //     })
// // }
// // else{
// //     res.status(401)
// //     throw new Error('Invaild id or password')
// // }
// //      });
// const loginUser = asynchandler(async (req, res) => {
//   const { email, password, name } = req.body; // Include the name in the request body

//   const user = await User.findOne({ email });

//   if (user && (await user.matchPassword(password))) {
//       // Update the user's name if provided
//       if (name) {
//           user.name = name;
//           await user.save();
//       }

//       generateToken(res, user.id);

//       res.status(201).json({
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           token: res.cookie('jwt') // Assuming you're setting a JWT token in the cookie
//       });
//   } else {
//       res.status(401);
//       throw new Error('Invalid email or password');
//   }
// });


// // @desc logout user/set token
// // route POST /api/users/logout
// // @access Public
// const logoutUser = asynchandler(async(req, res) => {

//     res.cookie('jwt','',{
//         httpOnly:true,
//         expires: new Date(0),
//     })
//     res.status (200).json ({ message: 'User Logout out' });
//     });

       
//     module.exports = {
//         registerUser,
//         loginUser,
//         logoutUser,
        
//     };

const asynchandler = require('express-async-handler');
const generateToken = require('../utils/generateToken.js');
const User = require('../Schema/userschema.js');


// @desc register user/set token
// route POST /api/users/register
// @access User
const registerUser = asynchandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create new user
    const user = await User.create({ name, email, password });

    if (user) {
        generateToken(res, user.id); // Generate and set token in cookie
        res.status(201).json({
            id: user.id,        
            name: user.name,
            email: user.email,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc login user/set token
// route POST /api/users/login
// @access User

let x;

const loginUser = asynchandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Check if the name provided matches the stored name
        if (name && user.name !== name) {
            res.status(401);
            throw new Error('Name does not match');
        }

        // Generate and set token in cookie
        generateToken(res, user.id);
        res.setHeader('x-username', user.name);

        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            token: res.cookie('jwt').value // Return token as part of response
        });
        const userName = req.get('x-username');
        console.log(` hello${userName}`);
        var users = req.get('x-username');
        x =users
        return users;  
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc logout user/set token
// route POST /api/users/logout
// @access Public
const logoutUser = asynchandler(async (req, res) => {
    // Clear the cookie
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'User logged out' });
});


// @desc get user profile
// route GET /api/users/profile
// @access Private
const getUserProfile = asynchandler(async (req, res) => {
    // Fetch user profile using ID from the request object
    const user = await User.findById(req.user.id).select('-password'); // Exclude password from the response

    if (user) {
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const getUserByEmail = async (email) => {
    return await User.findOne({ email });
  };



module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    getUserByEmail
};
