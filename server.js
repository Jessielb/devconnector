const express = require('express');
const connectDB = require('./config/db'); // require file we created with our db connection

const app = express();

// Connect Database
connectDB();

app.get('/', (req, res) => res.send('API Running')); // endpoint for the data

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000; // looks for environment variable called port, in this case defaults to port 5000

//NOTE: use backticks (to left of #1 on keyboard) instead of single quotation here, to add variable in string
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
