
/*
 * GET home page.
 */
var express = require('express');
var router = express.Router();
//var helper = require('./helper');
var Session = require('../config/session');
var User = require('../models/user');
var Area = require('../models/area');



module.exports = function(app,passport){

	/* GET login page. */
	app.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		//res.render('index', { message: req.flash('message') });
		res.send(200).json({
			message : 'Welcome api located at /api'
		});
	});
	
	
	// route for showing the profile page
    app.get('/api'
    		//, isLoggedIn
    		
    		,function(req, res) {
	        
	    	var status = req.query.status;
	
	    	switch(status){
	    	
	    		case Session.start :
	    			// query limit default set to 5
	    	    	var limit = parseInt(req.query.limit) || 5;	
	    	    	
	    		    // get the max distance or set it to 8 kilometers
	    		    var maxDistance = parseInt(req.query.distance) || 4;
	    	
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
    		    	
	    		case Session.areasel :
	    			var area = req.query.area;
					//find the parking spots in the area by consulting the database of the spots
					break;	
//		    		
//	
//	    		case Session.sbook : 
//					helper.getParkAreas(req.lat,req.long,function(err,data){
//		    			if(err){
//		    				res.send(500).send('Server error');
//		    			}
//		    			res.json({ areas : data});
//		    		});
//					break;
//				
//	
//	    		case Session.pbill : 
//					helper.getParkAreas(req.lat,req.long,function(err,data){
//		    			if(err){
//		    				res.send(500).send('Server error');
//		    			}
//		    			res.json({ areas : data});
//		    		});
//					break;
//				
//	
//	    		case Session.bwpay : 
//					helper.getParkAreas(req.lat,req.long,function(err,data){
//		    			if(err){
//		    				res.send(500).send('Server error');
//		    			}
//		    			res.json({ areas : data});
//		    		});
//					break;
//				
//	
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
    });

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.post('/auth/google',function(req,res,next){
    	//console.log(req.query);
    	//console.log(req);
    	console.log("before");
    	next();
    }//,passport.authenticate('google-id-token')
    					   ,function(req,res){
									    	console.log('after');
									    	console.log(req.user);
									    	res.send(req.user? 200 : 401);
    });

	// the callback after google has authenticated the user used for server side authentication not needed right now
	//    app.get('/auth/google/callback',
	//            passport.authenticate('google', {
	//                    successRedirect : '/api',
	//                    failureRedirect : '/'
	//            }));
};

