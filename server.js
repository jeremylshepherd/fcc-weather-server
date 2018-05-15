var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var logger = require('morgan');

var app = express();
require('dotenv').load();

var routes = require('./routes/index');
app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI, { useMongoClient: true }, function(err, db) {
  if(err) {console.log(err);}

  console.log('Connected to weatherapp');
});
mongoose.Promise = global.Promise;

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if(process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}

app.use('/', routes);
app.enable('trust proxy');
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});

module.exports = app;