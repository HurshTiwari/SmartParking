/**
 * http://usejsdoc.org/
 */
var https = require('https');
module.exports= function (spot,length,cb){
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
	    console.log(str);
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
	
}; 

