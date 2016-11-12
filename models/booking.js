/**
 * http://usejsdoc.org/
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bookingSchema = new Schema({
    user_id : String,
    spot_id: String,
    start_time: {type:Date},
    end_time: {type:Date},
});	
module.exports = mongoose.model('Booking',bookingSchema);