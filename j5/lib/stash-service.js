'use strict';

const _ = require('lodash');
const {request} = require('./request-service');

module.exports = {
  init,
};

function init(rootContext, LOGGER) {
  const requester = request(null, LOGGER);
  const rapInvocationId = _.get(rootContext, 'invocation.id');
  const ccBaseUrl = rootContext.ccBaseUrl;
  const authToken = rootContext.authToken;
  return {
    get: get(ccBaseUrl, authToken, requester),
    save: save(ccBaseUrl, authToken, requester, rapInvocationId),
  }
}

function get(ccBaseUrl, authToken, requester) {
  return function (sortKey, guid) {
    return requester({
      method: 'GET',
      url: `${ccBaseUrl}/api/v3/rap-stashes/${guid}/${sortKey}`,
      params: {token: authToken}
    });
  }
}

function save(ccBaseUrl, authToken, requester, rapInvocationId) {
  return function (sortKey, guid, data) {
    return requester({
      method: 'POST',
      url: `${ccBaseUrl}/api/v3/rap-stashes`,
      params: {token: authToken},
      data: {
        id: guid,
        sortKey,
        dataMap: data,
        rapInvocationGuid: rapInvocationId
      }
    });
  }
}

