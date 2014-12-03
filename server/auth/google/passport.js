var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

exports.setup = function (User, config) {
  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      console.log(profile);
      User.findOne({
        'google.id': profile.id
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
            google_photo: profile._json.picture,
            username: profile.emails[0].value.split('@')[0],
            provider: 'google',
            google: profile._json
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
