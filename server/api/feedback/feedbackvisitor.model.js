/**
 * Created by Saba on 02/23/2015.
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var feedbackvisitor = new Schema({
    name : String,
    email : String,
    message : String,
    datetime : {type: Date, default: Date.now }
});

module.exports = mongoose.model('feedbackvisitor', feedbackvisitor);
