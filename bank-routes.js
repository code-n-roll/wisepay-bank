const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const secrets = require('./secrets.json');

const User = require('./models/user');

router.post('/auth', async (req, res) => {
    const model = req.body.data;
    if (!model) {
        res.status(400).end();
        return;
    }

    const user = await User.findOne({
        bankCard: {
            cardNumber: model.cardNumber,
            holder: {
                firstName: model.holder.firstName,
                lastName: model.holder.lastName
            },
            cvc: model.cvc,
            validTo: {
                month: model.validTo.month,
                year: model.validTo.year
            }
        }
    });

    if (!user) {
        res.status(404).end();
        return;
    }

    const token = jwt.sign({
        id: user.id
    }, secrets.secretKey);
    
    res.json({
        'access_token': token
    });
});

router.post('/sendmoney', async (req, res) => {
    const token = req.headers['authorization'];
    const decodedToken = jwt.verify(token, secrets.secretKey);

    const { cardFrom, cardTo, amountToSend } = req.body;
    
    const userFrom = await findUserByCardNumber(cardFrom);
    const userTo = await findUserByCardNumber(cardTo);
    
    if (decodedToken.id !== userFrom.id) {
        res.status(401).end();
        return;
    }    

    if (!userFrom || !userTo) {
        res.status(404).end();
        return;
    }

    if (userFrom.balance >= amountToSend) {
        userFrom.balance -= amountToSend;
        userTo.balance += amountToSend;

        userFrom.save();
        userTo.save();
        res.status(200).end();
    } else {
        res.status(400).json({
            error: 'Not enough money'
        })
    }
});

async function findUserByCardNumber(cardNumber) {
    return User.findOne({
        'bankCard.cardNumber': cardNumber
    });
}

module.exports = router;