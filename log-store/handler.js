'use strict';

const Promise = require('bluebird');
const zlib = Promise.promisifyAll(require('zlib'));

const {processAll} = require('./lib/dynamo-service');

async function shipLogs(event, context) {
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const json = (await zlib.gunzipAsync(payload)).toString('utf8');
  const logEvent = JSON.parse(json);


  await processAll(logEvent.logGroup, logEvent.logStream, logEvent.logEvents);
  console.log(`Successfully processed ${logEvent.logEvents.length} log events.`)
}

module.exports = {shipLogs};