var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Article = require("../models/article");

router.post('/register', function (req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({ success: false, msg: 'Please pass username and password.' });
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      address: req.body.address
    });
    // save the user
    newUser.save(function (err) {
      if (err) {
        return res.json({ success: false, msg: 'Username already exists.' });
      }
      res.json({ success: true, msg: 'Successful created new user.' });
    });
  }
});

router.post('/login', function (req, res) {
  User.findOne({
    username: req.body.username
  }, function (err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.sign(user.toJSON(), config.secret, {
            expiresIn: 604800 // 1 week
          });
          // return the information including token as JSON
          res.json({ success: true, token: 'JWT ' + token });
        } else {
          res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
        }
      });
    }
  });
});

router.get('/logout', passport.authenticate('jwt', { session: false }), function (req, res) {
  req.logout();
  res.json({ success: true, msg: 'Sign out successfully.' });
});

router.get('/', function (req, res) {
  Article.find({}, function (err, data) {
    res.render('data.ejs', {
      table: data
    })
  })
})

router.post('/articles', passport.authenticate('jwt', { session: false }), function (req, res) {
  var token = getToken(req.headers);

  if (token) {
    console.log(req.body);
    var newArticles = new Article({
      title: req.body.title,
      body: req.body.body,
      author: req.body.author,
      access_token: token
    });

    newArticles.save(function (err) {
      if (err) {
        return res.json({ success: true, msg: 'Succesfully logged' });
      }
      res.json({ success: true, msg: 'Successful created new article.' });
    });
  } else {
    return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
});

// get json article data
router.get('/articles', function (req, res) {
  Article.find(function (err, articles) {
    if (err) return next(err);
    res.json(articles);
  });

})


router.get('/*', function (req, res) {
  res.send('<h4 style="color:red;text-align:center;position:relative;top:30%">Contact to API controller<br>Mail To: <a href="mailto:sde.anilyadav@gmail.com">sde.anilyadav@gmail.com</h4>');
});

router.get('/articles', passport.authenticate('jwt', { session: false }), function (req, res) {
  var token = getToken(req.headers);
  if (token) {
    Article.find(function (err, articles) {
      if (err) return next(err);
      res.json(articles);
    });
  } else {
    return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};


module.exports = router;
