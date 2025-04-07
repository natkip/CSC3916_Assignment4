let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath});
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let User = require('../Users');
let Movie = require('../Movies');
let Review = require('../Reviews');
chai.should();

chai.use(chaiHttp);

let login_details = {
    name: 'test2',
    username: 'email2@email.com',
    password: '123@abc'
}

let review_details = {
    movieId: '',
    username: 'test2',
    review: 'great movie - 0e65db9f-40db-4511-bbbe-c484f69e3032',
    rating: 1
}

let token = ''
let movieId = null

describe('Test Review Routes', () => {
   before((done) => {
        User.deleteOne({ name: 'test2'}, function(err) {
            if (err) throw err;
        });
        Movie.deleteOne({ title: 'Alice in Wonderland'}, function(err) {
            if (err) throw err;
        });
        Review.deleteOne({ review: review_details.review }, function(err) {
            if (err) throw err;
        });
       done();
    });

    after((done) => {
        User.deleteOne({ name: 'test2'}, function(err) {
            if (err) throw err;
        });
        Movie.deleteOne({ title: 'Alice in Wonderland'}, function(err) {
            if (err) throw err;
        });
        Review.deleteOne({ review: review_details.review }, function(err) {
            if (err) throw err;
        });
        done();
    });

    describe('/signup', () => {
        it('should register, login and get the token', (done) => {
            chai.request(server)
                .post('/signup')
                .send(login_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    chai.request(server)
                        .post('/signin')
                        .send(login_details)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            token = res.body.token;
                            done();
                        });
                });
        });
    });

    describe('GET Movies', () => {
        it('should return all movies', (done) => {
            chai.request(server)
                .get('/movies')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    res.body.forEach(movie => {
                        movie.should.have.property('_id');
                        review_details.movieId = movie._id;
                        movie.should.have.property('title');
                        movie.should.have.property('releaseDate');
                        movie.should.have.property('genre');
                        movie.should.have.property('actors');
                    });
                    done();
                });
        });

        it('should return movies with reviews', (done) => {
            chai.request(server)
                .get('/movies?reviews=true')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    res.body[0].should.have.property('reviews');
                    done();
                });
        });

        it('should return 404 for non-existent movie', (done) => {
            chai.request(server)
                .get('/movies/invalidMovieId')
                .end((err, res) => {
                    res.should.have.status(404);
                    res.body.should.have.property('message').eql('Movie not found');
                    done();
                });
        });
    });

    describe('Review Movies', () => {
        it('should successfully create a review', (done) => {
            chai.request(server)
                .post('/reviews')
                .set('Authorization', `Bearer ${token}`)
                .send(review_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.message.should.eq('Review created!');
                    done();
                });
        });

        it('should fail to create a review with missing rating', (done) => {
            chai.request(server)
                .post('/reviews')
                .set('Authorization', `Bearer ${token}`)
                .send({ movieId: review_details.movieId, username: 'user1', review: 'Incomplete data' })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').eql('Rating is required');
                    done();
                });
        });
    });
});
