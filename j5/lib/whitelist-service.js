const _ = require('lodash');
const {request} = require('./request-service');

module.exports = {
  fetchDataWhitelist,
  filterDirectContext,
  filterIndirectContext,
};


async function fetchDataWhitelist(LOGGER, context) {
  const requester = request(null, LOGGER);
  const ccBaseUrl = context.ccBaseUrl;
  const authToken = context.authToken;
  const requestConfig = {
    url: `${ccBaseUrl}/api/v3/raps/${context.invocation.rapId}/whitelist`,
    method: 'GET',
    params: {token: authToken, size: 1000}
  };
  const response = await requester(requestConfig);
  if (response.error) {
    LOGGER.error(`Whitelist Fetch Error ${response.error.errorDetails.message}`, {error: response.error});
    throw new Error("Whitelist Fetch Error");
  }
  return response.data.content;
}

function filterIndirectContext(whitelist, context) {
  return filterContext(whitelist, context, false);
}

function filterDirectContext(whitelist, context) {
  return filterContext(whitelist, context, true);
}


function filterContext(whitelist, context, directOnly) {
  const filtered = {};
  if (!whitelist) {
    return filtered;
  }
  for (const topLevelKey of _.keys(context)) {
    for (const entry of whitelist) {
      if (!entry.direct && directOnly) {
        continue;
      }
      const path = entry.path.split('/');
      if (path.length == 0) {
        continue;
      }
      path.unshift(topLevelKey);
      const setValue = _.get(context, path);
      if (!setValue) {
        continue;
      }
      _.set(filtered, path, setValue)
    }
  }
  return filtered;
}