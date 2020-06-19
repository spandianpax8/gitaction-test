const _ = require('lodash');
const {request} = require('./request-service');
const {platformRequest} = require('./platform-request-service');

module.exports = {
  init,
  omit,
};


function init(indirectContext, context, LOGGER) {
  const requestClient = request(indirectContext, LOGGER);
  const adminPlatformRequestClient = platformRequest(indirectContext, context.authToken, context.ccBaseUrl, LOGGER);
  const token = tokenService();
  const runningContext = context.context;

  return {
    call,
  };

  function tokenService() {
    const tokens = {};
    const refreshPromises = {};

    return {
      get,
      refresh,
    };

    function getKey(config) {
      if(config.pax8) {
        return 'pax8Token';
      } else if(config.company) {
        return 'companyToken'
      }
      return 'partnerToken';
    }

    async function get(config) {
      return Promise.resolve(getToken(config));
    }

    async function refresh(config) {
      const key = getKey(config);
      let promise;
      if(refreshPromises[key]) {
        promise = refreshPromises[key];
      } else {
        promise = refreshToken(config)
          .then(handleTokenResponse);
        refreshPromises[key] = promise;
      }

      // return the cached promise in case there is already a request in flight
      return promise;

      function handleTokenResponse(r) {
        if(r.error) {
          LOGGER.error(`unable to refresh token for ${key}`);
          throw new Error("refresh token failed");
        }
        setToken(r.data, config);
        // remove the fact that we have tried to refresh for this token so that we can try again later
        refreshPromises[key] = null;
        return getToken(config);
      }
    }

    function refreshToken(config) {
      const token = getToken(config);
      const id = config.company ? token.companyId : token.partnerId;
      return adminPlatformRequestClient({
        url: `/api/v3/access-tokens/${id}/vendors/${token.vendor.id}/${token.meta.type}`,
        method: 'POST',
      });
    }

    function getToken(config) {
      const key = getKey(config);
      if(!_.get(tokens, key, null)) _.set(tokens, key, _.get(runningContext, key));
      return _.get(tokens, key);
    }

    function setToken(value, config) {
      const key = getKey(config);
      if(!key) {
        throw new Error('Tried setting token with invalid config')
      }
      _.set(tokens, key, value);
    }

  }

  async function call(config) {
    if(!config.url) throw new Error("you need a Url in your microsoft call");
    const theConfig = composeConfig(config);
    // get the token
    let tokenData = await token.get(theConfig);
    if(!tokenData) throw new Error(`There was an error getting the configuration for token`);

    // try to make a call
    const call = composeCall();
    let response = await call(tokenData);

    if(response.error) {
      LOGGER.info('There was an error talking to microsoft refresh token and try again');
      tokenData = await token.refresh(theConfig);
      response = await call(tokenData);
      if(response.error) {
        throw new Error(composeError(response.error))
      }
    }
    return response;

    function composeCall() {
      return function(tokenData) {
        return requestClient({
          url: theConfig.url,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${tokenData.token}`
          },
          method: theConfig.method || 'GET',
          data: theConfig.data,
          params: theConfig.params,
        })
      }
    }

    function composeConfig(userConfig) {
      return {
        pax8: false,
        company: false,
        ...userConfig,
      };
    }
  }
}

function omit(context) {
  return _.omit(context, [
    'pax8Token',
  ]);
}


function composeError(responseError) {
  const defaultError = 'Error Calling Microsoft';
  const rawJSON = _.get(responseError, 'errorDetails.text', null);
  if(!rawJSON) return defaultError;
  let result;
  try {
    result = JSON.parse(rawJSON);
  } catch(e) {
    return defaultError
  }
  return result.error.message;
}
