const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useMongoClient: true
});
mongoose.Promise = global.Promise;

const bankRoutes = require('./bank-routes');

const app = express();
app.use(bodyParser.json())

app.use('/', bankRoutes);

app.listen(8001, () => {
  console.log('bank listening')
});
