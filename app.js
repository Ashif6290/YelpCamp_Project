const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const methodOverride = require('method-override');
const {campgroundSchema , reviewSchema} = require('./schemas.js'); 
const Review = require('./models/review');
const session = require('express-session');
const flash = require('connect-flash');

const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

const validateReview = (req , res , next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        console.log(error)
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

mongoose.connect('mongodb://localhost:27017/yelp-camp');
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();
app.use(express.static(path.join(__dirname , 'public')));

const sessionConfig = {
    secret: "Hello",
    resave: false,
    saveUninitialized : true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 *7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(session(sessionConfig));
app.use(flash());

app.use((req , res , next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/makecampground' , async (req , res) => {
    const camp = new Campground({title: 'My Backyard' , description: 'cheap_camping'});
    await camp.save();
    res.send(camp);
})

app.engine('ejs' , ejsMate);
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'));

app.get('/' , (req , res) => {
    res.send('Hello from Yelp Camp')
})

app.use('/campgrounds' , campgrounds);
app.use('/campgrounds/:id/reviews' , reviews);

// app.use((err, req, res, next) => {
//     console.error(err.stack)
//     res.status(505).send('Something broke!')
// })
 
app.all('*' , (req , res , next) => {
    next(new ExpressError('Page Not Found' , 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Oh No, Something went wrong!'
    res.status(statusCode).render('error' , {err});
    // res.status();
    // res.send('Something went wrong!')
})

app.listen(3000 , () => {
    console.log('Serving on port 3000')
})