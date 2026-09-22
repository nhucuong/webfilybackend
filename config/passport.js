const passport = require("passport");
const AuthkeySetting = require("../models/AuthkeySetting");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;


const initializePassport = async () => {
  try {
    const settings = await AuthkeySetting.findOne();
    
    if (!settings) {
      throw new Error("Auth settings not found");
    }

    // Google
    if (
      settings.google?.enabled &&
      settings.google.apiKey &&
      settings.google.apiSecretKey
    ) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: settings.google.apiKey,
            clientSecret: settings.google.apiSecretKey,
            callbackURL: settings.google.apiRedirectUrl,
          },
          async (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
          }
        )
      );
    }

    // Github
    if (
      settings.github?.enabled &&
      settings.github.apiKey &&
      settings.github.apiSecretKey
    ) {
      passport.use(
        new GitHubStrategy(
          {
            clientID: settings.github.apiKey,
            clientSecret: settings.github.apiSecretKey,
            callbackURL: settings.github.apiRedirectUrl,
            scope: ["user:email"],
          },
          async (accessToken, refreshToken, profile, done) => {
            profile.accessToken = accessToken;
            return done(null, profile);
          }
        )
      );
    }

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));
  } catch (error) {
  }
};

module.exports = {
  passport,
  initializePassport,
};