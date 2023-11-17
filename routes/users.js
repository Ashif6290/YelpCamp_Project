const express = require('express');
const router = express.Router();
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');

router.get('/register' , (req , res) => {
    res.render('users/register');
});

router.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;

        // Check for duplicate email or username
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            req.flash('error', 'Email or username is already in use. Please choose another.');
            return res.redirect('/register');
        }

        // Create a new user instance
        const user = new User({ email, username });

        // Register the user
        const registeredUser = await User.register(user, password);

        // Log in the registered user
        req.login(registeredUser, err => {
            if (err) {
                console.error('Login error:', err);
                return next(err);
            }
            req.flash('success', 'Welcome to Yelp Camp');
            res.redirect('/campgrounds');
        });

    } catch (e) {
        if (e.name === 'ValidationError') {
            // Handle validation errors
            req.flash('error', 'Validation failed. Please check your inputs.');
        } else {
            // Handle other errors
            console.error('Registration error:', e);
            req.flash('error', 'Something went wrong during registration. Please try again.');
        }
        res.redirect('/register');
    }
}));

router.get('/login' , (req ,res) => {
    res.render('users/login');
})

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/login');
    });
}); 

router.post('/login' , passport.authenticate('local' , { failureFlash: true , failureRedirect:'/login'}) , (req , res) => {
    req.flash('success' , 'welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})
module.exports = router;