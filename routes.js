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
  
  // Generate hash for session
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
  }));

  // Passport initialize
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.route('/').get((req, res) => {
    res.render('pug', {
      title: 'Database is ready!!',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  app.route('/login').post(
    passport.authenticate('local',{failureRedirect: '/' }),
    (req,res)=>{
      res.redirect('/profile')
    }
  );

  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, function(err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          const hash = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          },
            (err, doc) => {
              if (err) {
                console.log(err);
                res.redirect('/');
              } else {
                // The inserted document is held within
                // the ops property of the doc
                console.log(doc);
                next(null, doc.ops[0]);
              }
            }
          )
        }
      })
    },
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
        res.redirect('/profile');
      }
    );

  /*
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
    });
  */

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

  app.route('/profile').get(ensureAuthenticated, (req,res)=>{
    res.render('./pug/profile.pug',{
      title: "profile!!",
      username: req.user.username
      });
  });
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
  });

  app.route('/auth/github')
    .get(
      passport.authenticate('github')
    )

  app.route('/auth/github/callback')
    .get(
      passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {res.redirect('/profile');}
    )


}