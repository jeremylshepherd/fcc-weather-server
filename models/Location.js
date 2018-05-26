'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    address: String,
    lat: String,
    lon: String,
    zip: Number,
    date: Date
});


var Location = mongoose.model('Location', LocationSchema);

module.exports = Location;