'use strict';

module.exports = {
  callbackConfigToRequestConfig
};

function callbackConfigToRequestConfig(configuration, data) {
  const requestConfig = {
    url: configuration.url,
    method: configuration.method,
    params: configuration.params,
    headers: configuration.headers,
  };
  if (data) {
    requestConfig.data = data;
  }
  return requestConfig;
}
