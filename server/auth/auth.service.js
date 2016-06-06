'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var User = require('../api/user/user.model');
var CompanyAccount = require('../api/companyaccount/companyaccount.model');
var validateJwt = expressJwt({ secret: config.secrets.session });

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(function(req, res, next) {
      //console.log(req.headers);
      if(req.headers.hasOwnProperty('kibo-app-id')){
        if(req.headers['kibo-app-id'] === '5wdqvvi8jyvfhxrxmu73dxun9za8x5u6n59'){
          console.log('app id is known');
          if(req.headers['kibo-app-secret'] === 'jcmhec567tllydwhhy2z692l79j8bkxmaa98do1bjer16cdu5h79xvx'){
            console.log('client secret is correct')
            User.findOne({username: req.headers['kibo-client-id']}, function(err, user){
              console.log(err)
              console.log(user)
              if(err) return next(err);
              if(user) {
                req.user = user;
                next();
              } else {
                if(req.headers['kibo-client-id'] === 'cd89f71715f2014725163952') {
                  next();
                } else {
                  CompanyAccount.findOne({appid: req.headers['kibo-app-id'], appsecret: req.headers['kibo-app-secret'], companyid: req.headers['kibo-client-id']}, function(err, company){
                    if(err) return next(err)
                    if(company){
                      next();
                    } else {
                      console.log('client app is not authorized');
                      return res.send(401);
                    }
                  })
                }
              }
            })

          }
        }
      } else if(req.headers.hasOwnProperty('kibo-token')){
        // https://graph.accountkit.com/v1.0/me/?access_token=<access_token>
        console.log(req.headers['kibo-token']);

        var needle = require('needle');

        var options = {
          headers: {
            'X-Custom-Header': 'CloudKibo Web Application'
          }
        }

        needle.get('https://graph.accountkit.com/v1.0/me/?access_token='+req.headers['kibo-token'], options, function(err, resp) {
          console.log(err);
          console.log(resp.body);
          User.findOne({phone: resp.body.phone.number}, function(err, user){
            if (!user) return res.send(401);
            req.user = user;
            next();
          })
        });

      } else {
        // allow access_token to be passed through query parameter as well
        if(req.query && req.query.hasOwnProperty('access_token')) {
          req.headers.authorization = 'Bearer ' + req.query.access_token;
        }
        validateJwt(req, res, next);
      }
    })
    // Attach user to request
    .use(function(req, res, next) {
      if(typeof req.user === 'undefined' && req.headers['kibo-client-id']) return next();
      User.findById(req.user._id, function (err, user) {
        if (err) return next(err);
        if (!user) return res.send(401);

        req.user = user;
        next();
      });
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.send(403);
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({ _id: id }, config.secrets.session, { expiresInMinutes: 60*24*3 });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) return res.json(404, { message: 'Something went wrong, please try again.'});
  var token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
