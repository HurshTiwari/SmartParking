
/*
 * GET home page.
 */
// var MongoClient = require('mongodb').MongoClient, format = require('util').format;
// var ObjectId = require('mongodb').ObjectID;
var mongoose = require("mongoose");
var WebSocket = require('ws');
var express = require('express');
var https = require('https');
var verifier = require('google-id-token-verifier');
var router = express.Router();

//var helper = require('./helper');
var Session = require('../config/session');
var User = require('../models/user');
var Area = require('../models/area');
var Spot = require('../models/spot');
var Booking = require('../models/booking');
var getStatus = require('./getStatus');
var startBookingTimePoll = require('./bookingFactory');
module.exports = function(app,passport){
		app.all('/api/*',function(req,res,next){
				//console.log(req);
				var IdToken = req.get('gtoken');
				var clientId = process.env.APP_CLIENT_ID;
				//console.log('Inside app.all  ' + IdToken);
				verifier.verify(IdToken, clientId, function (err, tokenInfo) {
					  if (err) { 
						console.log('Error ' + err);
					    return res.json(401,{message : 'Unauthorized'});
					  }
					  console.log('got token ' +tokenInfo);
					  next();
					});
		});

		app.get('/', function(req, res) {
				res.json(200,{
					message : 'Welcome api located at /api'
				});
		});
	
//-----------------------case 1 : Start -------------------------//	
	    app.get('/api/area',function(req, res) {	    	
		    			// query limit default set to 5
		    	    	var limit = parseInt(req.query.limit) || 10;	
		    	    	
		    		    // get the max distance or set it to 8 kilometers
		    		    var maxDistance = parseInt(req.query.distance) || 20;
		    	
		    		    // we need to convert the distance to radians
		    		    // the raduis of Earth is approximately 6371 kilometers
		    		    maxDistance *= 1000;
		    	
		    		    // get coordinates [ <longitude> , <latitude> ]
		    		    var coords = [];
		    		    if(req.query.longitude){
		    		    	coords[0] = parseFloat(req.query.longitude);	
		    		    }
		    		    
		    		    if(req.query.latitude){
		    		    	coords[1] = parseFloat(req.query.latitude);	
		    		    }
		    		    
		    		    //return a bad request response if coordinates are not found
		    		    if(!coords[0] || !coords[1]){
		    		    	res.json(400,{'message' : 'coordinates not passed '});
		    		    }
		    		    // fetch parking areas near coordinates and respond as json
		    		    Area.find({
				    		      loc: {
				    		        $near: {
				    		        		$geometry :{
						    		        			type : "Point",
						    		        			coordinates :coords
				    		        				   },
				    		        		$maxDistance: maxDistance
				    		        		}
				    		      		}
		    		      		})
		    		      .limit(limit)
		    		      .exec(function(err, locations) {
										    		      if (err) {
										    		        return res.json(500, err);
								    		      			}
										    		      res.json(200, locations);
		    		      	
		    		      		});
	    });
//---------------------------case 2 : Area Selected--------------------------//    		    	
	    app.post('/api/area',function(req,res){
	    			var result = [];
	    			var counter =0;
	    			var addSpotToResponse = function(err,spot,length,data){
	    			  if(err){
	    				  return res.json(500,err);
	    			  }
	    			  counter++;
  		    		  if(data.value===false && spot.reserved==="0"){
  		    			  //console.log('Added spot : '+spot.id);
  		    			  result.push({'spotId': spot.id,'id':spot._id});
  		    		  }
  		    		  if(counter===length){
  		    			  res.json(200,result);
  		    		  }
  		    	  	};
  		    	  	var area = req.query.area;
	    			//console.log(area);
	    			Area.findOne({'_id':area},{'_id' : 0})
  		      		.select('spots') 				
  		      		.populate('spots')
  		      		//.where('reserved').equals("0")	
  		      		.exec(function(err, data){
  		      								 var spots = JSON.parse(JSON.stringify(data));
							    		     if (err) {
							    		    	console.log('Database error :'+	err);
							    		        return res.json(500, err);
					    		      		 }
							    		      //Array of spots in the spots var
							    		      //for each spot in spots call its evrythng rest api
							    		      var length = spots.spots.length;
							    		      if(length===0){
												  res.json(200,result);
											  }
							    		      for(var i=0;i<length;i++){
							    		    	  var spot = spots.spots[i];
							    		    	  getStatus(spot,length,addSpotToResponse);
							    		      }
  		      		});
    	});

//----------------------------case 3 : Spot Booked-------------------------------//
	    app.post('/api/spot',function(req,res){
		    			var s =req.query.spot;
		    			var t = req.query.type;
		    			var clientKey = req.query.key;
		    			if(!s || !t || !clientKey){
		    				res.json(400,{message : 'Bad Query send spot=&key=&type='});
		    			}
		    			var buff = (t==="book")?20 : (parseInt(t,10)<=120)?parseInt(t,10):120;
		    			buff=buff*1000;	//convert buff to millisecs;
		    			Spot.findOneAndUpdate({"_id":s},{ $set: { reserved: '1' }},function(err){
		    				if(err){
		    					console.log('Database error :'+	err);
		    					res.json(500,err);
		    				}
		    			});
		    			//console.log(s + " " + clientKey);
		    			Spot.findOne({"_id":s})
	  		      		.select('thngId thngKey')
	  		      		.exec(function(err, data){
	  		      			if (err) {
				    		    	console.log('Database error :'+	err);
				    		        return res.json(500, err);
		    		      		 }
		    		      	var spot = JSON.parse(JSON.stringify(data));
		    		      //	console.log(spot.thngId +' '+ spot.thngKey);
		    		      	var thngId = spot.thngId;
		    		      	var key = spot.thngKey;
		    		      	var booking = new Booking({ 
		    		      		user_id : clientKey,
		    		      	    spot_id: spot._id
		    		      	});
		    		      	booking.save(function(err,booking){
		    		      		if(err){
		    		      			console.log(err);	
		    		      			res.json(500,err);
		    		      		}
		    		      		console.log('Booking Made : '+ booking._id);
		    		      		var startBookingTimePollCallback = function(err){
		    		      			if(err){
		    		      				setTimeout(function(){
		    		      					startBookingTimePoll(booking,thngId,key,buff,startBookingTimePollCallback);
		    		      				},60000);//server unable to connect to evrythng..keep on trying after each minute
		    		      				return;
		    		      			}
		    		      			console.log('timePoll done');
		    		      			return;
		    		      		};
		    		      		startBookingTimePoll(booking,thngId,key,buff,startBookingTimePollCallback);
		    		      	});
		    		      	res.json(201,{'time':buff});
	  		      		});
    	});
};
