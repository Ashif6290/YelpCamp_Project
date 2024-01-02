const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places , descriptors} = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for(let i=0 ; i<300 ; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '6556f792b2ff2c41f1fdff14',
            location : `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'A Unicode-based encoding such as UTF-8 can support many languages and can accommodate pages and forms in any mixture of those languages. Its use also eliminates the need for server-side logic to individually determine the character encoding for each page served or each incoming form submission.',
            price,
            geometry: { type: 'Point', 
                        coordinates: [
                            cities[random1000].longitude,
                            cities[random1000].latitude,
                        ]
                    },
            images: [
                {
                    url: 'https://res.cloudinary.com/dsnmd8nuu/image/upload/v1704108557/YelpCamp/p41wxgjskw18vvzw3dqk.png',
                    filename: 'YelpCamp/p41wxgjskw18vvzw3dqk'
                },
                {
                    url: 'https://res.cloudinary.com/dsnmd8nuu/image/upload/v1703686435/YelpCamp/irc12mw32sarc0gijcdf.jpg',
                    filename: 'YelpCamp/irc12mw32sarc0gijcdf'
                }
            ]
        })
        await camp.save();
    }
    // call unsplash and return small image
    
}

seedDB().then(() => {
    mongoose.connection.close();
})