
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var verifier = require('google-id-token-verifier');

var uri = process.env.MONGOLAB_URI ;
//var uri = 'mongodb://localhost:27017/test';
var mongooseConnectString = mongodbUri.formatMongoose(uri);
mongoose.Promise = global.Promise;
mongoose.connect(mongooseConnectString, function (error) {
    if (error) {
    	console.error(error);
    	}
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('trust proxy', true);
app.use(express.favicon());
app.use(express.logger('dev'));
//app.use(express.cookieParser());
//app.use(express.session({secret : 'doomsday'}));
//app.use(passport.initialize());
//app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.errorHandler());
//var flash = require('connect-flash');
//app.use(flash());
app.use(express.methodOverride());

var routes = require('./routes/index')(app,passport);

app.listen(app.get('port'),function(){
	console.log('running');
	});
	app.post('/auth/google',function(req,res){
    	//console.log(req.query);
    	//console.log(req);
	console.log(req.body.token);
    	var clientId = '951571840599-rqjt18gfuiponqlrophjctrag0nk30i1.apps.googleusercontent.com';
    	var IdToken = req.body.token;
	verifier.verify(IdToken, clientId, function (err, tokenInfo) {
	if (!err) {
	console.log(tokenInfo);
  JSON.stringify(tokenInfo);
  req.session.profile = tokenInfo;
  console.log(req.session);
  res.json(200, tokenInfo);
	}
	else
	   return res.send(500, "problem in information retrieval...");
	});
	console.log("ended");
  });
	
