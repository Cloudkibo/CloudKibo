var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// middleware to see if the request sender is authorised server or not
app.use('/sendVoipNotification', function(req, res, next){
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
  console.log(req.ip);
  console.log(ip);
  console.log('This is middleware');
  console.log(req.body)
  if(ip === '::ffff:162.243.215.177')
    next();
  else
    res.sendStatus(403);
});

var routes = require('./routes/routes');
routes(app);

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'})
});

app.listen(port);

console.log('RESTful API server started on: ' + port);
