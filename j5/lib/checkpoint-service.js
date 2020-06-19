'use strict';

const _ = require('lodash');
const {request} = require('./request-service');

module.exports = init;

function init(context, LOGGER) {
  const requester = request(context, LOGGER);
  const ccBaseUrl = context.ccBaseUrl;
  const authToken = context.authToken;
  const rapInvocationId = _.get(context, 'invocation.id');
  return {
    save: save(context, ccBaseUrl, authToken, requester, rapInvocationId),
    get: get(context, ccBaseUrl, authToken, requester, rapInvocationId),
    isNotComplete: isNotComplete(context, ccBaseUrl, authToken, requester, rapInvocationId),
  }
}

function isNotComplete(context, ccBaseUrl, authToken, requester, rapInvocationId) {
  const getFunc = get(context, ccBaseUrl, authToken, requester, rapInvocationId);
  return async function (checkpointName) {
    return !(await getFunc(checkpointName));
  };
}

function get(context, ccBaseUrl, authToken, requester, rapInvocationId) {
  return async function (checkpointName) {
    const requestConfig = {
      url: `${ccBaseUrl}/api/v3/rap-invocations/${rapInvocationId}`,
      method: 'GET',
      params: {token: authToken}
    };
    const currentInvocation = await requester(requestConfig);
    if (currentInvocation.error) {
      throw new Error(`Unable to get Invocation State: ${JSON.stringify(currentInvocation.error)}`)
    }
    const checkpoint = (_.get(currentInvocation, `data.state.checkpoints.${checkpointName}`, {}));
    return checkpoint && checkpoint.complete;
  }
}

function save(context, ccBaseUrl, authToken, requester, rapInvocationId) {
  return function (checkpointName, checkpointDescription) {

    if (!_.isString(checkpointName)) {
      throw new Error('Illegal Checkpoint Name');
    }

    const state = {
      checkpoints: {
        [checkpointName]: {
          description: checkpointDescription,
          complete: true,
          completedOn: (new Date()).toISOString()
        }
      }
    };

    const requestConfig = {
      url: `${ccBaseUrl}/api/v3/rap-invocations/${rapInvocationId}`,
      method: 'PUT',
      params: {token: authToken},
      data: {id: rapInvocationId, state, status: 'executing'}
    };
    //TODO what to do if a checkpoint save fails.
    return requester(requestConfig);
  }
}
