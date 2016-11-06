/**
 * http://usejsdoc.org/
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var spotSchema = new Schema({
    id : String,
    thngId: String,
    thngKey: String
});	
module.exports = mongoose.model('Spot',spotSchema);