/**
 * http://usejsdoc.org/
 */
var https = require('https');
var authorization = process.env.PUSHNOTE_AUTHORIZATION;
module.exports = function(msg,cb){
	var options = {
			  host: 'fcm.googleapis.com',
			  path: '/fcm/send',
			  method : 'POST',
			  headers: {'Authorization' :authorization,'Content-Type' : 'application/json'}
			};
		var callback = function(response) {
		  var str = '';
		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });
		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
		    //console.log('DONE :' + str);
		    cb(null);
		  });
		};

		try{
		//console.log(msg);
		var req = https.request(options, callback);
		req.write(JSON.stringify(msg));
		req.end();
		}
		catch(err){
			console.log('Error in pushing : ' + err);
			cb(msg);
		}	
	};