'use strict';
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

const http = require('http').createServer(app);
const io = require('socket.io')(http);

const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

fccTesting(app); //For FCC testing purposes

// Generate hash for session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));

// Passport initialize
app.use(passport.initialize());
app.use(passport.session());

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

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);



myDB(async (client) => {
  const myDataBase = await client.db('advnode').collection('users');
  
  routes(app, myDataBase);
  auth(app, myDataBase);

  let currentUsers = 0;
  
  //io.emit('user count', currentUsers);
  io.on('connection', socket => {
    ++currentUsers;
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    });
    //console.log('A user has connected');
    console.log('user ' + socket.request.user.name + ' connected');
    socket.on('disconnect', () => {
      console.log('user ' + socket.request.user.name + ' has disconnected');
      --currentUsers;
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: false
      });
    });

  });


  // Catching errors
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});
// app.listen out here...
let currentUsers = 0;
const port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}








