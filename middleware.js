const {campgroundSchema} = require('./schemas.js');
const {ExpressError} = require('./utils/ExpressError');
const Campground = require('./models/campground');
const { reviewSchema } = require('./schemas.js'); 
const Review = require('./models/review');

module.exports.isLoggedIn = ( req , res , next ) => {
    if(!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error' , 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
} 
module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    try {
        // Find the campground by its ID
        const campground = await Campground.findById(id);
        // Check if the authenticated user is the author of the campground
        if (!campground.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to do that!');
            return res.redirect(`/campgrounds/${id}`);
        }
        // If the user is the author, continue to the next middleware
        next();
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/campgrounds');
    }
};
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    try {
        const myreview = await Review.findById(reviewId);
        // Check if the authenticated user is the author of the review
        if (!myreview.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to do that!');
            return res.redirect(`/campgrounds/${id}`);
        }
        // If the user is the author, continue to the next middleware
        next();
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/campgrounds');
    }
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        console.log(error)
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}