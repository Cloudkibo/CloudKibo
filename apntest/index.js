var apn = require('apn');

console.log(Date.now());

var provider = new apn.Provider({
  // token: {
  //   key: "key.pem",
  //   keyId: "88 27 17 09 A9 B6 18 60 8B EC EB BA F6 47 59 C5 52 54 A3 B7",
  //   teamId: "LRN8T5S99N"
  // },
  //cert: "cert.pem",
  key: "key.pem",
  production: false
});

//var deviceToken = "e61cc0fb10f943d8632815a3029344a0ba70f81e86edb86a32eb8d6b55decd10";
var deviceToken = "621fa6d331cda4076318851e1e40411d97f543c97a97bfd470631d957afb17e2";

var note = new apn.Notification();

note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
note.badge = 3;
note.sound = "ping.aiff";
note.alert = "You have a new message";
note.payload = { 'messageFrom': 'Sojharo'};
//note.topic = "iCloud.MyAppTemplates.cloudkibo";//"com.cloudkibo";

setTimeout(function(){
  console.log('going to send push');
  provider.send(note, deviceToken).then(function(result) {
    // see documentation for an explanation of result
    console.log('result of voip push');
    console.log(result)
    if(result.failed){
      console.log(result.failed[0].response);
    }
  });
}, 2000);
