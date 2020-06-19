'use strict';

module.exports = {exec};

//External
const {get} = require('lodash');
const correlationIds = require('@dazn/lambda-powertools-correlation-ids');

//Internal
const loggingService = require('./lib/logging-service');
const MetricService = require('./lib/metric-service');
const {renderObject} = require('./lib/mustache-service');
const {request} = require('./lib/request-service');
const {callbackConfigToRequestConfig} = require('./lib/request-config-helper');
const {executeScriptInSandbox} = require('./lib/sandbox-service');


//Constants
const INTERFACE_FUNCTION_CALL = 'execute();\n';

async function exec(requestPackage, context) {
  const startTime = new Date();
  let rap = parseRequest(requestPackage);
  const metricService = MetricService(requestPackage);
  const LOGGER = loggingService(rap);
  const callback = request(null, LOGGER);
  correlationIds.set("rap-invocation-id", rap.invocationId);
  correlationIds.set("rap-id", rap.rapId);
  correlationIds.set("rap-version", rap.version);
  correlationIds.set("aws-request-id", context.awsRequestId);
  //https://github.com/userpixel/micromustache#options
  const miniMustacheOptions = {propsExist: false};
  process.on('uncaughtException', (e) => {
    LOGGER.error("Uncaught Error for request", {requestPackage: requestPackage, error, e});
  });

  let wasSuccess = true;
  try {
    LOGGER.info(`Received request`, {requestPackage: requestPackage});

    const result = await executeScriptInSandbox(LOGGER, rap, INTERFACE_FUNCTION_CALL);
    // If the lifecycle config specifies a body, we use it when calling back, otherwise, we use script result.
    const successCallbackData = rap.configuration.completion.body
      ? renderObject(rap.configuration.completion.body, result, miniMustacheOptions)
      : result;
    // we need to run the call back and metric in parallel
    metricService.log(startTime, wasSuccess);
    await callback(callbackConfigToRequestConfig(rap.configuration.completion, successCallbackData));
    return buildResponse(200, result);
  } catch (e) {
    wasSuccess = false;
    const originalError = buildError(e, requestPackage);
    LOGGER.error(e.message || 'There was an error processing RAP', {error: e, requestPackage});
    try {
      const errorCallbackData = rap.configuration.error.body
        ? renderObject(rap.configuration.error.body, originalError, miniMustacheOptions)
        : originalError;
      metricService.log(startTime, wasSuccess);
      await callback(callbackConfigToRequestConfig(rap.configuration.error, errorCallbackData));
    } catch (e) {
      const secondaryError = buildError(e, requestPackage);
      LOGGER.error(e.message || 'There was an error processing RAP', {error: e, requestPackage});
      await callback(callbackConfigToRequestConfig(rap.configuration.error, rap.configuration.error || secondaryError));
    }
    return buildResponse(400, e);
  }

}

function buildError(error, requestPackage) {
  return {
    pax8ErrorType: error.pax8ErrorType || 'Unknown',
    error: error,
    requestPackage: requestPackage,
    detail: `Error when resolving request ->\n\t '${JSON.stringify(requestPackage)}'\n\t ${error}`
  };
}

function parseRequest(requestPackage) {
  return JSON.parse(get(requestPackage, 'Records[0].body') || '{}') || {};
}

function buildResponse(statusCode, body) {
  return {
    statusCode,
    body,
  };
}
