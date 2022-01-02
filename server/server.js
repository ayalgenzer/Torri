const express = require('express');
const http = require('http');
const { router } = require('./router');

const main = async () => {
  const app = express();

  app.use('/api', router);

  http.createServer(app).listen(80);

  console.log('Environment == Development so not using HTTPs');
  console.log('Server listening on 80 (http)');
};

process.on('unhandledRejection', up => {
  throw up;
});

main();
