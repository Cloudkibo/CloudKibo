var fs = require('fs');
var dir = __dirname + "/../../../log";
var clientFile = dir + '/client';
var serverFile = dir + '/server';

/*
1) Dev (0 thru 7 is enabled)
2) Test (0 thru 6 is enabled)
3) Prod (0 thru 4 is enabled)


0 Emergency: system is unusable
1 Alert: action must be taken immediately
2 Critical: critical conditions
3 Error: error
4 Warning: warning
5 Notice: normal but significant
6 Informational: informational
7 Debug: debug-level messages

0 error
1 warn
2 info
*/


var mode = 'Development'; // Production or Testing

var winston = require('winston');
require('winston-papertrail').Papertrail;

var logger = new winston.Logger({
  transports: [
    new winston.transports.Papertrail({
      host: 'logs3.papertrailapp.com',
      port: 45576
    })
  ]
});


exports.serverLog = function(label, data) {

  var labelNumber = 0;
/*
  switch (label) {
    case 'Emergency':
      labelNumber = 0;
      break;
    case 'Alert':
      labelNumber = 1;
      break;
    case 'Critical':
      labelNumber = 2;
      break;
    case 'Error':
      labelNumber = 3;
      break;
    case 'Warning':
      labelNumber = 4;
      break;
    case 'Notice':
      labelNumber = 5;
      break;
    case 'Informational':
      labelNumber = 6;
      break;
    case 'Debug':
      labelNumber = 7;
      break;
    default:
      labelNumber = 7;
  }

*/

  switch (label) {
    case 'error':
      labelNumber = 0;
      break;
    case 'warn':
      labelNumber = 1;
      break;
    case 'info':
      labelNumber = 2;
      break;
  }

  if (mode === 'Development') {
    logger.info(data);
    //winston.log(label, data);
    //console.log('development log '+ label +': '+ data);
  }
  else if (mode === 'Testing') {
    if (labelNumber >= 0 && labelNumber <=1) {
      logger.info(data);
      //winston.log(label, data);
      console.log('testing log');
    }
  }
  else if (mode === 'Production') {
    if (labelNumber == 0) {
      logger.info(data);
      //winston.log(label, data);
      console.log('production log');
    }
  }

};


/*
exports.clientLog = function(data) {

  fs.readFile(clientFile, 'utf8', function (err, configFile) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    var today = new Date();
    var dateString = ''+ today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate() + '::' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

    configFile += ''+ dateString +' : '+ data +'\n';

    fs.writeFile(clientFile, configFile, function (err) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }


    });

  });
};

exports.serverLog = function(data) {

  fs.readFile(serverFile, 'utf8', function (err, configFile) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    var today = new Date();
    var dateString = ''+ today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate() + '::' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

    configFile += ''+ dateString +' : '+ data +'\n';

    fs.writeFile(serverFile, configFile, function (err) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }

    });

  });
};
*/
