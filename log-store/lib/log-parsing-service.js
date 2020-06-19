const functionName = function (logGroup) {
  return logGroup.split('/').reverse()[0]
};

const lambdaVersion = function (logStream) {
  const start = logStream.indexOf('[');
  const end = logStream.indexOf(']');
  return logStream.substring(start + 1, end)
};

const tryParseJson = function (str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    console.log(`There was an error parsing log event: ${str} with error: ${e.message}.`);
    return null
  }
};

const parseLogMessage = function (logEvent) {
  if (logEvent.message.startsWith('START RequestId') ||
    logEvent.message.startsWith('END RequestId') ||
    logEvent.message.startsWith('REPORT RequestId')) {
    return null
  }

  let parts = logEvent.message.split('\t', 4);
  let requestId = parts[1];
  let event = parts[3];
  let fields = tryParseJson(event);
  if (fields) {

    let level = (fields.sLevel || 'DEBUG').toUpperCase();
    let message = fields.message;
    let rapInvocationId = fields['x-correlation-rap-invocation-id'];
    let rapVersion = fields['x-correlation-rap-version'];
    let logId = fields['x-correlation-log-id'];
    let logTimestamp = fields['x-correlation-timestamp'];
    let checkpointName = fields['checkpointName'];

    delete fields.sLevel;
    delete fields.message;
    delete fields['x-correlation-rap-invocation-id'];
    delete fields['x-correlation-rap-version'];
    delete fields['x-correlation-log-id'];
    delete fields['x-correlation-timestamp'];

    const logItem = {
      level,
      message,
      fields,
      rapInvocationId,
      rapVersion,
      logId,
      logTimestamp,
      requestId,
      checkpointName
    };

    // Echo logs through so that Sumo Logic collector can get them.
    console.log(JSON.stringify({...logItem, sumoEcho:true}));

    return logItem;
  } else {
    console.warn(`Log event ${JSON.stringify(logEvent)} did not contain required data to be saved to dynamo`);
    return null
  }
};

module.exports = {
  functionName,
  lambdaVersion,
  logMessage: parseLogMessage
};