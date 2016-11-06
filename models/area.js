/**
 * http://usejsdoc.org/
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var areaSchema = new Schema({
    loc: {
        type: { type: String },
        coordinates: [],
    },
    name : String,
    park_id : String,
    spots : [{ type: Schema.Types.ObjectId, ref: 'Spot' }]
});	

areaSchema.index({ "loc": "2dsphere" });
module.exports = mongoose.model('Area',areaSchema);