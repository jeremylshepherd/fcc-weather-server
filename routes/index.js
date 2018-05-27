'use strict'

const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const Data = require('../models/Data.js');
const zipLatLon = require('../zipLatLon');
const Location = require('../models/Location.js');
const cors = require('cors');

const router = express.Router();

const hour = 3600000;
const url = `https://api.forecast.io/forecast/${process.env.API_KEY}`;
const locationURL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=`;

const getAddress = (obj, res) => {
    request(`${locationURL}${obj.lat},${obj.lon}&sensor=false`, (locErr, locResponse, locBody) => {
        if(locErr) { res.json(locErr); }
        if(+locResponse.statusCode === 200) {
            let data = JSON.parse(locBody);
            if(data.status.toUpperCase() !== "OK") {
                return res.status(503).send('Google Maps Location Service are currently unavailable. Please try again later.');
                
            }
            const userLoc = data.results[0].formatted_address;
            const locArr = userLoc.split(",");
            locArr.shift();
            locArr.pop();
            let location = locArr.join(",");
            obj.address = location;
            if(!obj.zip) {
                obj.zip = +location.slice(-5);
            }
            let newLocation = new Location(obj);
            newLocation.save((error, location) => {
                if(error) {
                    res.json(error);
                }else{
                    res.json(location);
                }
            });
        }
    });
};

router.get('/', (req, res) => {
  res.render('index.ejs');
});

//Take in a zip code and get the coordinates and address, then store in a record for future use.
router.get('/api/zip/:zip', cors(), (req, res) => {
    let parZip = +req.params.zip;
    Location.findOne({ 'zip': parZip }, (dbError, zip) => {
        if(dbError) res.json(dbError);
        if(zip) {
            res.json(zip);
        }else{
            let zips = zipLatLon.map((d) => d.ZIP);
            let subZip = zips.indexOf(parZip.toString());
            if(subZip !== -1) {
                let coords = zipLatLon[subZip];
                let obj = {};
                obj.lat = (+coords.LAT).toFixed(2).toString();
                obj.lon = (+coords.LONG).toFixed(2).toString();
                obj.zip = parZip;
                getAddress(obj, res);
            }else{
                return res.status(404).send('Zip code not found, please check zip and try again.');
            }
        }
    });
});

router.get('/api/coords/:coords', cors(), (req, res) => {
    let splitCoords = req.params.coords.split(',');
    console.log(splitCoords);
    let obj = {};
    obj.lat = (+splitCoords[0]).toFixed(2).toString();
    obj.lon = (+splitCoords[1]).toFixed(2).toString();
    Location.findOne({ lat: obj.lat, lon: obj.lon }, (err, location) => {
        if(err) { res.json(err); }
        if(location) {
            res.json(location);
        }else{
            getAddress(obj, res);
        }
    });
});

router.get('/api/:coords', cors(), (req, res) => {
    Data.findOne({ 'coords': req.params.coords}, (dataErr, record) => {
        if(dataErr) return res.json(dataErr);
        const time = record ? record.date.getTime() : null;
        const expires = time + hour;
        const fresh = expires > Date.now();
        if(record && fresh) {
            console.log('Record is fresh');
            return res.json(record);
        }else if(record && !fresh){
            console.log('Updating record');
            request.get(`${url}/${req.params.coords}`, (reqErr, response, body) => {
                if(reqErr) return reqErr;
                if(+response.statusCode === 200) {
                    record.apiResponse = JSON.parse(body);
                    record.date = Date.now();
                    record.save((recErr,record) => {
                        if(recErr)
                            return res.json(reqErr);
                        else
                            return res.json(record);
                    });
                }
            });
         }else{
            console.log('Record not found');
             request.get(`${url}/${req.params.coords}`, (reqErr2, response, body) => {
                if(reqErr2) return reqErr2;
                if(+response.statusCode === 200) {
                    const newRecord = {};
                    newRecord.coords = req.params.coords;
                    newRecord.apiResponse = JSON.parse(body);
                    newRecord.date = Date.now();
                    const data = new Data(newRecord);
                    data.save((dataErr2,newRecord) => {
                        if(dataErr2)
                            return res.json(dataErr2);
                        else
                            return res.json(newRecord);
                    });
                }
            });
        }
    });
});

module.exports = router;