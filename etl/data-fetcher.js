const cron = require('node-cron');
const axios = require('axios');
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const fs = require('fs-extra');

const currencies = ['BTC', 'ETH'];

const API_URL = 'https://api.coinbase.com/v2';
const EXCHANGE_RATE_API = 'exchange-rates?currency=';

const exchangeRatesJsonPath = `${__dirname}/../data/exchange-rates.json`;

const fetchExchangeRateApi = async () => {
  return Promise.map(currencies, async currency =>
    axios.get(`${API_URL}/${EXCHANGE_RATE_API}${currency}`)
  );
};

const formatData = parsedData => {
  const timeStamp = _.get(parsedData[0], 'timeStamp');
  const exchangeRates = _.reduce(
    _.keyBy(parsedData, 'currency'),
    (acc, value, key) => {
      acc[key] = _.omit(value, ['timeStamp', 'currency']);
      return acc;
    },
    {}
  );
  return { timeStamp, exchangeRates };
};

const parseData = exchangeApiResponse => {
  const ratesList = _.compact(
    _.map(exchangeApiResponse, response => {
      const {
        data: { data }
      } = response;
      const responseDateHeader = _.get(exchangeApiResponse, 'headers.date', null);
      const timeStamp = responseDateHeader
        ? moment(responseDateHeader).format('YYYY-MM-DD HH:mm:ss')
        : moment().format('YYYY-MM-DD HH:mm:ss');
      const currency = _.get(data, 'currency', null);
      const USD = _.get(data, 'rates.USD', null);
      const EUR = _.get(data, 'rates.EUR', null);
      return currency ? { timeStamp, currency, USD, EUR } : {};
    })
  );
  return formatData(ratesList);
};

const storeData = async ({ timeStamp, exchangeRates }) => {
  const exchangeRatesJson = await fs.readJson(exchangeRatesJsonPath);
  exchangeRatesJson[timeStamp] = exchangeRates;
  await fs.writeJson(exchangeRatesJsonPath, exchangeRatesJson);
  console.log(`Successfully Stored Exchange rates at: ${timeStamp}`);
};

const fetchCurrencies = async () => {
  try {
    const exchangeApiResponses = await fetchExchangeRateApi();
    const parsedData = parseData(exchangeApiResponses);
    await storeData(parsedData);
  } catch (e) {
    console.log(`Fetch & Store exchange rates failed: ${e.message}`);
  }
};

process.on('unhandledRejection', up => {
  throw up;
});

cron.schedule('* * * * *', async () => {
  await fetchCurrencies();
});
