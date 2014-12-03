var passport = require('passport');
var WindowsLiveStrategy = require('passport-windowslive').Strategy;

exports.setup = function (User, config) {
  passport.use(new WindowsLiveStrategy({
      clientID: config.windowslive.clientID,
      clientSecret: config.windowslive.clientSecret,
      callbackURL: config.windowslive.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      console.log(profile);
      User.findOne({
        'windowslive.id': profile.id
      }, function(err, user) {
		if (err) {
          return done(err);
        }
        if (!user) {
          user = new User({
            firstname : profile.name.givenName,
		        lastname : profile.name.familyName,
            email: profile.emails[0].value,
            role: 'user',
            windows_photo: profile.photos[0].value,
            phone : profile._json.phones.personal,
            username: profile.username,
            provider: 'windowslive',
            windowslive: profile._json
          });
          user.save(function(err) {
            if (err) done(err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));
};
