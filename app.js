if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}
console.log(process.env.SECRET)
console.log(process.env.API_KEY)

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
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const passport = require('passport');

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
app.use(
    mongoSanitize({
        replaceWith: '_',
    }),
);
const sessionConfig = {
    name: 'session',
    secret: "thisshouldbesecret",
    resave: false,
    saveUninitialized : true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 *7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
//This is the array that needs added to
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`, //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet({ contentSecurityPolicy : false }));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req , res , next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
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
    res.render('home')
});

app.use('/' , userRoutes);
app.use('/campgrounds' , campgroundRoutes);
app.use('/campgrounds/:id/reviews' , reviewRoutes);

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