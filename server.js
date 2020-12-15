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

  // Be sure to change the title
  app.route('/').get((req, res) => {
    //Change the response to render the Pug template
    res.render('pug', {
      title: 'Database is ready!!',
      message: 'Please login',
      showLogin: true
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



app.route('/login').post(
  passport.authenticate('local',{failureRedirect: '/' }),
  (res,req)=>{
    res.redirect('/profile')
  }
);

app.get('/login', (res,req)=>{
  res.render('./views/pug/profile.pug')
});