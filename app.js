const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const host = '0.0.0.0';
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

require('./routes')(app);
app.get('*', (req, res) => res.status(200).send({
  message: 'Welcome to the beginning of nothingness.',
}));

app.listen(port,host, () => console.log(`Example app listening on ${host}:${port}!`))