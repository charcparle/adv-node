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
}