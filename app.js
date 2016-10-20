
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , dbConfig = require('./config/db');


var app = express();
var passport = require('passport');
var mongoose = require("mongoose");
var mongodbUri = require('mongodb-uri');
var bodyParser = require('body-parser');

var uri = process.env.MONGOLAB_URI ;
//var uri = 'mongodb://localhost:27017/test';
var mongooseConnectString = mongodbUri.formatMongoose(uri);
mongoose.connect(mongooseConnectString, function (error) {
    if (error) {
    	console.error(error);
    	}
});


require('./config/passport')(passport);
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('trust proxy', true);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.session({secret : 'suckMyDick'}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// development only
  app.use(express.errorHandler());


 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
  var flash = require('connect-flash');
  app.use(flash());
  app.use(express.methodOverride());


var routes = require('./routes/index')(app,passport);
app.listen(app.get('port'));
