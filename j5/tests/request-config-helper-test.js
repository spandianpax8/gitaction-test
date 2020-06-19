const expect = require('chai').expect;
const requestConfigHelper = require('../lib/request-config-helper');


describe('requestConfigHelper', () => {

  it('should test callbackConfigToRequestConfig', () => {
    const callbackConfig = {
      url: 'http://example.com',
      method: 'POST',
      params: {a:1, b:2},
      headers: {c:3, d:4}
    };

    const requestConfig = requestConfigHelper.callbackConfigToRequestConfig(callbackConfig, null);

    expect(requestConfig.url === callbackConfig.url);
    expect(requestConfig.method === callbackConfig.method);
    expect(requestConfig.params).to.deep.equal(callbackConfig.params);
    expect(requestConfig.headers).to.deep.equal(callbackConfig.headers);
    expect(requestConfig.data).to.not.exist;

    const data = {some:'data'};
    const requestConfigWithData = requestConfigHelper.callbackConfigToRequestConfig(callbackConfig, data);

    expect(requestConfigWithData.url === callbackConfig.url);
    expect(requestConfigWithData.method === callbackConfig.method);
    expect(requestConfigWithData.params).to.deep.equal(callbackConfig.params);
    expect(requestConfigWithData.headers).to.deep.equal(callbackConfig.headers);
    expect(requestConfigWithData.data).deep.equal(data);



  });

});

