const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  bankCard: {
    cardNumber: String,
    holder: {
      firstName: String,
      lastName: String
    },
    cvc: Number,
    validTo: {
      month: Number,
      year: Number
    }
  },
  balance: Number
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

module.exports = User;
