const AWS = require('aws-sdk');
const parser = require('./log-parsing-service');

const LOG_TABLE = process.env.DYNAMODB_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

function processAll(logGroup, logStream, logEvents) {
  const lambdaVersion = parser.lambdaVersion(logStream);
  const functionName = parser.functionName(logGroup);

  const dataPromises = [];

  for (const logEvent of logEvents) {
    try {
      const log = parser.logMessage(logEvent);
      if (log && log.rapInvocationId) {
        log.logStream = logStream;
        log.logGroup = logGroup;
        log.functionName = functionName;
        log.lambdaVersion = lambdaVersion;
        log.fields = log.fields || {};
        log.type = "cloudwatch";
        const params = {
          TableName: LOG_TABLE,
          Item: {
            rap_invocation_id: log.rapInvocationId,
            log_id: log.logId,
            timestamp: log.logTimestamp,
            message: log.message,
            data: log.fields,
            checkpoint_name: log.checkpointName,
            log_level: log.level,
            aws_execution_id: log.requestId
          }
        };
        dataPromises.push(dynamoDb.put(params).promise())
      }
    } catch (err) {
      console.error(err.message)
    }
  }
  return Promise.all(dataPromises)
}

module.exports = {processAll};