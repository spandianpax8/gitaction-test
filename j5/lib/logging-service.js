'use strict';
const {UlidMonotonic} = require('id128');
const correlationIds = require('@dazn/lambda-powertools-correlation-ids');
const LOGGER = require('@dazn/lambda-powertools-logger');

const {redactSensitiveKeys} = require('./log-redaction-service');

const RAP_ENVIRONMENT = process.env.STAGE || 'unknown';

module.exports = init;

function init(rap = {}) {
  const options = {
    // In SumoLogic the sourceCategory is what lets us partition log streams by where they came from.
    sourceCategory: `rap/${RAP_ENVIRONMENT}/${rap.repositoryName || 'unknown'}/${rap.filePath || 'unknown'}`.substring(0, 1024),
  };
  return {
    debug: debug(options),
    info: info(options),
    warn: warn(options),
    error: error(options),
    metric: metric(options),
  }
}


function debug(options) {
  return function (msg, params) {
    setLogMetaData();
    const logParams = {
      ...redactSensitiveKeys(params),
      rapSourceCategory: options.sourceCategory,
    };
    LOGGER.debug(msg, logParams)
  }
}

function info(options) {
  return function (msg, params) {
    setLogMetaData();
    const logParams = {
      ...redactSensitiveKeys(params),
      rapSourceCategory: options.sourceCategory,
    };
    LOGGER.info(msg, logParams)
  }
}

function warn(options) {
  return function (msg, params) {
    setLogMetaData();
    const logParams = {
      ...redactSensitiveKeys(params),
      rapSourceCategory: options.sourceCategory,
    };
    LOGGER.warn(msg, logParams)
  }
}

function error(options) {
  return function (msg, params) {
    setLogMetaData();
    const logParams = {
      ...redactSensitiveKeys(params),
      rapSourceCategory: options.sourceCategory,
    };
    LOGGER.error(msg, logParams)
  }
}

function metric(options) {
  return function (msg, params) {
    setLogMetaData();
    const logParams = {
      ...redactSensitiveKeys(params),
      isMetric: true,
      rapSourceCategory: options.sourceCategory,
    };
    LOGGER.info(msg, logParams)
  }
}

function setLogMetaData() {
  correlationIds.set("timestamp", new Date().getTime());
  correlationIds.set("log-id", UlidMonotonic.generate().toRaw());
}
