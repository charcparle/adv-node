require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const routes = require('./routes.js')
const auth = require('./auth.js')
const GitHubStrategy = require('passport-github').Strategy;

const app = express();


module.exports = function (app, myDataBase) {


  
  // Serialization and deserialization here...
  const ObjectID = require('mongodb').ObjectID
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  // Local Strategy
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { 
          console.log("no such user");
          return done(null, false); 
        }
        if (!bcrypt.compareSync(password, user.password)) {
          console.log("bcrypt password not equal") 
          console.log(`password: {$password}`)
          console.log(`user.password: {$user.password}`)
          return done(null, false);
        }
        return done(null, user);
      });
    }
  ));

  // GitHub authentication strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://adv-node.charlescheng1.repl.co/auth/github/callback'},
    function(accessToken, refreshToken, profile, cb) {
      //console.log(profile);
      //Database logic here with callback containing our user object
      myDataBase.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, new: true },
        (err, doc) => {
          return cb(null, doc.value);
        }
      );
    }
  ));

}