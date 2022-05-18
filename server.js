const express = require('express');

const app = express();

app.get('/', (req, res) => res.send('API Running')); // endpoint for the data

const PORT = process.env.PORT || 5000; // looks for environment variable called port, in this case defaults to port 5000

//NOTE: use backticks (to left of #1 on keyboard) instead of single quotation here, to add variable in string
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
