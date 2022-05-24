const mongoose = require('mongoose');
const config = require('config'); // gets config file in order to use the string in default.json
const db = config.get('mongoURI'); // gets us the value we entered in default.json note: get can get us any value in that file, in this case 'mongoURI'

// using async await to connect to mongoDB
const connectDB = async () => { // function to be called from server.js
    try { // sync-await wrapped inside of try-catch block to check for errors
        await mongoose.connect(db); // mongoose.connect returns a promise which we 'await' for
        console.log('MongoDB Connected...');
    } catch(err) {
        console.error(err.message);
        // EXIT process if fails
        process.exit(1);
    }
}

module.exports = connectDB;