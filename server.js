/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});
//POST: Creates a new movie
router.post('/movies', authJwtController.isAuthenticated, async (req, res) => {
    const { title, releaseDate, genre, actors } = req.body;
    if (!title || !releaseDate || !genre || !actors) {
      return res.status(400).json({ success: false, msg: 'Missing movie information.' });
    }
    try {
      const movie = new Movie({ title, releaseDate, genre, actors });
      await movie.save();
      res.status(201).json({ success: true, msg: 'Movie created successfully. '});
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Error creating movie.' });
    }
  });
  
  //GET: Retrieves all movies
  router.get('/movies', authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movies = await Movie.find({});
      res.json({ success: true, movies });
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Error fetching movies.' });
    }
  });
  
  //GET: Retrieve a specific movie by title
  router.get('/movies/:title', authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findOne({ title: req.parans.title });
      if (!movie) return res.status(404).json({ success: false, msg: 'Movie not found.' });
      res.json({ success: true, movie });
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Error retrieving movie.' });
    }
  });
  
  //PUT: Update a specific movie by title
  router.put('/movies/:title', authJwtController.isAuthenticated, async (req, res) => {
    try {
      const updatedMovie = await Movie.findOneAndUpdate({ title: req.params.title }, req.body, { new: true });
      if ( !updatedMovie) return res.status(404).json({ success: false, msg: 'Movie not found. '});
      res.json({ success: true, msg: 'Movie updated successfully.', updatedMovie });
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Error updating movie.' });
    }
  });
  
  //DELETE: Deletes a specific movie by title
  router.delete('/movies/:title', authJwtController.isAuthenticated, async (req, res) => {
    try {
      const deletedMovie = await Movie.findOneAndDelete({ title: req.params.title });
      if (!deletedMovie) return res.status(404).json({ success: false, msg: 'Movie not found. '});
      res.json({ success: true, msg: 'Movie deleted successfully. '});
    } catch (err) {
      res.status(500).json({ success: false, msg: 'Error deleting movie.' });
    }
  });
  
app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


