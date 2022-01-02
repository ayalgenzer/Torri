const express = require('express');
const { getExchangeRates, deleteRateEntry } = require('./exchange-rates-api');

const router = express.Router();

router.get('/exchange-rates', getExchangeRates);

router.delete('/delete-rate-entry', deleteRateEntry);

module.exports = { router };
