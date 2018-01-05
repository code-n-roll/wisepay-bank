const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('./models/user');

router.post('/auth', async (req, res) => {
  const model = req.body;
  if (Object.keys(model).length === 0) {
    res.status(400).json(
      errorResponse('Invalid request data')
    );
    return;
  }

  let user = null;
  try {
    user = await User.findOne({
      'bankCard.cardNumber': model.cardNumber,
      'bankCard.holder.firstName': model.holder.firstName,
      'bankCard.holder.lastName': model.holder.lastName,
      'bankCard.cvc': model.cvc,
      'bankCard.validTo.month': model.validTo.month,
      'bankCard.validTo.year': model.validTo.year
    });
  } catch (err) {
    res.status(500).json(
      errorResponse('Something wrong')
    );
  }

  if (!user) {
    res.status(404).json(
      errorResponse('User not found')
    );
    return;
  }

  const token = jwt.sign({
    id: user.id,
    cardOwner: true
  }, process.env.BANK_SECRET_KEY);

  const idToken = jwt.sign({
    id: user.id
  }, process.env.BANK_SECRET_KEY);

  res.json({
    'accessToken': token,
    'idToken': idToken
  });
});

router.post('/sendmoney', async (req, res) => {
  const userFromToken = req.headers['authorization'];
  const { userToIdToken, amountToSend } = req.body;

  const decodedToken = jwt.verify(userFromToken, process.env.BANK_SECRET_KEY);
  const decodedUserToId = jwt.verify(userToIdToken, process.env.BANK_SECRET_KEY);

  const userFrom = await User.findOne({ _id: decodedToken.id });
  const userTo = await User.findOne({ _id: decodedUserToId.id });

  if (!decodedToken.cardOwner) {
    res.status(401).json(
      errorResponse('Access denied')
    );
    return;
  }

  if (!userFrom || !userTo) {
    res.status(404).json(
      errorResponse('Invalid token')
    );
    return;
  }

  if (userFrom.balance >= amountToSend) {
    userFrom.balance -= amountToSend;
    userTo.balance += amountToSend;

    userFrom.save();
    userTo.save();
    res.status(200).end();
  } else {
    res.status(400).json(
      errorResponse('Not enough money')
    );
  }
});

router.post('/reg', async (req, res) => {
  const model = req.body;

  if (Object.keys(model).length === 0) {
    res.status(400).json(
      errorResponse('Invalid request data')
    );
    return;
  }

  const existingUser = await User.findOne({
    'bankCard.cardNumber': model.bankCard.cardNumber
  });

  if (existingUser) {
    res.status(400).json(
      errorResponse('User with this card number already exists')
    );
  }

  const user = new User({
    bankCard: {
      cardNumber: model.bankCard.cardNumber,
      holder: {
        firstName: model.bankCard.holder.firstName,
        lastName: model.bankCard.holder.lastName
      },
      cvc: model.bankCard.cvc,
      validTo: {
        month: model.bankCard.validTo.month,
        year: model.bankCard.validTo.year
      }
    },
    balance: 1000 // Only our bank offer you free 1000$
  });

  try {
    await user.save();
    res.status(201).end();
  }
  catch (e) {
    res.status(500).json(
      errorResponse('Something happened in db')
    );
  }
});

function errorResponse(text) {
  return {
    'error': text
  };
}

module.exports = router;
