/**
 * http://usejsdoc.org/
 */
var mongoose = require("mongoose");
var moment = require('moment');
var Spot = require('../models/spot');
var Booking = require('../models/booking');
var WebSocket = require('ws');
var pushNote = require('./pushNote'); 

function generateMsg(booking, body,title){
	var msg ={'to' : booking.user_id , 'notification' :{}};
	msg.notification.body = body;
	msg.notification.title = title ;
	return msg;
}


module.exports  = function (booking,thngId,key,bufftime,cb){
	var url = 'wss://ws.evrythng.com:443/thngs/'+thngId+'/properties?access_token='+key;
  	var socket = new WebSocket(url,{'force new connection':true});
  	var pushNoteCallback  = function(err){
		if(err){
			console.log('Error sending' + err +'. Retry after 5 secs');
			setTimeout(pushNote(err,pushNoteCallback),5000);
			return;
		}
		console.log('Notification Pushed');
		return;
	};
  	var bookingId = booking._id;
  	var bookingSpotId = booking.spot_id;
	var booktime = new mongoose.Types.ObjectId(bookingId).getTimestamp();
	var bookingStarted,startDate ;
	var bookingTimeout = setTimeout(function(){
			socket.close(1000);
			var msgBody = 'Booking Failed.Book again!';
			var msgTitle = 'Booking failed';
			var msg = generateMsg(booking,msgBody,msgTitle);
			pushNote(msg,pushNoteCallback);
			Spot.update({_id: bookingSpotId}, {$set: {reserved: "0"}},function(err, resp){
				 if(err){
						 console.log('Spot reservation could not be removed');
						 cb(err);
					 }
				 console.log('Spot reservation removed');
			});
			Booking.findOneAndRemove({_id:bookingId},function(err,data){
				if(err){
					console.log('Error deleting booking' + err);
					cb(null);
				}
				cb(null);
			});
	},bufftime);
  	socket.on('message', function (message) {
  		console.log(message);
	  	var content = JSON.parse(message);
	  	//console.log('Property update : ', content[0]);
	  	if (content[0].key==="status" && content[0].value===true ){
	  		var date = new Date().getTime();
	  		var diff = date - booktime;
	  		if(diff > 0 && diff < bufftime){ //buffertime
	  		Booking.update({ _id: bookingId },{$set: { 'start_time': date }},function(err,data){
	  				if(err){
	  					console.log('Error updating starttime' + err);
	  					var msgBody = 'Booking failed.Book again!';
	  					var msgTitle = 'Booking failed';

	  					var msg = generateMsg(booking,msgBody,msgTitle);
	  					pushNote(msg,pushNoteCallback);
	  					cb(null);
  					}
  					var msgbody = 'Parking time starts now';
  					var msgtitle = 'Spot Reached';
  					var msg1 = generateMsg(booking,msgbody,msgtitle);
  					pushNote(msg1,pushNoteCallback);
  					clearTimeout(bookingTimeout);
  					bookingStarted = true;
  					startDate = date;
	  			});
	  		}
	  	}
	  	
	  	else if (content[0].key==="status" && content[0].value===false && bookingStarted){
	  		var endDate = new Date().getTime();
	  		var totalTime = endDate - startDate; 

	  		Booking.update({ _id: bookingId },{$set: { 'end_time': endDate }},function(err,data){
	  				if(err){
	  					console.log('Error updating end_time' + err);
	  					var msgBody = 'Sorry! Error generating bill. We will get in touch.';
	  					var msgTitle = 'Spot vacated';

	  					var msg = generateMsg(booking,msgBody,msgTitle);
	  					pushNote(msg,pushNoteCallback);
	  					cb(null);
	  				}
	  					var d = moment.duration(totalTime);
	  					var total = Math.floor(d.asHours()) + moment.utc(totalTime).format(':mm:ss');
	  					var msgbody = 'Thank You for parking with us.Total Parking Time = '+total;
	  					var msgtitle = 'Spot vacated';
	  					//console.log(msgtitle + " " + msgbody);
	  					var msg2 = generateMsg(booking,msgbody,msgtitle);
	  					pushNote(msg2,pushNoteCallback);
	  					Spot.update({_id: bookingSpotId}, {$set: {reserved: "0"}}, function(err) {
	  							 if(err){
	  								 console.log('Spot reservation could not be removed');
	  								 cb(err);
	  							 }
	  						   console.log('Spot reservation removed');
	  					});
	  					Booking.findOneAndRemove({_id:bookingId},function(err,data){
	  						if(err){
	  							console.log('Error deleting booking' + err);
	  							cb(null);
	  						}
	  						console.log('Deleted booking ' + data._id + '\nMessage : ' + msgbody);
	  						socket.close(1000);
	  						cb(null);
	  					});
	  			});
	  		}
  	});
  	socket.on('error',function(error){
  		clearTimeout(bookingTimeout);
  		console.log('Error while connecting to web socket : ' + error);
  		cb(error);
  	});	
};

