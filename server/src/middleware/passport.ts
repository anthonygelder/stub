import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config';
import { findOrCreateOAuthUser } from '../services/oauth.service';

if (config.oauth.google.clientId) {
  passport.use(new GoogleStrategy({
    clientID: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    callbackURL: '/api/auth/google/callback',
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser('google', profile.id, {
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName,
      });
      done(null, user);
    } catch (err) { done(err as Error); }
  }));
}

// Apple strategy scaffold — requires actual keys to work
if (config.oauth.apple.clientId) {
  // passport.use(new AppleStrategy({...}, async (...) => {...}));
}

export default passport;
