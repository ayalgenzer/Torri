const _ = require('lodash');
const moment = require('moment');
const fs = require('fs-extra');

const exchangeRatesJsonPath = `${__dirname}/../data/exchange-rates.json`;

// returns desired 'to' Fiat rate [USD || EUR]
const filterToEntries = (to, entries) =>
  _.reduce(
    entries,
    (res, val, key) => {
      res[key] = _.pick(val, to);
      return res;
    },
    {}
  );

const fetchEntries = async ({ timeFrame = 5, currency = null, to = null }) => {
  console.log(`Time Frame requested - ${timeFrame} minutes`);
  const exchangeRatesJson = await fs.readJson(exchangeRatesJsonPath);

  // filter keys by timeFrame requested
  const keysByTime = _.filter(_.keys(exchangeRatesJson), key =>
    moment(key).isSameOrAfter(moment().subtract(timeFrame, 'minutes'))
  );

  // returns result set by filtering the requested Crypto currency AND/OR requested 'to' Fiat rate
  if (currency || to) {
    const data = _.reduce(
      keysByTime,
      (acc, key) => {
        const originalEntry = exchangeRatesJson[key];
        const filteredCurrencyEntry = currency ? _.pick(originalEntry, currency) : originalEntry;
        acc[key] = to ? filterToEntries(to, filteredCurrencyEntry) : filteredCurrencyEntry;
        return acc;
      },
      {}
    );
    return data;
  }
  return _.pick(exchangeRatesJson, keysByTime);
};

// Deletes exchange rate entry by timeFrame
const deleteRateEntry = async (req, res) => {
  try {
    const { entry } = req.query;
    console.log(`Starting delete operation for entry: ${entry}`);
    if (moment(entry).isValid()) {
      const exchangeRatesJson = await fs.readJson(exchangeRatesJsonPath);
      const deletedEntry = _.pick(exchangeRatesJson, entry);
      const updatedExchangeRatesJson = _.omit(exchangeRatesJson, entry);
      await fs.writeJson(exchangeRatesJsonPath, updatedExchangeRatesJson);
      console.log(`Successfully delete entry: ${deletedEntry}`);
      res.sendStatus(200);
    } else throw new Error(`Entry param - ${entry} is invalid`);
  } catch (e) {
    console.log(`Delete operation failed - ${e.message}`);
    res.status(e.status || 500).send({
      error: {
        status: e.status || 500,
        message: e.message || 'Internal Server Error'
      }
    });
  }
};

const getExchangeRates = async (req, res) => {
  try {
    console.log(`Fetching exchange rates`);
    const entries = await fetchEntries(req.query);
    res.json({ data: entries });
    console.log(`Successfully Fetched exchange rates`);
  } catch (e) {
    console.log(`Fetch Exchange Rates operation failed - ${e.message}`);
    res.status(e.status || 500).send({
      error: {
        status: e.status || 500,
        message: e.message || 'Internal Server Error'
      }
    });
  }
};

module.exports = { getExchangeRates, deleteRateEntry };
