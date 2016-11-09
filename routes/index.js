
/*
 * GET home page.
 */
 var MongoClient = require('mongodb').MongoClient
  , format = require('util').format;
 var ObjectId = require('mongodb').ObjectID;
var express = require('express');
var https = require('https');
var router = express.Router();
//var helper = require('./helper');
var Session = require('../config/session');
var User = require('../models/user');
var Area = require('../models/area');
var Spot = require('../models/spot');
function getStatus(spot,length,cb){
	//console.log('hi dickhead');
	var id = spot.thngId;
	var auth = spot.thngKey;
	//console.log(id+' ' +auth);
	var options = {
			  host: 'api.evrythng.com',
			  path: '/thngs/'+id+'/properties',
			  headers: {"Authorization" : auth}
			};
	var callback = function(response) {
		
	  var str = '';
	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	    str += chunk;
	  });
	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	    //console.log(str);
		  var data = JSON.parse(str);
		  var resp = data.filter(function(o){
			  return o.key==="status";
		  });
	    cb(null,spot,length,resp[0]);
	  });
	};
	try{
	https.request(options, callback).end();
	}
	catch(err){
		cb(new Error(err));
	}
	
} 


module.exports = function(app,passport){

	/* GET login page. */
	app.get('/', function(req, res) {
    	//Display the Login page with any flash message, if any
		//res.render('index', { message: req.flash('message') });
		res.json(200,{
			message : 'Welcome api located at /api'
		});
	});
	
	app.get('/logout',function(req, res) {
    		if(req.session.profile){
    			req.session.destroy();
    			res.redirect(200,'/');
    		}
    		else{
			res.json(401,'Not Authorized');    			
    		}
    		});
	// route for showing the profile page
    app.get('/api'
    		//, isLoggedIn
    		
    		,function(req, res) {

    		//sessions work in case of browser but not in apps	
    		//if(req.session.profile){
	        //if(parseInt(req.query.authenticated) == 1){
	    	var status = req.query.status;
	
	    	switch(status){
//---------------------------case 1 : Start --------------------------//	    	
	    		case Session.start :
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
	    		    	res.json(400,{'message' : 'coordinates not passed re'});
	    		    }
	    		    // fetch parking areas near coordinates and respond as json
	    		    
	    		    //TODO: Ask aditya if we need all the data to be sent as response if not we can trim the data to just area ids 
	    		    //and names since sending area locations is pretty pointless anyways because the client doesnot need it at all

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
    		    	break;
//---------------------------case 2 : Area Selected--------------------------//    		    	
	    		case Session.areasel :
	    			var result = [];
	    			var counter =0;
	    			var addSpotToResponse = function(err,spot,length,data){
	    			  if(err){
	    				  return res.json(500,err);
	    			  }
	    			  counter++;
  		    		  if(data.value===false){
  		    			 // console.log('Added spot : '+spot.id);
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
  		      		.where('reserved').equals('0')	
  		      		.exec(function(err, data){
  		      								 var spots = JSON.parse(JSON.stringify(data));
							    		     if (err) {
							    		    	console.log('Database error :'+	err);
							    		        return res.json(500, err);
					    		      		 }
							    		      //Array of spots in the spots var
							    		      //for each spot in spots call its evrythng rest api
							    		      var length = spots.spots.length;
							    		      for(var i=0;i<length;i++){
							    		    	  var spot = spots.spots[i];
							    		    	  getStatus(spot,length,addSpotToResponse);
							    		      }
  		      		});	
					break;	
//		    		
//	//---------------------------case 3 : Area Selected--------------------------// 

	    		case Session.sreserve : 

	    			MongoClient.connect('mongodb://adiityank:aditya*1@ds035786.mlab.com:35786/smartpark-testdb', function(err, db) {
					if(err) throw err;
					console.log(req.query.spot);
					db.collection('spots').update(
					  { '_id' : ObjectId(req.query.spot) },  // query
					  {$set: {'reserved': "1"}}, // replacement, replaces only the field "hi"
					  function(err, object) {
					      if (err){
					          res.json(500, err);  // returns error if no matching object found
					      }else{
					          res.json(200,object);
					      }
					  });
					});
					break;
				


//---------------------------case 4 : Spot Booked --------------------------//
	    		case Session.sbook : 
	    		Spot.findOne({'_id':req.query.spot},{'_id' : 0})
  		      		.select('thngId thngKey')
  		      		.exec(function(err, data){
  		      			if (err) {
			    		    	console.log('Database error :'+	err);
			    		        return res.json(500, err);
	    		      		 }
	    		      	var spot = JSON.parse(JSON.stringify(data));
	    		      	console.log(spot.thngId +' '+ spot.thngKey);
  		      		})
				break;
			
//	//---------------------------case 5 : Parked and Billing --------------------------//
//	    		case Session.h : 
//					helper.getParkAreas(req.lat,req.long,function(err,data){
//		    			if(err){
//		    				res.send(500).send('Server error');
//		    			}
//		    			res.json({ areas : data});
//		    		});
//					break;
//				
//	//----------------------------case 6 : Waiting Payment ----------------------------------//
//	    		case Session.bwpay : 
//					helper.getParkAreas(req.lat,req.long,function(err,data){
//		    			if(err){
//		    				res.send(500).send('Server error');
//		    			}
//		    			res.json({ areas : data});
//		    		});
//					break;
//				
//	//---------------------------case 7 : Payment Succeeded --------------------------//
//	    		case Session.psucc : 
//					helper.getParkAreas(req.lat,req.long,function(err,data){
//		    			if(err){
//		    				res.send(500).send('Server error');
//		    			}
//		    			res.json({ areas : data});
//		    		});
//					break;
					default : 
						res.send(200).json({
							message: "Bad Query"
						});
	    	}
//	    }
//	    		else{
//				console.log("Unauthorized request");
//	    			res.json(401,'Not Authorized');
//			}
    });

///////req.body is undefined here
//extended: false means you are parsing strings only (not parsing images/videos..etc)

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
   
	/*
	
	app.post('/auth/google',function(req,res,next){
    	//console.log(req.query);
    	//console.log(req);
	console.log(req.body.token);
    	var clientId = '951571840599-rqjt18gfuiponqlrophjctrag0nk30i1.apps.googleusercontent.com';
    	var IdToken = 'req.body.token';
	verifier.verify(IdToken, clientId, function (err, tokenInfo) {
	if (!err) {
	// use tokenInfo in here. 
	console.log(tokenInfo);
	}
	});
	console.log("ended");
    	next();
    }//,passport.authenticate('google-id-token')
    					  /* ,function(req,res){
									    	console.log('after');
									    	console.log(req.user);
									    	res.send(req.user? 200 : 401);}*/
//	    );

	// the callback after google has authenticated the user used for server side authentication not needed right now
	//    app.get('/auth/google/callback',
	//            passport.authenticate('google', {
	//                    successRedirect : '/api',
	//                    failureRedirect : '/'
	//            }));
};

