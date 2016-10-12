/**
 * http://usejsdoc.org/
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var areaSchema = new Schema({
    loc: {
        type: { type: String },
        coordinates: [],
    }
});

areaSchema.index({ "loc": "2dsphere" });
module.exports = mongoose.model('Area',areaSchema);