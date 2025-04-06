var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const MovieSchema = new Schema({
    title: { type: String, required: true, index: true },
    releaseDate: { type: Number, min: [1900, 'Must be greater than 1899'], max: [2100, 'Must be less than 2100'] },
    genre: { 
        type: String, 
        enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'] 
    },
    actors: [{
        actorName: { type: String, required: true },
        characterName: { type: String, required: true }
    }],
});

module.exports = mongoose.model('Movie', MovieSchema);
