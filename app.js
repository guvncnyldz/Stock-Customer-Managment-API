var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');


const db = require('./helper/databaseConnection')
global.db = db

var companyRouter = require('./routes/company');
var profileRouter = require('./routes/profile');
var customerRouter = require('./routes/customer').router;
var deviceRouter = require('./routes/device');
var filterRouter = require('./routes/filter');
var maintenanceRouter = require('./routes/maintenance');
var paymentRouter = require('./routes/payment');
var jobRouter = require('./routes/job');
var rendezvousRouter = require('./routes/rendezvous');
var expenseRouter = require('./routes/expense');
var stockRouter = require('./routes/stock');

var app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/company', companyRouter);
app.use('/profile', profileRouter);
app.use('/customer', customerRouter);
app.use('/device', deviceRouter);
app.use('/filter', filterRouter);
app.use('/maintenance', maintenanceRouter);
app.use('/payment', paymentRouter);
app.use('/job', jobRouter);
app.use('/rendezvous', rendezvousRouter);
app.use('/expense', expenseRouter);
app.use('/stock', stockRouter);

module.exports = app;
