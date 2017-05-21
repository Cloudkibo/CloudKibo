'use strict';

var apn = require('apn');
var compose = require('composable-middleware');

var provider = new apn.Provider({
  key: "key.pem",
  production: false
});

module.exports = function(app) {
  app.route('/sendVoipNotification')
    .post(function(req, res){

      console.log(req.body);

      var deviceToken = req.body.deviceToken;

      var note = new apn.Notification();

      note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
      note.badge = req.body.badge;
      if(req.body.sound === true)
        note.sound = "ping.aiff";
      note.alert = req.body.alert;
      note.payload = req.body.payload;

      provider.send(note, deviceToken).then(function(result) {

        // see documentation for an explanation of result
        console.log('result of voip push');
        console.log(result)
        if (result.failed.length > 0) {
          console.log(result.failed[0].response);
        }

        res.status(200).json(result);

      });
    });
};
