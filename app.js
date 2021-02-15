var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');


const db = require('./helper/databaseConnection')
global.db = db

var companyRouter = require('./routes/company');
var profileRouter = require('./routes/profile');
var customerRouter = require('./routes/customer');
var deviceRouter = require('./routes/device');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/company', companyRouter);
app.use('/profile', profileRouter);
app.use('/customer', customerRouter);
app.use('/device', deviceRouter);

module.exports = app;
