'use strict';

const uuid = require('uuid');
const xmlHttp = require('./xml-http-service');
const http = require('@dazn/lambda-powertools-http-client');
const {renderObject} = require('./mustache-service');
const _ = require('lodash');

module.exports = {request, stripQueryParams};

function request(rapContext, LOGGER) {
  if (!LOGGER) {
    throw new Error("Uninitialized Request LOGGER");
  }
  return async function (userConfig) {
    const requestGuid = uuid.v4();
    let response;
    try {
      const requestConfig = computeRequestConfig(rapContext, userConfig);
      LOGGER.info(`Attempting request to '${userConfig.url}'`, buildAuditRecord('request', requestGuid, requestConfig));
      try {
        if(userConfig.xml) {
          response = await xmlHttp(requestConfig);
        } else {
          response = await http(requestConfig);
        }
      } catch (error) {
        //MS JSON Parsing Compatibility.
        if (error.statusCode === 200 && error.name === 'SyntaxError') {
          response = {
            status: error.statusCode,
            res: {statusMessage: 'OK'},
            body: JSON.parse(error.rawResponse.substring(1, error.rawResponse.length)),
            headers: {}
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      LOGGER.error(`Error resolving request to '${userConfig.url}, error: ${error.message}'`, buildAuditRecord('request', requestGuid, error));
      return {
        error: {
          requestGuid,
          errorDetails: error
        }
      };
    }
    const clientResponse = buildClientResponse(response, userConfig.xml);
    const responseAudit = buildResponseAudit(response, userConfig.xml);

    LOGGER.info(`Received response from '${userConfig.url}'`, buildAuditRecord('response', requestGuid, responseAudit));
    return clientResponse;

    function buildClientResponse(response, xmlFlag) {
      const clientResponse = {
        error: false,
        status: response.status,
        headers: response.headers,
      }

      if(xmlFlag) {
        clientResponse.statusText = response.statusText;
        clientResponse.data = response.data;
      } else {
        clientResponse.statusText = response.res.statusMessage;
        clientResponse.data = response.body;
        if(clientResponse.headers['content-type'] && clientResponse.headers['content-type'].startsWith('text/html')){
          clientResponse.text = response.text;
        }
      }

      return clientResponse
    }

    function buildResponseAudit(response, xmlFlag) {
      const responseAudit = {
        statusCode: response.statusCode,
        text: response.text,
        headers: response.headers,
        url: _.get(response, 'request.url')
      };

      if(xmlFlag) {
        responseAudit.body = response.data;
        responseAudit.type = response.headers['content-type'];
      } else {
        responseAudit.body =  response.body;
        responseAudit.type = response.type;
      }

      return responseAudit;
    }

    function computeRequestConfig(rapContext, userConfig) {

      //https://github.com/userpixel/micromustache#options
      const miniMustacheOptions = {propsExist: false};

      const requestConfig = {timeout: 60000};
      requestConfig.method = userConfig.method;
      let headers = {};
      requestConfig.uri = renderObject(userConfig.url, rapContext, miniMustacheOptions);
      if (userConfig.data) {
        requestConfig.body = renderObject(userConfig.data, rapContext, miniMustacheOptions)
      }
      if (userConfig.headers) {
        headers = renderObject(userConfig.headers, rapContext, miniMustacheOptions)
      }
      if (userConfig.params) {
        requestConfig.qs = renderObject(userConfig.params, rapContext, miniMustacheOptions)
      }
      requestConfig.timeout = 60 * 1000; // 60 seconds
      if (userConfig.timeout) {
        requestConfig.timeout = userConfig.timeout
      }

      requestConfig.headers = { ...headers, "x-correlation-request-id": requestGuid };
      return requestConfig;
    }
  };
}



function buildAuditRecord(type, guid, data) {
  return {
    type: type,
    guid: guid,
    data: data
  };
}

function stripQueryParams(message) {
  if (!message || message === "" || !_.isString(message)) {
    return message;
  }
  const qsIndex = message.indexOf("?");
  if (qsIndex > 0) {
    return message.substr(0, qsIndex);
  }
  return message
}
