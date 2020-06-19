'use strict';

const {request} = require('./request-service');
const _ = require('lodash');

module.exports = {platformRequest};

function platformRequest(indirectContext, userToken, ccBaseUrl, LOGGER) {

  const client = request(indirectContext, LOGGER);
  return function (params) {
    if (!userToken) {
      return Promise.resolve({error: true, errorDetails:"Null userToken Error"});
    }
    const requestParams = _.cloneDeep(params);
    requestParams.url = ccBaseUrl + requestParams.url;
    requestParams.params = {...requestParams.params, token: userToken};
    return client(requestParams);
  }
}

