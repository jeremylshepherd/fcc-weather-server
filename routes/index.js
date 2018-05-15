'use strict'

const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const Data = require('../models/Data.js');
const cors = require('cors');

const router = express.Router();

const hour = 3600000;
const url = `https://api.forecast.io/forecast/${process.env.API_KEY}`;

router.get('/', (req, res) => {
  res.render('index.ejs');
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