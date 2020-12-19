'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes

// Request Logger
app.use((req, res, next) => {
  console.log(req.method + " " + req.path + " - " + req.ip);
  next();
})

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug')

/*
app.route('/').get((req, res) => {
  res.render(process.cwd() + '/views/pug/index', {title: 'Hello', message: 'Please login'});;
});
*/


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

// Passport serialize / deserialize


myDB(async (client) => {
  const myDataBase = await client.db('extrack').collection('users');

  app.route('/').get((req, res) => {
    res.render('pug', {
      title: 'Database is ready!!',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });

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
        if (!user) { return done(null, false); }
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

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
          myDataBase.insertOne({
            username: req.body.username,
            password: req.body.password
          },
            (err, doc) => {
              if (err) {
                console.log(err);
                res.redirect('/');
              } else {
                // The inserted document is held within
                // the ops property of the doc
                console.log(doc.ops);
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

  // Catching errors
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});
// app.listen out here...

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});





/*
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});
*/


