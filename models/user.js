/**
 * http://usejsdoc.org/
 * Model for User
 */

var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
	status 			 : String,
	
	google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }
});