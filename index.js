const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Hello');
});

app.listen(port, () => {
    console.log('app listening on port', port);
});