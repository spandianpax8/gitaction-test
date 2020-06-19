'use strict';

const _ = require('lodash');
const {request} = require('./request-service');

module.exports = init;

function init(context, LOGGER) {
  const requester = request(context, LOGGER);
  const ccBaseUrl = context.ccBaseUrl;
  const authToken = context.authToken;
  const rapInvocationId = _.get(context,'invocation.id');
  return {
    send: send(context, ccBaseUrl, authToken, requester, rapInvocationId)
  }
}


function send(context, ccBaseUrl, authToken, requester, rapInvocationId) {
  return function (templateName) {

    if (!_.isString(templateName)) {
      throw new Error("Illegal Email Template Name");
    }

    const newEmailState = {
      [templateName]: 'sent'
    };

    const requestConfig = {
      url: `${ccBaseUrl}/api/v3/rap-invocations/${rapInvocationId}`,
      method: 'PUT',
      params: {token: authToken},
      data: {id: rapInvocationId, state: {emails: newEmailState}, status: 'executing'}
    };
    return requester(requestConfig);
  }
}
