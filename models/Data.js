'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
    coords: String,
    apiResponse: Object,
    date: Date
});


var Data = mongoose.model('Data', DataSchema);

module.exports = Data;