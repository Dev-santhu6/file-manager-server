const express = require ('express')
const router = express. Router();
const {protect} = require("../middleware/authMiddleware.js")
const generateToken = require('../utils/generateToken.js');


const { 
        registerUser,
        loginUser,
        logoutUser,
<<<<<<< HEAD
        getUserProfile  
=======
        getUserProfile
>>>>>>> origin/master
     
} 
= require('../Controller/usercontroller.js');

// ("/api/users",userRoutes) this main routes

//user routes
router.post('/register', registerUser); //userRegister
router.post('/login', loginUser);       //userLogi

router.post('/logout', logoutUser);    //userLogout
router.get('/profile', protect, getUserProfile); // Use `protect` middleware to secure this route


module.exports =  router;