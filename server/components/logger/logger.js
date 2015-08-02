var fs = require('fs');


var dir = __dirname + "/../log";
var clientFile = dir + '/client';
var serverFile = dir + '/server';

exports.clientLog = function(data) {

  fs.readFile(clientFile, 'utf8', function (err, configFile) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    configFile += ''+ Date.now() +': '+ data +'\n';

    fs.writeFile(clientFile, configFile, function (err) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }

      fs.close(clientFile, function(){
        console.log('file is updated');
      });

    });

  });
};

exports.serverLog = function(data) {

  fs.readFile(serverFile, 'utf8', function (err, configFile) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    configFile += ''+ Date.now() +': '+ data +'\n';

    fs.writeFile(serverFile, configFile, function (err) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }

      fs.close(serverFile, function(){
        console.log('file is updated');
      });

    });

  });
};
