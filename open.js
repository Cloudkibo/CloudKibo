// Test Playground
// This is just test script, don't run it for main project
// I use it to do quick testing of any library or concepts

var someDate = new Date();
console.log(someDate);
var newDate = new Date(someDate.setSeconds(someDate.getSeconds()+5));
console.log(newDate);

var schedule = require('node-schedule');

var x = 'Tada!';
var x2 = 'bodo';
var j = schedule.scheduleJob(newDate, function(y, z){
  console.log(y);
  console.log(z)
}.bind(null, x, x2));

x = 'Changing Data';
